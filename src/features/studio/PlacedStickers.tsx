"use client";

import { useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

const DRAG_THRESHOLD = 5;

export default function PlacedStickers() {
  const stickers = useAppStore((s) => s.placedStickers);
  const hidden = useAppStore((s) => s.studioHiddenLayers);
  const locked = useAppStore((s) => s.studioLockedLayers);
  const opacities = useAppStore((s) => s.studioLayerOpacities);
  const layerOrder = useAppStore((s) => s.studioLayerOrder);
  const removeSticker = useAppStore((s) => s.removeSticker);
  const updateSticker = useAppStore((s) => s.updatePlacedSticker);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const setDragging = useAppStore((s) => s.setStudioDraggingContent);
  const setOverTrash = useAppStore((s) => s.setStudioDraggingOverTrash);

  /** 휴지통 hit-test 헬퍼 */
  const getTrashRect = (): DOMRect | null => {
    if (typeof document === "undefined") return null;
    const el = document.querySelector<HTMLElement>(".studio-trash-zone");
    return el ? el.getBoundingClientRect() : null;
  };
  const isOverRect = (
    rect: DOMRect | null,
    x: number,
    y: number,
  ): boolean => {
    if (!rect) return false;
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  };
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
    // Locked sticker: 이동/삭제 모두 차단.
    if (locked[`sticker-${id}`]) return;
    e.stopPropagation();
    // preventDefault — 모바일에서 터치 시 브라우저의 기본 동작(스크롤/줌)을 차단.
    // touch-action: none 과 함께 이중 안전망. 일부 안드로이드 크롬에서 pointerdown
    // 자체가 passive 로 처리되어 호출이 무시될 수 있으니 try-catch.
    try {
      e.preventDefault();
    } catch {
      /* passive listener 면 무시됨 */
    }
    // setPointerCapture 도 실패할 수 있으니 옵셔널 호출 + 가드.
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
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
    // 캔버스 하단 휴지통 노출 — 텍스트와 동일한 통합 UX.
    setDragging({ kind: "sticker", id });
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
    // trash zone hit-test
    setOverTrash(isOverRect(getTrashRect(), e.clientX, e.clientY));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (d.id == null || d.pointerId !== e.pointerId) return;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    const id = d.id;
    const droppedOnTrash = isOverRect(getTrashRect(), e.clientX, e.clientY);
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
    // 휴지통 위에서 드롭 → 삭제. 그 외엔 위치만 변경 + 탭은 무동작(선택만 유지).
    if (droppedOnTrash) {
      removeSticker(id);
    }
    setDragging(null);
    setOverTrash(false);
  };

  return (
    <div ref={containerRef} className="placed-stickers">
      {stickers
        .filter((p) => !hidden[`sticker-${p.id}`])
        .map((p) => {
          const key = `sticker-${p.id}`;
          const op = opacities[key];
          const layerOpacity = op != null ? op / 100 : 1;
          // 통합 layerOrder 기반 z-index — 텍스트와 자유 reorder.
          const zIdx = layerOrder.indexOf(key);
          const zIndex = zIdx >= 0 ? zIdx + 1 : undefined;
          return (
          <button
            key={p.id}
            className="placed-sticker"
            style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: layerOpacity, zIndex }}
            onPointerDown={onPointerDown(p.id, p.x, p.y)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label={`${p.emoji}`}
            title="드래그로 이동, 휴지통으로 끌어서 삭제"
          >
            {/* emoji 필드는 실제 이모지(예: "🏃") 또는 이미지 경로("/stickers/happy.png")
                둘 다 받음. "/"로 시작하면 이미지로 렌더, 그 외엔 텍스트로. */}
            {p.emoji.startsWith("/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.emoji}
                alt=""
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            ) : (
              p.emoji
            )}
          </button>
          );
        })}
    </div>
  );
}
