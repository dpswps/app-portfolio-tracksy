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
    // 드래그 중인 스티커 DOM — pointermove 마다 transform 을 직접 갱신해서
    // store 재렌더를 우회하기 위한 참조.
    target: HTMLElement | null;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    moved: boolean;
    pushed: boolean;
  }>({
    id: null,
    pointerId: null,
    target: null,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    moved: false,
    pushed: false,
  });
  // overTrash 캐시 — 같은 값 연속 set 으로 인한 TrashZone 재렌더 방지.
  const lastOverRef = useRef(false);

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
      target: e.currentTarget as HTMLElement,
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
    // 드래그 도중에는 store(=placedStickers) 를 매 프레임 갱신하지 않고
    // 스티커 DOM 의 transform 만 직접 업데이트 → 컴포넌트 재렌더 없이 60fps
    // 부드럽게 추적. 기존 CSS 의 `transform: translate(-50%, -50%)` 를 보존하면서
    // 추가로 translate(dxPx, dyPx) 를 합쳐 적용.
    if (d.target) {
      d.target.style.transform =
        `translate(-50%, -50%) translate(${dxPx}px, ${dyPx}px)`;
    }
    // trash zone hit-test — 값 변할 때만 store 갱신해서 TrashZone 재렌더 최소화.
    const nowOver = isOverRect(getTrashRect(), e.clientX, e.clientY);
    if (nowOver !== lastOverRef.current) {
      lastOverRef.current = nowOver;
      setOverTrash(nowOver);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (d.id == null || d.pointerId !== e.pointerId) return;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    const id = d.id;
    const target = d.target;
    const droppedOnTrash = isOverRect(getTrashRect(), e.clientX, e.clientY);

    // 휴지통 위에서 드롭 → 삭제 (위치 commit 불필요).
    if (droppedOnTrash) {
      // 인라인 transform 잔상을 제거해서 store 에서 사라지는 사이 잠깐 어색한
      // 위치로 보이지 않게.
      if (target) target.style.transform = "";
      removeSticker(id);
    } else if (d.moved) {
      // 드래그 종료 — 누적 픽셀 이동을 % 좌표로 환산해 store 에 한 번만 commit.
      // DOM transform 을 CSS 기본값으로 복원해서 다음 렌더와 inline 불일치 방지.
      const container = containerRef.current;
      if (container) {
        const r = container.getBoundingClientRect();
        const dxPx = e.clientX - d.startClientX;
        const dyPx = e.clientY - d.startClientY;
        const x = d.startX + (dxPx / r.width) * 100;
        const y = d.startY + (dyPx / r.height) * 100;
        if (target) target.style.transform = "";
        updateSticker(id, {
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
        });
      }
    }

    dragRef.current = {
      id: null,
      pointerId: null,
      target: null,
      startClientX: 0,
      startClientY: 0,
      startX: 0,
      startY: 0,
      moved: false,
      pushed: false,
    };
    setDragging(null);
    setOverTrash(false);
    lastOverRef.current = false;
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
