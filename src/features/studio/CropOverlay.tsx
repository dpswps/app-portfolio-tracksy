"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

type Rect = { x: number; y: number; w: number; h: number }; // normalized 0..1

const HANDLES = [
  { key: "nw", cx: 0, cy: 0, cursor: "nwse-resize" },
  { key: "n", cx: 0.5, cy: 0, cursor: "ns-resize" },
  { key: "ne", cx: 1, cy: 0, cursor: "nesw-resize" },
  { key: "e", cx: 1, cy: 0.5, cursor: "ew-resize" },
  { key: "se", cx: 1, cy: 1, cursor: "nwse-resize" },
  { key: "s", cx: 0.5, cy: 1, cursor: "ns-resize" },
  { key: "sw", cx: 0, cy: 1, cursor: "nesw-resize" },
  { key: "w", cx: 0, cy: 0.5, cursor: "ew-resize" },
] as const;

type HandleKey = (typeof HANDLES)[number]["key"];

const MIN_SIZE = 0.1; // minimum 10% of card

export default function CropOverlay() {
  const bg = useAppStore((s) => s.studioBackground);
  const setBackground = useAppStore((s) => s.setStudioBackground);
  const setCropMode = useAppStore((s) => s.setStudioCropMode);
  const showToast = useAppStore((s) => s.showToast);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const dragRef = useRef<{
    type: "move" | HandleKey | null;
    startX: number;
    startY: number;
    startRect: Rect;
  }>({ type: null, startX: 0, startY: 0, startRect: rect });

  const containerSize = () => {
    const el = containerRef.current;
    if (!el) return { w: 1, h: 1 };
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height };
  };

  const onPointerDown = (type: "move" | HandleKey) => (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startRect: { ...rect },
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.type) return;
    const { w: cw, h: ch } = containerSize();
    const dx = (e.clientX - d.startX) / cw;
    const dy = (e.clientY - d.startY) / ch;
    let { x, y, w, h } = d.startRect;
    if (d.type === "move") {
      x = Math.max(0, Math.min(1 - w, x + dx));
      y = Math.max(0, Math.min(1 - h, y + dy));
    } else {
      const k = d.type;
      if (k.includes("w")) {
        const nx = Math.min(x + dx, x + w - MIN_SIZE);
        const clamped = Math.max(0, nx);
        w = w + (x - clamped);
        x = clamped;
      }
      if (k.includes("e")) {
        const nw = Math.max(MIN_SIZE, Math.min(1 - x, w + dx));
        w = nw;
      }
      if (k.includes("n")) {
        const ny = Math.min(y + dy, y + h - MIN_SIZE);
        const clamped = Math.max(0, ny);
        h = h + (y - clamped);
        y = clamped;
      }
      if (k.includes("s")) {
        const nh = Math.max(MIN_SIZE, Math.min(1 - y, h + dy));
        h = nh;
      }
    }
    setRect({ x, y, w, h });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current.type = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const cancel = () => setCropMode(false);

  const apply = () => {
    if (!bg) {
      setCropMode(false);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const sx = rect.x * img.naturalWidth;
      const sy = rect.y * img.naturalHeight;
      const sw = rect.w * img.naturalWidth;
      const sh = rect.h * img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        showToast("자르기에 실패했어요");
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      try {
        const dataUrl = canvas.toDataURL("image/png");
        setBackground(dataUrl);
        showToast("자르기 적용");
      } catch {
        showToast("자르기에 실패했어요");
      }
      setCropMode(false);
    };
    img.onerror = () => {
      showToast("이미지를 불러올 수 없어요");
      setCropMode(false);
    };
    img.src = bg;
  };

  // ESC closes crop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
      if (e.key === "Enter") apply();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect, bg]);

  const pct = (n: number) => `${n * 100}%`;

  return (
    <div
      ref={containerRef}
      className="crop-overlay"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* dark mask uses 4 panels around the crop rect */}
      <div
        className="crop-mask"
        style={{ left: 0, top: 0, width: "100%", height: pct(rect.y) }}
      />
      <div
        className="crop-mask"
        style={{ left: 0, top: pct(rect.y + rect.h), width: "100%", bottom: 0 }}
      />
      <div
        className="crop-mask"
        style={{ left: 0, top: pct(rect.y), width: pct(rect.x), height: pct(rect.h) }}
      />
      <div
        className="crop-mask"
        style={{
          left: pct(rect.x + rect.w),
          top: pct(rect.y),
          right: 0,
          height: pct(rect.h),
        }}
      />

      {/* crop window with grid + handles */}
      <div
        className="crop-window"
        style={{
          left: pct(rect.x),
          top: pct(rect.y),
          width: pct(rect.w),
          height: pct(rect.h),
        }}
        onPointerDown={onPointerDown("move")}
      >
        <div className="crop-grid">
          <span className="g-v" style={{ left: "33.333%" }} />
          <span className="g-v" style={{ left: "66.666%" }} />
          <span className="g-h" style={{ top: "33.333%" }} />
          <span className="g-h" style={{ top: "66.666%" }} />
        </div>
        {HANDLES.map((h) => (
          <span
            key={h.key}
            className={`crop-handle h-${h.key}`}
            style={{ left: pct(h.cx), top: pct(h.cy), cursor: h.cursor }}
            onPointerDown={onPointerDown(h.key)}
          />
        ))}
      </div>

      <div className="crop-actions">
        <button className="crop-btn crop-cancel" onClick={cancel}>
          취소
        </button>
        <button className="crop-btn crop-apply" onClick={apply}>
          적용
        </button>
      </div>
    </div>
  );
}
