"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

type RowKind = "sticker" | "text" | "card" | "bg";

type LayerRow = {
  key: string;
  kind: RowKind;
  defaultName: string;
  preview: React.ReactNode;
  italic?: boolean;
  refId?: number;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  renameable?: boolean;
};

function EyeIcon({ open }: { open: boolean }) {
  if (!open) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
        <path d="M4 12h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

function LockClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function LockOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 0 1 7-1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none">
      <path d="M6 14l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none">
      <path d="M6 10l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardThumbIcon() {
  return (
    <svg viewBox="0 0 32 22" width="28" height="20" fill="none">
      <rect x="1" y="1" width="30" height="20" rx="3" fill="#1f2937" stroke="#4b5563" strokeWidth="1" />
      <circle cx="24" cy="6.5" r="1.6" fill="#a78bfa" />
      <path d="M22 14l1.5-3 2 1.5 1.5-1.5" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="5" width="11" height="2.2" rx="1" fill="#e5e7eb" />
      <rect x="4" y="9.5" width="7" height="1.6" rx="0.8" fill="#9ca3af" />
      <rect x="4" y="13" width="9" height="1.6" rx="0.8" fill="#9ca3af" />
      <rect x="4" y="16.5" width="6" height="1.6" rx="0.8" fill="#9ca3af" />
    </svg>
  );
}

function LayerName({
  text,
  italic,
  editing,
  onStartEdit,
  onCommit,
  onCancel,
}: {
  text: string;
  italic?: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onCommit: (next: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(text);
  useEffect(() => {
    if (editing) {
      setDraft(text);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [editing, text]);
  if (!editing) {
    return (
      <span
        className={`lp-name${italic ? " italic" : ""}`}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onStartEdit();
        }}
        title="더블클릭으로 이름 변경"
      >
        {text}
      </span>
    );
  }
  return (
    <input
      ref={inputRef}
      className="lp-name-input"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit(draft);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
    />
  );
}

export default function LayerPanel() {
  const open = useAppStore((s) => s.studioLayerPanelOpen);
  const setOpen = useAppStore((s) => s.setStudioLayerPanelOpen);
  const bg = useAppStore((s) => s.studioBackground);
  const texts = useAppStore((s) => s.studioTexts);
  const stickers = useAppStore((s) => s.placedStickers);
  const setTab = useAppStore((s) => s.setStudioTab);
  const hidden = useAppStore((s) => s.studioHiddenLayers);
  const locked = useAppStore((s) => s.studioLockedLayers);
  const customNames = useAppStore((s) => s.studioLayerNames);
  const selectedKey = useAppStore((s) => s.studioSelectedLayerKey);
  const setSelected = useAppStore((s) => s.setStudioSelectedLayer);
  const toggleVisible = useAppStore((s) => s.toggleLayerVisibility);
  const toggleLock = useAppStore((s) => s.toggleLayerLock);
  const setLayerName = useAppStore((s) => s.setLayerName);
  const reorderText = useAppStore((s) => s.reorderStudioText);
  const reorderSticker = useAppStore((s) => s.reorderSticker);

  const [renamingKey, setRenamingKey] = useState<string | null>(null);

  if (!open) return null;

  const rows: LayerRow[] = [];

  stickers.slice().reverse().forEach((s, i) => {
    const arrIdx = stickers.length - 1 - i;
    rows.push({
      key: `sticker-${s.id}`,
      kind: "sticker",
      refId: s.id,
      defaultName: `Sticker ${s.emoji}`,
      preview: <span style={{ fontSize: 18, lineHeight: 1 }}>{s.emoji}</span>,
      canMoveUp: arrIdx < stickers.length - 1,
      canMoveDown: arrIdx > 0,
      renameable: true,
    });
  });

  texts.slice().reverse().forEach((t, i) => {
    const arrIdx = texts.length - 1 - i;
    rows.push({
      key: `text-${t.id}`,
      kind: "text",
      refId: t.id,
      defaultName: t.text || "텍스트",
      preview: (
        <span
          style={{
            fontFamily: t.font,
            fontWeight: t.fontWeight ?? 500,
            fontStyle: t.fontStyle ?? "normal",
            color: t.color,
            fontSize: 13,
            lineHeight: 1,
            display: "inline-block",
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
          }}
        >
          T
        </span>
      ),
      canMoveUp: arrIdx < texts.length - 1,
      canMoveDown: arrIdx > 0,
      renameable: true,
    });
  });

  rows.push({
    key: "card",
    kind: "card",
    defaultName: "Running Card",
    preview: <CardThumbIcon />,
    renameable: true,
  });

  rows.push({
    key: "bg",
    kind: "bg",
    defaultName: "Background",
    preview: (
      <div
        style={{
          width: 28,
          height: 20,
          backgroundImage: bg ? `url("${bg}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: bg ? undefined : "#ffffff",
        }}
      />
    ),
    italic: true,
    renameable: true,
  });

  const startRename = (key: string) => setRenamingKey(key);
  const commitRename = (key: string, value: string) => {
    setLayerName(key, value);
    setRenamingKey(null);
  };
  const cancelRename = () => setRenamingKey(null);

  const handleMove = (row: LayerRow, dir: "up" | "down") => {
    if (row.refId == null) return;
    if (row.kind === "text") reorderText(row.refId, dir);
    else if (row.kind === "sticker") reorderSticker(row.refId, dir);
  };

  const handleRowClick = (row: LayerRow) => {
    // For text rows, switching tabs is helpful so the user sees text tools.
    if (row.kind === "text") setTab("text");
    setSelected(row.key);
  };

  return (
    <>
      <button
        type="button"
        className="layer-panel-backdrop"
        aria-label="레이어 패널 닫기"
        onClick={() => setOpen(false)}
      />
      <aside className="layer-panel" role="dialog" aria-label="레이어">
        <div className="lp-tabs">
          <button className="lp-tab active">Layers</button>
          <button className="lp-tab" disabled>Channels</button>
          <button className="lp-tab" disabled>Paths</button>
          <button className="lp-tab-close" aria-label="닫기" onClick={() => setOpen(false)}>×</button>
        </div>

        <div className="lp-row lp-filter">
          <div className="lp-search">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none">
              <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>Kind</span>
            <span className="lp-caret">▾</span>
          </div>
          <div className="lp-mini-icons">
            <span>▢</span>
            <span>◐</span>
            <span>T</span>
            <span>◇</span>
            <span>▤</span>
            <span className="lp-dot" />
          </div>
        </div>

        <div className="lp-row lp-blend">
          <span className="lp-select">Normal <span className="lp-caret">▾</span></span>
          <span className="lp-pair">
            <em>Opacity:</em>
            <span className="lp-num">100%</span>
            <span className="lp-caret">▾</span>
          </span>
        </div>

        <div className="lp-row lp-lock">
          <em>Lock:</em>
          <span className="lp-lock-icons">
            <span title="Transparency">▢</span>
            <span title="Pixels">⬚</span>
            <span title="Position">+</span>
            <span title="Artboard">▣</span>
            <span title="All"><LockClosedIcon /></span>
          </span>
          <span className="lp-pair lp-fill">
            <em>Fill:</em>
            <span className="lp-num">100%</span>
            <span className="lp-caret">▾</span>
          </span>
        </div>

        <ul className="lp-list">
          {rows.map((r) => {
            const isHidden = !!hidden[r.key];
            const isLocked = !!locked[r.key];
            const displayName = customNames[r.key] ?? r.defaultName;
            const isRenaming = renamingKey === r.key;
            const isSelected = selectedKey === r.key;
            return (
              <li
                key={r.key}
                className={`lp-item${isSelected ? " selected" : ""}${isLocked ? " locked" : ""}`}
              >
                <button
                  className={`lp-eye${isHidden ? " off" : ""}`}
                  aria-label={isHidden ? "표시" : "숨기기"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisible(r.key);
                  }}
                >
                  <EyeIcon open={!isHidden} />
                </button>
                <div
                  className="lp-row-main"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (isRenaming) return;
                    handleRowClick(r);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(r);
                    }
                  }}
                >
                  <span className="lp-thumb">{r.preview}</span>
                  <LayerName
                    text={displayName}
                    italic={r.italic}
                    editing={isRenaming}
                    onStartEdit={() => r.renameable && startRename(r.key)}
                    onCommit={(next) => commitRename(r.key, next)}
                    onCancel={cancelRename}
                  />
                </div>
                <span className="lp-actions">
                  {(r.kind === "text" || r.kind === "sticker") && (
                    <>
                      <button
                        className="lp-mini-btn"
                        aria-label="앞으로 이동"
                        title="앞으로"
                        disabled={!r.canMoveUp}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(r, "up");
                        }}
                      >
                        <ChevronUpIcon />
                      </button>
                      <button
                        className="lp-mini-btn"
                        aria-label="뒤로 이동"
                        title="뒤로"
                        disabled={!r.canMoveDown}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMove(r, "down");
                        }}
                      >
                        <ChevronDownIcon />
                      </button>
                    </>
                  )}
                  <button
                    className={`lp-mini-btn lp-lock-btn${isLocked ? " on" : ""}`}
                    aria-label={isLocked ? "잠금 해제" : "잠금"}
                    title={isLocked ? "잠금 해제" : "잠금"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(r.key);
                    }}
                  >
                    {isLocked ? <LockClosedIcon /> : <LockOpenIcon />}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>

        <div className="lp-bottom">
          <span title="Link">∞</span>
          <span title="Style">fx</span>
          <span title="Mask">◉</span>
          <span title="Adjust">◑</span>
          <span title="Group">▭</span>
          <span title="New">＋</span>
          <span title="Delete">🗑</span>
        </div>
      </aside>
    </>
  );
}
