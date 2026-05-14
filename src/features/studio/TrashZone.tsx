"use client";

import { useAppStore } from "@/stores/useAppStore";

/**
 * 캔버스 하단의 통합 휴지통 영역.
 *
 * 텍스트/스티커를 드래그해서 이 위에 놓으면 삭제됨.
 * 평소엔 숨어있다가 드래그가 시작되면(studioDraggingContent != null) 나타남.
 * pointer 가 위에 있을 땐 보라색으로 강조 (studioDraggingOverTrash).
 *
 * 실제 hit-test 와 삭제 동작은 TextOverlay / PlacedStickers 의 pointer 이벤트
 * 핸들러가 담당. 이 컴포넌트는 시각적 표시만.
 *
 * className "studio-trash-zone" 으로 노출 — 외부에서 getElementsByClassName 으로
 * 위치를 측정해서 hit-test 함.
 */
export default function TrashZone() {
  const dragging = useAppStore((s) => s.studioDraggingContent);
  const over = useAppStore((s) => s.studioDraggingOverTrash);

  if (!dragging) return null;

  return (
    <div
      className={`studio-trash-zone${over ? " over" : ""}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
      <span className="stz-label">{over ? "놓으면 삭제" : "여기로 끌어서 삭제"}</span>
    </div>
  );
}
