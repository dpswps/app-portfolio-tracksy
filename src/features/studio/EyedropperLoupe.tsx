"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

function rgbToHex(r: number, g: number, b: number) {
  return (
    "#" +
    [r, g, b]
      .map((c) => c.toString(16).padStart(2, "0").toUpperCase())
      .join("")
  );
}

export default function EyedropperLoupe() {
  const active = useAppStore((s) => s.studioEyedropperActive);
  const setActive = useAppStore((s) => s.setStudioEyedropperActive);
  const bg = useAppStore((s) => s.studioBackground);
  const activeTextId = useAppStore((s) => s.studioActiveTextId);
  const activeCardField = useAppStore((s) => s.studioActiveCardField);
  const updateText = useAppStore((s) => s.updateStudioText);
  const setCardTextColor = useAppStore((s) => s.setStudioCardTextColor);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const showToast = useAppStore((s) => s.showToast);

  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const draggingRef = useRef(false);
  const pushedRef = useRef(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState<string>("#FFFFFF");

  // Load the background image into a canvas so we can read individual pixels.
  useEffect(() => {
    if (!active || !bg) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        showToast("스포이드를 불러올 수 없어요");
        setActive(false);
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvasRef.current = canvas;
      ctxRef.current = ctx;
    };
    img.onerror = () => {
      showToast("이미지를 불러올 수 없어요");
      setActive(false);
    };
    img.src = bg;
    return () => {
      canvasRef.current = null;
      ctxRef.current = null;
    };
  }, [active, bg, setActive, showToast]);

  if (!active) return null;
  if (!bg) {
    showToast("먼저 배경 사진을 등록해주세요");
    setActive(false);
    return null;
  }

  // Map a card-relative point to a pixel on the source image, taking the
  // current `background-size: cover` mapping into account.
  const sample = (cardX: number, cardY: number): string | null => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!ctx || !canvas || !overlay) return null;
    const r = overlay.getBoundingClientRect();
    const cardW = r.width;
    const cardH = r.height;
    const imgW = canvas.width;
    const imgH = canvas.height;
    const imgRatio = imgW / imgH;
    const cardRatio = cardW / cardH;
    let scale: number, offsetX: number, offsetY: number;
    if (imgRatio > cardRatio) {
      scale = cardH / imgH;
      offsetX = (cardW - imgW * scale) / 2;
      offsetY = 0;
    } else {
      scale = cardW / imgW;
      offsetX = 0;
      offsetY = (cardH - imgH * scale) / 2;
    }
    const ix = Math.round((cardX - offsetX) / scale);
    const iy = Math.round((cardY - offsetY) / scale);
    if (ix < 0 || iy < 0 || ix >= imgW || iy >= imgH) return null;
    try {
      const data = ctx.getImageData(ix, iy, 1, 1).data;
      return rgbToHex(data[0], data[1], data[2]);
    } catch {
      return null;
    }
  };

  const updateFromEvent = (e: React.PointerEvent) => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const r = overlay.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    setPos({ x: cx, y: cy });
    const c = sample(cx, cy);
    if (c) setColor(c);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    pushedRef.current = false;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    updateFromEvent(e);
  };

  // Update preview on every pointermove (including hover) so the loupe
  // follows the cursor without needing to click first.
  const onPointerMove = (e: React.PointerEvent) => {
    updateFromEvent(e);
  };

  // Commit on pointerup whether the user dragged or just clicked.
  const onPointerUp = (e: React.PointerEvent) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    }
    // 스포이드 적용 대상: 텍스트 오버레이가 active 면 그쪽, 아니면
    // 카드 빌트인 필드(weekTitle/distance/time/pace/calories/bubble).
    // 이전엔 텍스트 오버레이만 받아서 카드 필드에 색이 안 들어갔음.
    if (activeTextId != null) {
      if (!pushedRef.current) {
        pushHistory();
        pushedRef.current = true;
      }
      updateText(activeTextId, { color });
    } else if (activeCardField) {
      if (!pushedRef.current) {
        pushHistory();
        pushedRef.current = true;
      }
      setCardTextColor(activeCardField, color);
    } else {
      showToast("먼저 텍스트를 선택해주세요");
    }
    setActive(false);
  };

  return (
    <div
      ref={overlayRef}
      className="eyedropper-overlay"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {pos && (
        <>
          {/* Big teardrop above the finger so it isn't occluded */}
          <div
            className="eyedropper-drop"
            style={{ left: pos.x, top: pos.y - 22 }}
          >
            <span className="eyedropper-drop-fill" style={{ background: color }} />
          </div>
          {/* Tiny ring with center dot at the exact sampled pixel */}
          <div
            className="eyedropper-pin"
            style={{ left: pos.x, top: pos.y }}
            aria-hidden
          />
        </>
      )}
    </div>
  );
}
