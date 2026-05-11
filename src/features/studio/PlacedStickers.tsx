"use client";

import { useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

const DRAG_THRESHOLD = 5;

export default function PlacedStickers() {
  const stickers = useAppStore((s) => s.placedStickers);
  const hidden = useAppStore((s) => s.studioHiddenLayers);
  const locked = useAppStore((s) => s.studioLockedLayers);
  const removeSticker = useAppStore((s) => s.removeSticker);
  const updateSticker = useAppStore((s) => s.updatePlacedSticker);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: number | null;
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    moved: boolean;
    pushed: boolean;
  }>({
    id: null,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    moved: false,
    pushed: false,
  });

  const onPointerDown = (
    id: number,
    x: number,
    y: number,
  ) => (e: React.PointerEvent<HTMLButtonElement>) => {
    // Locked sticker: ignore drag and tap-to-remove entirely.
    if (locked[`sticker-${id}`]) return;
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: x,
      startY: y,
      moved: false,
      pushed: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (d.id == null || d.pointerId !== e.pointerId) return;
    const dxPx = e.clientX - d.startClientX;
    const dyPx = e.clientY - d.startClientY;
    if (Math.abs(dxPx) < DRAG_THRESHOLD && Math.abs(dyPx) < DRAG_THRESHOLD) {
      return;
    }
    if (!d.moved) {
      d.moved = true;
      pushHistory();
      d.pushed = true;
    }
    const container = containerRef.current;
    if (!container) return;
    const r = container.getBoundingClientRect();
    const x = d.startX + (dxPx / r.width) * 100;
    const y = d.startY + (dyPx / r.height) * 100;
    updateSticker(d.id, {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (d.id == null || d.pointerId !== e.pointerId) return;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    const wasClick = !d.moved;
    const id = d.id;
    dragRef.current = {
      id: null,
      pointerId: null,
      startClientX: 0,
      startClientY: 0,
      startX: 0,
      startY: 0,
      moved: false,
      pushed: false,
    };
    if (wasClick) {
      removeSticker(id);
    }
  };

  return (
    <div ref={containerRef} className="placed-stickers">
      {stickers
        .filter((p) => !hidden[`sticker-${p.id}`])
        .map((p) => (
          <button
            key={p.id}
            className="placed-sticker"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onPointerDown={onPointerDown(p.id, p.x, p.y)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label={`${p.emoji}`}
            title="드래그로 이동, 탭으로 제거"
          >
            {p.emoji}
          </button>
        ))}
    </div>
  );
}
