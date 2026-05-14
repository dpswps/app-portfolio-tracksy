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
  layerOpacity = 1,
  onPointerDown,
  onChange,
  onBlur,
  onCommit,
  onRemove,
}: {
  t: TextItem;
  isActive: boolean;
  /** 레이어 패널에서 설정된 불투명도(0~1). 기본 1. */
  layerOpacity?: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onChange: (text: string) => void;
  onBlur: () => void;
  onCommit: () => void;
  onRemove: () => void;
}) {
  const editRef = useRef<HTMLDivElement>(null);
  const editedRef = useRef(false);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);

  useEffect(() => {
    if (editRef.current && editRef.current.innerText !== t.text) {
      editRef.current.innerText = t.text;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        opacity: layerOpacity,
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
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.currentTarget as HTMLDivElement).blur();
            onCommit();
          }
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
  const hidden = useAppStore((s) => s.studioHiddenLayers);
  const locked = useAppStore((s) => s.studioLockedLayers);
  const opacities = useAppStore((s) => s.studioLayerOpacities);
  const activeId = useAppStore((s) => s.studioActiveTextId);
  const setActive = useAppStore((s) => s.setActiveStudioText);
  const updateText = useAppStore((s) => s.updateStudioText);
  const removeText = useAppStore((s) => s.removeStudioText);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const containerRef = useRef<HTMLDivElement>(null);
  const DRAG_THRESHOLD = 6;
  const dragRef = useRef<{
    id: number | null;
    pointerId: number | null;
    target: Element | null;
    startX: number;
    startY: number;
    startPctX: number;
    startPctY: number;
    captured: boolean;
    pushed: boolean;
  }>({
    id: null,
    pointerId: null,
    target: null,
    startX: 0,
    startY: 0,
    startPctX: 0,
    startPctY: 0,
    captured: false,
    pushed: false,
  });

  const onPointerDownItem =
    (id: number, x: number, y: number) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (locked[`text-${id}`]) return;
      e.stopPropagation();
      setActive(id);
      dragRef.current = {
        id,
        pointerId: e.pointerId,
        target: e.currentTarget,
        startX: e.clientX,
        startY: e.clientY,
        startPctX: x,
        startPctY: y,
        captured: false,
        pushed: false,
      };
    };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (d.id == null) return;
    const el = containerRef.current;
    if (!el) return;
    const rawDX = e.clientX - d.startX;
    const rawDY = e.clientY - d.startY;
    if (!d.captured) {
      if (Math.abs(rawDX) < DRAG_THRESHOLD && Math.abs(rawDY) < DRAG_THRESHOLD) {
        return;
      }
      d.captured = true;
      try {
        d.target?.setPointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
      if (!d.pushed) {
        pushHistory();
        d.pushed = true;
      }
      const active = document.activeElement as HTMLElement | null;
      if (active && active.classList.contains("stx-edit")) {
        active.blur();
      }
    }
    const r = el.getBoundingClientRect();
    const dx = (rawDX / r.width) * 100;
    const dy = (rawDY / r.height) * 100;
    const x = Math.max(0, Math.min(100, d.startPctX + dx));
    const y = Math.max(0, Math.min(100, d.startPctY + dy));
    updateText(d.id, { x, y });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (d.captured && d.target) {
      try {
        d.target.releasePointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
    }
    dragRef.current = {
      id: null,
      pointerId: null,
      target: null,
      startX: 0,
      startY: 0,
      startPctX: 0,
      startPctY: 0,
      captured: false,
      pushed: false,
    };
  };

  return (
    <div
      ref={containerRef}
      className="text-overlay"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {texts
        .filter((t) => !hidden[`text-${t.id}`])
        .map((t) => {
          const op = opacities[`text-${t.id}`];
          // 레이어 opacity (0~100). 미설정 시 100으로 간주.
          const layerOpacity = op != null ? op / 100 : 1;
          return (
            <StxItem
              key={t.id}
              t={t}
              isActive={activeId === t.id}
              layerOpacity={layerOpacity}
              onPointerDown={onPointerDownItem(t.id, t.x, t.y)}
              onChange={(text) => updateText(t.id, { text })}
              onBlur={() => {
                const current = useAppStore
                  .getState()
                  .studioTexts.find((x) => x.id === t.id);
                if (current && current.text.trim() === "") removeText(t.id);
              }}
              onCommit={() => {
                const current = useAppStore
                  .getState()
                  .studioTexts.find((x) => x.id === t.id);
                if (current && current.text.trim() === "") {
                  removeText(t.id);
                } else {
                  setActive(null);
                }
              }}
              onRemove={() => removeText(t.id)}
            />
          );
        })}
    </div>
  );
}
