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
  /** 드래그로 array index 이동이 가능한지 (text/sticker만). card/bg는 고정. */
  reorderable: boolean;
  /** 삭제 가능 여부 — text/sticker만. */
  deletable: boolean;
  /** 사용자 정의 이름 변경 가능 여부. */
  renameable: boolean;
};

/* ──────────────────────────────────────────────────────────
 * SVG 아이콘 — 다크 보라톤에 맞게 currentColor 사용.
 * 패널 UI의 모든 아이콘은 라이트한 라인 스타일로 통일.
 * ────────────────────────────────────────────────────────── */
function EyeIcon({ open }: { open: boolean }) {
  if (!open) {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
        <path d="M3 12s3.5-6 9-6c2 0 3.7.7 5.1 1.6M21 12s-3.5 6-9 6c-2 0-3.7-.7-5.1-1.6M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
    </svg>
  );
}
function LockClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function LockOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 0 1 7-1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function DragHandleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
      <circle cx="9" cy="6" r="1.4" fill="currentColor" />
      <circle cx="15" cy="6" r="1.4" fill="currentColor" />
      <circle cx="9" cy="12" r="1.4" fill="currentColor" />
      <circle cx="15" cy="12" r="1.4" fill="currentColor" />
      <circle cx="9" cy="18" r="1.4" fill="currentColor" />
      <circle cx="15" cy="18" r="1.4" fill="currentColor" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M6.5 7l1 12.5A1.5 1.5 0 0 0 9 21h6a1.5 1.5 0 0 0 1.5-1.5L17.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CardThumbIcon() {
  return (
    <svg viewBox="0 0 32 22" width="28" height="20" fill="none">
      <rect x="1" y="1" width="30" height="20" rx="3" fill="#1a0f2e" stroke="#5b3fa8" strokeWidth="1" />
      <circle cx="24" cy="6.5" r="1.6" fill="#c4b5fd" />
      <rect x="4" y="5" width="11" height="2.2" rx="1" fill="#e9d5ff" />
      <rect x="4" y="9.5" width="7" height="1.6" rx="0.8" fill="#a78bfa" />
      <rect x="4" y="13" width="9" height="1.6" rx="0.8" fill="#a78bfa" />
      <rect x="4" y="16.5" width="6" height="1.6" rx="0.8" fill="#a78bfa" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────
 * 레이어 이름 — 더블클릭으로 인라인 편집.
 * ────────────────────────────────────────────────────────── */
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
  const opacities = useAppStore((s) => s.studioLayerOpacities);
  const selectedKey = useAppStore((s) => s.studioSelectedLayerKey);
  const setSelected = useAppStore((s) => s.setStudioSelectedLayer);
  const toggleVisible = useAppStore((s) => s.toggleLayerVisibility);
  const toggleLock = useAppStore((s) => s.toggleLayerLock);
  const setLayerName = useAppStore((s) => s.setLayerName);
  const setLayerOpacity = useAppStore((s) => s.setLayerOpacity);
  const moveText = useAppStore((s) => s.moveStudioTextTo);
  const moveSticker = useAppStore((s) => s.movePlacedStickerTo);
  const removeText = useAppStore((s) => s.removeStudioText);
  const removeSticker = useAppStore((s) => s.removeSticker);

  const [renamingKey, setRenamingKey] = useState<string | null>(null);

  /* ──────────────────────────────────────────────────────────
   * 드래그 reorder 상태 — 한 번에 하나의 row만 드래그됨.
   *
   * 동작 흐름:
   *  1) onPointerDown: 350ms 타이머 시작 + 시작 좌표 기록.
   *  2) 타이머 만료 전 손이 움직이면 (DRAG_THRESHOLD 초과) → 평범한 클릭으로 간주, 드래그 취소.
   *  3) 타이머 만료 → "지금부터 드래그 모드" 활성. CSS class 토글 + 햅틱(가능하면) 트리거.
   *  4) onPointerMove: 활성 상태에서 드래그 오프셋 추적 → 위치 기반으로 target index 계산.
   *  5) onPointerUp: 활성 상태였으면 move 액션 호출.
   * ────────────────────────────────────────────────────────── */
  type DragState = {
    pointerId: number;
    rowKey: string;
    rowKind: RowKind;
    refId: number;
    startClientY: number;
    rowStartTop: number;
    rowHeight: number;
    listTop: number;
    listBottom: number;
    longPressTimer: number | null;
    active: boolean;
    /** 드래그 시작 시점의 visible rows (top→bottom 순서) — index 계산 기준. */
    rows: { key: string; kind: RowKind; refId?: number }[];
    /** 현재 target index (visible rows 기준). */
    currentTargetIdx: number;
  } | null;
  const dragRef = useRef<DragState>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // 즉시 드래그 모드 — 더 이상 long-press / cancel threshold 사용 안 함.

  if (!open) return null;

  /* ──────────────────────────────────────────────────────────
   * Row 목록 만들기 — 위(앞쪽)부터 차례로:
   *   stickers (역순 — 최근에 추가된 것이 위)
   *   texts    (역순)
   *   card
   *   bg
   * ────────────────────────────────────────────────────────── */
  const rows: LayerRow[] = [];
  stickers.slice().reverse().forEach((s) => {
    // emoji 필드가 이미지 경로인지 진짜 이모지인지에 따라 썸네일을 다르게 그림.
    const isImg = s.emoji.startsWith("/");
    rows.push({
      key: `sticker-${s.id}`,
      kind: "sticker",
      refId: s.id,
      defaultName: isImg
        ? `스티커 ${s.emoji.split("/").pop()?.replace(/\.[^.]+$/, "") ?? ""}`
        : `Sticker ${s.emoji}`,
      preview: isImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s.emoji}
          alt=""
          style={{ width: 22, height: 22, objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: 18, lineHeight: 1 }}>{s.emoji}</span>
      ),
      reorderable: true,
      deletable: true,
      renameable: true,
    });
  });
  texts.slice().reverse().forEach((t) => {
    rows.push({
      key: `text-${t.id}`,
      kind: "text",
      refId: t.id,
      defaultName: t.text || "텍스트",
      preview: (
        // 라이트 라벤더 패널 배경에서 텍스트 색(특히 흰색)이 묻히지 않도록
        // 썸네일은 사용자 텍스트 색을 작은 swatch 로 보여주고, "T" 글자는
        // 항상 어두운 보라(--lp-text)로 또렷하게 표시.
        <span
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              right: 3,
              bottom: 3,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: t.color,
              border: "1px solid rgba(0,0,0,0.15)",
            }}
          />
          <span
            style={{
              fontFamily: t.font,
              fontWeight: 800,
              fontStyle: t.fontStyle ?? "normal",
              color: "var(--lp-text)",
              fontSize: 14,
              lineHeight: 1,
            }}
          >
            T
          </span>
        </span>
      ),
      reorderable: true,
      deletable: true,
      renameable: true,
    });
  });
  rows.push({
    key: "card",
    kind: "card",
    defaultName: "Running Card",
    preview: <CardThumbIcon />,
    reorderable: false,
    deletable: false,
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
          backgroundColor: bg ? undefined : "#1a0f2e",
        }}
      />
    ),
    italic: true,
    reorderable: false,
    deletable: false,
    renameable: true,
  });

  const startRename = (key: string) => setRenamingKey(key);
  const commitRename = (key: string, value: string) => {
    setLayerName(key, value);
    setRenamingKey(null);
  };
  const cancelRename = () => setRenamingKey(null);

  const handleRowClick = (row: LayerRow) => {
    if (row.kind === "text") setTab("text");
    setSelected(row.key);
  };

  const handleDelete = () => {
    if (!selectedKey) return;
    if (selectedKey.startsWith("text-")) {
      removeText(Number(selectedKey.slice(5)));
    } else if (selectedKey.startsWith("sticker-")) {
      removeSticker(Number(selectedKey.slice(8)));
    }
  };

  /* 선택된 레이어의 현재 불투명도 (default 100). */
  const selectedOpacity =
    selectedKey != null && opacities[selectedKey] != null
      ? opacities[selectedKey]
      : 100;

  /* ──────────────────────────────────────────────────────────
   * 드래그 시작 / 이동 / 종료 핸들러
   *
   * pointerdown 즉시 드래그 모드 활성화 (long-press 없음).
   * 같은 종류(text↔text, sticker↔sticker) 안에서만 reorder.
   * 드롭 위치는 현재 pointer 가 가리키는 row 사이의 보라 라인으로 또렷하게 표시.
   * ────────────────────────────────────────────────────────── */
  const onHandlePointerDown =
    (row: LayerRow) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (!row.reorderable || row.refId == null) return;
      if (locked[row.key]) return;
      e.stopPropagation();
      e.preventDefault();
      const targetEl = e.currentTarget;
      const rowEl = targetEl.closest(".lp-item") as HTMLElement | null;
      const listEl = listRef.current;
      if (!rowEl || !listEl) return;

      const rowRect = rowEl.getBoundingClientRect();
      const listRect = listEl.getBoundingClientRect();

      // 같은 종류만 reorder 대상으로 — visible rows 중 같은 kind만 필터
      const sameKindRows = rows.filter((r) => r.kind === row.kind);
      const initialTargetIdx = sameKindRows.findIndex((r) => r.key === row.key);

      const initial: DragState = {
        pointerId: e.pointerId,
        rowKey: row.key,
        rowKind: row.kind,
        refId: row.refId,
        startClientY: e.clientY,
        rowStartTop: rowRect.top,
        rowHeight: rowRect.height,
        listTop: listRect.top,
        listBottom: listRect.bottom,
        longPressTimer: null,
        active: true, // 즉시 활성화 — long-press 없음
        rows: sameKindRows.map((r) => ({ key: r.key, kind: r.kind, refId: r.refId })),
        currentTargetIdx: initialTargetIdx,
      };
      dragRef.current = initial;

      // 드래그 모드 즉시 진입 (UI 상태 갱신)
      setDraggingKey(row.key);
      setDragOverIdx(initialTargetIdx);

      try {
        targetEl.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      // 햅틱 (가능한 환경에서만)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(8);
        } catch {
          /* noop */
        }
      }
    };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;

    // pointer 가 가리키는 위치를 기준으로 target index 갱신.
    // 같은 kind 행들의 화면 위치를 다시 측정해서 어느 행의 위/아래에 떨어질지 판단.
    const listEl = listRef.current;
    if (!listEl) return;
    const items = Array.from(
      listEl.querySelectorAll<HTMLElement>(".lp-item"),
    );
    const sameKindEls = items.filter((el) =>
      d.rows.some((r) => r.key === el.dataset.key),
    );

    const pointerY = e.clientY;
    // 마지막 행보다 아래로 끌면 맨 끝(=d.rows.length)에 떨어뜨릴 수 있도록 처리.
    let target = d.rows.length;
    for (let i = 0; i < sameKindEls.length; i++) {
      const r = sameKindEls[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (pointerY < mid) {
        target = i;
        break;
      }
    }
    if (target !== d.currentTargetIdx) {
      d.currentTargetIdx = target;
      setDragOverIdx(target);
    }
  };

  const onHandlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) {
      return;
    }
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    if (d.active) {
      const fromIdx = d.rows.findIndex((r) => r.key === d.rowKey);
      // target이 자기 자신의 위치이거나 바로 다음 위치면 위치 변동 없음.
      const toIdx = d.currentTargetIdx;
      const wouldMove = toIdx !== fromIdx && toIdx !== fromIdx + 1;
      if (wouldMove) {
        // visible idx → store array idx 변환:
        //   visible은 top→bottom = front→back. store array는 마지막 원소가 front.
        //   visibleIdx → storeIdx = arr.length - 1 - visibleIdx
        //   단, drop은 "이 row 위에" 의미라 fromIdx보다 위로 가는지 아래로 가는지에 따라 보정.
        const sourceItems = d.rowKind === "text" ? texts : stickers;
        let visibleInsertIdx = toIdx;
        if (toIdx > fromIdx) visibleInsertIdx = toIdx - 1; // 아래로 이동 시 자기 자리만큼 보정
        const newStoreIdx = sourceItems.length - 1 - visibleInsertIdx;
        if (d.rowKind === "text") {
          moveText(d.refId, newStoreIdx);
        } else {
          moveSticker(d.refId, newStoreIdx);
        }
      }
    }
    dragRef.current = null;
    setDraggingKey(null);
    setDragOverIdx(null);
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
        <div className="lp-header">
          <span className="lp-header-title">레이어</span>
          <button
            className="lp-close-btn"
            aria-label="닫기"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        {/* 선택된 레이어의 불투명도 슬라이더. 선택이 없으면 비활성. */}
        <div className={`lp-opacity-row${selectedKey ? "" : " disabled"}`}>
          <span className="lp-opacity-label">불투명도</span>
          <input
            type="range"
            className="lp-opacity-slider"
            min={0}
            max={100}
            step={1}
            value={selectedOpacity}
            disabled={!selectedKey}
            onChange={(e) => {
              if (!selectedKey) return;
              setLayerOpacity(selectedKey, Number(e.target.value));
            }}
            aria-label="불투명도"
          />
          <span className="lp-opacity-value">{selectedOpacity}%</span>
        </div>

        <ul className="lp-list" ref={listRef}>
          {rows.map((r, visibleIdx) => {
            const isHidden = !!hidden[r.key];
            const isLocked = !!locked[r.key];
            const displayName = customNames[r.key] ?? r.defaultName;
            const isRenaming = renamingKey === r.key;
            const isSelected = selectedKey === r.key;
            const isDragging = draggingKey === r.key;

            // 같은 kind 안에서의 dropline 표시.
            //   showDropAbove: pointer가 이 row 위쪽 절반에 있을 때 — 이 row 위에 놓일 자리.
            //   showDropBelow: 같은 kind 마지막 row인데 pointer가 그 아래까지 갔을 때 — 끝에 놓일 자리.
            const sameKindRows = rows.filter((x) => x.kind === r.kind);
            const sameKindIdx = sameKindRows.findIndex((x) => x.key === r.key);
            const isLastSameKind = sameKindIdx === sameKindRows.length - 1;
            const isSameDragKind = dragRef.current?.rowKind === r.kind;
            const showDropAbove =
              draggingKey != null &&
              dragOverIdx != null &&
              isSameDragKind &&
              dragOverIdx === sameKindIdx &&
              !isDragging;
            const showDropBelow =
              draggingKey != null &&
              dragOverIdx != null &&
              isSameDragKind &&
              isLastSameKind &&
              dragOverIdx >= sameKindRows.length &&
              !isDragging;

            return (
              <li
                key={r.key}
                data-key={r.key}
                className={[
                  "lp-item",
                  isSelected ? "selected" : "",
                  isLocked ? "locked" : "",
                  isDragging ? "dragging" : "",
                  showDropAbove ? "drop-above" : "",
                  showDropBelow ? "drop-below" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
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
                <button
                  className={`lp-icon-btn lp-lock-btn${isLocked ? " on" : ""}`}
                  aria-label={isLocked ? "잠금 해제" : "잠금"}
                  title={isLocked ? "잠금 해제" : "잠금"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock(r.key);
                  }}
                >
                  {isLocked ? <LockClosedIcon /> : <LockOpenIcon />}
                </button>
                {r.reorderable ? (
                  <div
                    className="lp-drag-handle"
                    role="button"
                    aria-label="길게 눌러 드래그로 순서 변경"
                    title="길게 눌러 드래그"
                    onPointerDown={onHandlePointerDown(r)}
                    onPointerMove={onHandlePointerMove}
                    onPointerUp={onHandlePointerEnd}
                    onPointerCancel={onHandlePointerEnd}
                  >
                    <DragHandleIcon />
                  </div>
                ) : (
                  <span className="lp-drag-handle disabled" aria-hidden="true">
                    <DragHandleIcon />
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="lp-footer">
          <button
            className="lp-footer-btn lp-delete-btn"
            disabled={
              !selectedKey ||
              (!selectedKey.startsWith("text-") &&
                !selectedKey.startsWith("sticker-"))
            }
            onClick={handleDelete}
            title="선택한 레이어 삭제"
          >
            <TrashIcon />
            <span>선택 삭제</span>
          </button>
        </div>
      </aside>
    </>
  );
}
