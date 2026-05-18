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
  zIndex,
  onPointerDown,
  onChange,
  onBlur,
  onCommit,
}: {
  t: TextItem;
  isActive: boolean;
  /** 레이어 패널에서 설정된 불투명도(0~1). 기본 1. */
  layerOpacity?: number;
  /** 통합 layerOrder 기반 z-index — 텍스트가 스티커 위/아래로 갈 수 있게. */
  zIndex?: number;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onChange: (text: string) => void;
  onBlur: () => void;
  onCommit: () => void;
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
        zIndex,
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
      {/* X 버튼 제거됨 — 텍스트 삭제는 하단 휴지통으로 드래그하는 통합 방식 사용. */}
    </div>
  );
}

/**
 * 화면상의 trash zone 요소 boundingClientRect 를 반환. 드래그 중 hit-test 용.
 */
function getTrashRect(): DOMRect | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector<HTMLElement>(".studio-trash-zone");
  return el ? el.getBoundingClientRect() : null;
}
function isOverRect(rect: DOMRect | null, x: number, y: number): boolean {
  if (!rect) return false;
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export default function TextOverlay() {
  const texts = useAppStore((s) => s.studioTexts);
  const hidden = useAppStore((s) => s.studioHiddenLayers);
  const locked = useAppStore((s) => s.studioLockedLayers);
  const opacities = useAppStore((s) => s.studioLayerOpacities);
  const layerOrder = useAppStore((s) => s.studioLayerOrder);
  const activeId = useAppStore((s) => s.studioActiveTextId);
  const setActive = useAppStore((s) => s.setActiveStudioText);
  const updateText = useAppStore((s) => s.updateStudioText);
  const removeText = useAppStore((s) => s.removeStudioText);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const setDragging = useAppStore((s) => s.setStudioDraggingContent);
  const setOverTrash = useAppStore((s) => s.setStudioDraggingOverTrash);
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
      // 모바일 기본 동작 차단 — touch-action: none 의 이중 안전망.
      try {
        e.preventDefault();
      } catch {
        /* passive */
      }
      // pointer capture 를 pointerdown 시점에 즉시 호출 — 작은 텍스트("sunset run"
      // 처럼 사이즈 12px 짜리) 의 좁은 hit area 를 손가락이 금방 벗어나도 모든
      // 후속 pointermove/up 이벤트가 이 .stx 요소에 계속 묶여서 발생하도록 보장.
      // (이전엔 threshold 통과 후에야 capture 를 호출해서, 그 사이 손가락이
      // 영역을 벗어나면 드래그가 시작도 안 되는 케이스가 있었음.)
      try {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
      // 활성화(setActive)를 여기서 즉시 부르지 않고 onPointerUp 까지 미룬다.
      //   - 즉시 활성화하면 contentEditable 이 켜지고 useEffect 가 focus()를
      //     호출해 텍스트 선택 모드로 전환되는데, 이게 드래그 도중 pointer
      //     이벤트와 충돌해서 "잘 안 끌리는" 느낌을 만든다.
      //   - 대신 onPointerUp 시점에 "사실상 클릭이었는지(=드래그 없었는지)"
      //     를 검사해서 그때만 활성화한다 → 드래그는 부드럽게, 단순 탭은
      //     기존처럼 텍스트 편집 모드로 진입.
      // 이미 활성화된 텍스트를 다시 잡는 경우는 활성 상태를 유지해서 편집을
      // 끊지 않는다.
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
      // 캔버스 하단 휴지통 영역을 즉시 표시 — pointer 가 처음 down 되자마자
      setDragging({ kind: "text", id });
    };

  // overTrash 캐시 — 같은 값 연속 set 으로 인한 TrashZone 재렌더 방지.
  const lastOverRef = useRef(false);

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
      // (pointer capture 는 onPointerDownItem 에서 이미 잡아둠 — 여기서 다시
      // 부르지 않아도 모든 후속 이벤트가 .stx 로 들어옴.)
      if (!d.pushed) {
        pushHistory();
        d.pushed = true;
      }
      const active = document.activeElement as HTMLElement | null;
      if (active && active.classList.contains("stx-edit")) {
        active.blur();
      }
    }
    // 드래그 도중 React state(=studioTexts) 를 매 프레임 갱신하면 TextOverlay
    // 가 통째로 재렌더되어 끊긴다. 대신 target 의 DOM transform 만 직접
    // 갱신해서 손가락 1:1 추적은 보장하고, 최종 좌표는 pointerup 에서 한 번만
    // store 에 commit. 기존 .stx 의 `transform: translate(-50%, -50%)` 를 보존
    // 하면서 추가로 translate(dxPx, dyPx) 를 합쳐 적용한다.
    if (d.target) {
      (d.target as HTMLElement).style.transform =
        `translate(-50%, -50%) translate(${rawDX}px, ${rawDY}px)`;
    }
    // trash zone hit-test — 값 변할 때만 store 갱신해서 TrashZone 재렌더 최소화.
    const nowOver = isOverRect(getTrashRect(), e.clientX, e.clientY);
    if (nowOver !== lastOverRef.current) {
      lastOverRef.current = nowOver;
      setOverTrash(nowOver);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const droppedOnTrash =
      d.id != null && isOverRect(getTrashRect(), e.clientX, e.clientY);

    if (d.captured && d.target) {
      try {
        d.target.releasePointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
    }
    if (droppedOnTrash && d.id != null) {
      removeText(d.id);
    } else if (d.captured && d.id != null) {
      // 드래그 종료 — 누적된 픽셀 이동을 % 좌표로 환산해 store 에 한 번만 commit.
      // 동시에 DOM transform 을 React 의 기대값(translate(-50%,-50%)) 으로 복원
      // 해서 다음 렌더링과 inline 스타일 불일치 가 안 생기게 한다.
      const el = containerRef.current;
      if (el) {
        const rawDX = e.clientX - d.startX;
        const rawDY = e.clientY - d.startY;
        const r = el.getBoundingClientRect();
        const dx = (rawDX / r.width) * 100;
        const dy = (rawDY / r.height) * 100;
        const x = Math.max(0, Math.min(100, d.startPctX + dx));
        const y = Math.max(0, Math.min(100, d.startPctY + dy));
        if (d.target) {
          (d.target as HTMLElement).style.transform = "translate(-50%, -50%)";
        }
        updateText(d.id, { x, y });
      }
    } else if (!d.captured && d.id != null) {
      // 드래그가 없었던 단순 탭 — 이제 안전하게 활성화해서 텍스트 편집 모드로.
      // (드래그가 있었으면 setActive 를 건너뛰어 편집 모드 진입을 막는다 →
      //  사용자 입장에선 "드래그 후 떼면 그냥 위치 이동만" 으로 자연스럽게 끝남.)
      setActive(d.id);
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
    setDragging(null);
    setOverTrash(false);
    lastOverRef.current = false;
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
          const key = `text-${t.id}`;
          const op = opacities[key];
          // 레이어 opacity (0~100). 미설정 시 100으로 간주.
          const layerOpacity = op != null ? op / 100 : 1;
          // 통합 layerOrder에서의 인덱스가 z-index가 됨 (큰 값 = 앞).
          // 미발견 시 기본 z-index 1 (stickers와 동률 정도).
          const zIdx = layerOrder.indexOf(key);
          const zIndex = zIdx >= 0 ? zIdx + 1 : undefined;
          return (
            <StxItem
              key={t.id}
              t={t}
              isActive={activeId === t.id}
              layerOpacity={layerOpacity}
              zIndex={zIndex}
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
            />
          );
        })}
    </div>
  );
}
