"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

type TextItem = {
  id: number;
  text: string;
  x: number;
  y: number;
  size: number;
  font: string;
  fontWeight?: number | string;
  fontStyle?: string;
  color: string;
};

function StxItem({
  t,
  isActive,
  onPointerDown,
  onChange,
  onBlur,
  onRemove,
}: {
  t: TextItem;
  isActive: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onChange: (text: string) => void;
  onBlur: () => void;
  onRemove: () => void;
}) {
  const editRef = useRef<HTMLDivElement>(null);
  // Track whether the active edit session has already pushed a history entry,
  // so a single edit (multiple keystrokes) maps to one undo step.
  const editedRef = useRef(false);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);

  // Set initial text once on mount; do NOT keep React's children synced with
  // store, otherwise the DOM is replaced on every keystroke and the caret
  // jumps to the start.
  useEffect(() => {
    if (editRef.current && editRef.current.innerText !== t.text) {
      editRef.current.innerText = t.text;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When becoming active, focus and place caret at end. Reset the
  // "already-pushed" flag so the next edit session creates one history entry.
  useEffect(() => {
    if (!isActive) {
      editedRef.current = false;
      return;
    }
    if (!editRef.current) return;
    const el = editRef.current;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [isActive]);

  return (
    <div
      className={`stx${isActive ? " active" : ""}`}
      style={{
        left: `${t.x}%`,
        top: `${t.y}%`,
        transform: "translate(-50%, -50%)",
        fontFamily: t.font,
        fontWeight: t.fontWeight ?? 500,
        fontStyle: t.fontStyle ?? "normal",
        fontSize: `${t.size}px`,
        color: t.color,
      }}
      onPointerDown={onPointerDown}
    >
      <div
        ref={editRef}
        className="stx-edit"
        contentEditable={isActive}
        suppressContentEditableWarning
        spellCheck={false}
        onInput={(e) => {
          if (!editedRef.current) {
            pushHistory();
            editedRef.current = true;
          }
          onChange((e.currentTarget as HTMLDivElement).innerText);
        }}
        onBlur={onBlur}
      />
      {isActive && (
        <button
          className="stx-remove"
          aria-label="삭제"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function TextOverlay() {
  const texts = useAppStore((s) => s.studioTexts);
  const activeId = useAppStore((s) => s.studioActiveTextId);
  const setActive = useAppStore((s) => s.setActiveStudioText);
  const updateText = useAppStore((s) => s.updateStudioText);
  const removeText = useAppStore((s) => s.removeStudioText);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: number | null;
    startX: number;
    startY: number;
    startPctX: number;
    startPctY: number;
    moved: boolean;
    pushed: boolean;
  }>({ id: null, startX: 0, startY: 0, startPctX: 0, startPctY: 0, moved: false, pushed: false });

  const onPointerDownItem =
    (id: number, x: number, y: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      // Don't start drag if user is interacting with the editable element directly
      const target = e.target as HTMLElement;
      if (target.classList.contains("stx-edit") && activeId === id) {
        // already active and tapping inside text — let caret placement happen
        return;
      }
      e.stopPropagation();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      setActive(id);
      dragRef.current = {
        id,
        startX: e.clientX,
        startY: e.clientY,
        startPctX: x,
        startPctY: y,
        moved: false,
        pushed: false,
      };
    };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (d.id == null) return;
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = ((e.clientX - d.startX) / r.width) * 100;
    const dy = ((e.clientY - d.startY) / r.height) * 100;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
      d.moved = true;
      // push history once per drag, only when actual movement begins
      if (!d.pushed) {
        pushHistory();
        d.pushed = true;
      }
    }
    const x = Math.max(0, Math.min(100, d.startPctX + dx));
    const y = Math.max(0, Math.min(100, d.startPctY + dy));
    updateText(d.id, { x, y });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.id = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      ref={containerRef}
      className="text-overlay"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {texts.map((t) => (
        <StxItem
          key={t.id}
          t={t}
          isActive={activeId === t.id}
          onPointerDown={onPointerDownItem(t.id, t.x, t.y)}
          onChange={(text) => updateText(t.id, { text })}
          onBlur={() => {
            // remove if empty after editing
            const current = useAppStore.getState().studioTexts.find((x) => x.id === t.id);
            if (current && current.text.trim() === "") removeText(t.id);
          }}
          onRemove={() => removeText(t.id)}
        />
      ))}
    </div>
  );
}
