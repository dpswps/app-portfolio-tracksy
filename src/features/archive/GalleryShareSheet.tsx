"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

/**
 * 갤러리 게시물 상세 페이지의 공유 아이콘 버튼을 누르면 뜨는 바텀시트.
 *
 * 디자인은 스튜디오 export 화면(/studio/export)의 "공유 및 저장" 섹션과 동일한
 * 라이트 카드 4종(인스타 / 카카오톡 / 링크 복사 / 휴대폰 갤러리 저장)으로 구성.
 *
 * 인터랙션:
 *  - 오버레이를 탭하거나, 옵션 버튼을 누르면 닫힘.
 *  - 상단 핸들바(.gf-sheet-handle) 영역을 아래로 잡아당기면 시트가 따라
 *    내려오고, 일정 임계치(시트 높이의 25% 또는 80px) 이상이거나 빠른
 *    flick 속도로 떼면 닫히고, 그 외엔 원위치로 스냅 백.
 */
export default function GalleryShareSheet() {
  const setModal = useAppStore((s) => s.setModal);
  const showToast = useAppStore((s) => s.showToast);

  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  // 드래그 누적 거리(px) — 0 이상만 적용(아래로 끄는 방향).
  const [dragY, setDragY] = useState(0);
  // 드래그 종료 시 닫힘 애니메이션이 시작되면 transform 트랜지션을 켜야
  // 부드러운 슬라이드 다운이 됨. 평소엔 끄고(직접 추종), 종료 시점에 켠다.
  const [animating, setAnimating] = useState(false);
  // 시트 자체가 닫히는 중인지 여부 — true 일 때 onTransitionEnd 에서 모달 해제.
  const closingRef = useRef(false);

  const close = () => setModal(null);

  const handle = (msg: string) => {
    showToast(msg);
    close();
  };

  /**
   * 핸들바에서 pointer 이벤트를 직접 받아 드래그 추적.
   * - touch-action: none 가 CSS 로 걸려 있어 모바일에서 스크롤과 충돌 안 함.
   * - 드래그 거리는 아래(+) 방향만 시트에 반영. 위로 끌 땐 0 으로 고정.
   * - pointerup 시점에 임계치를 넘었는지 / 빠른 flick 인지 판단.
   */
  useEffect(() => {
    const handleEl = handleRef.current;
    const sheetEl = sheetRef.current;
    if (!handleEl || !sheetEl) return;

    let startY = 0;
    let startTime = 0;
    let lastY = 0;
    let lastTime = 0;
    let dragging = false;
    let captured = false;

    const DISMISS_DIST = Math.max(80, sheetEl.clientHeight * 0.25);
    const FLICK_VELOCITY = 0.6; // px/ms 이상이면 빠른 flick 으로 간주

    const onDown = (e: PointerEvent) => {
      dragging = true;
      captured = false;
      startY = e.clientY;
      lastY = e.clientY;
      startTime = performance.now();
      lastTime = startTime;
      setAnimating(false); // 드래그 중엔 트랜지션 비활성 — 손가락 따라가도록
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      if (!captured && Math.abs(dy) > 4) {
        try {
          handleEl.setPointerCapture(e.pointerId);
        } catch {}
        captured = true;
      }
      if (captured) {
        // 위로 끌 땐 약간만 따라오게 dampen, 아래로 끌 땐 1:1 추종.
        setDragY(dy > 0 ? dy : dy * 0.15);
        lastY = e.clientY;
        lastTime = performance.now();
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (captured) {
        try {
          handleEl.releasePointerCapture(e.pointerId);
        } catch {}
      }
      const dy = lastY - startY;
      const dt = Math.max(1, lastTime - startTime);
      const velocity = dy / dt; // px/ms

      const shouldClose =
        dy > DISMISS_DIST || (dy > 24 && velocity > FLICK_VELOCITY);

      setAnimating(true); // 트랜지션 켜고 (close: 화면 밖으로 / cancel: 0 으로)
      if (shouldClose) {
        closingRef.current = true;
        // 시트 높이만큼 더 내려서 화면 밖으로 사라지게.
        setDragY(sheetEl.clientHeight + 40);
      } else {
        setDragY(0);
      }
    };

    handleEl.addEventListener("pointerdown", onDown);
    handleEl.addEventListener("pointermove", onMove);
    handleEl.addEventListener("pointerup", onUp);
    handleEl.addEventListener("pointercancel", onUp);

    return () => {
      handleEl.removeEventListener("pointerdown", onDown);
      handleEl.removeEventListener("pointermove", onMove);
      handleEl.removeEventListener("pointerup", onUp);
      handleEl.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // 닫힘 트랜지션이 끝나면 실제로 모달 상태를 null 로 — 그래야 시트가 unmount.
  const onSheetTransitionEnd = () => {
    if (closingRef.current) {
      closingRef.current = false;
      close();
    }
  };

  return (
    <>
      <div className="gf-overlay" onClick={close} />
      <div
        ref={sheetRef}
        className="gf-sheet gs-share-sheet"
        role="dialog"
        aria-label="공유 및 저장"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: animating ? "transform 0.22s ease-out" : "none",
          touchAction: "pan-y",
        }}
        onTransitionEnd={onSheetTransitionEnd}
      >
        {/* 드래그 가능한 핸들 영역 — 핸들바 자체는 작지만 hit-area 를 넉넉히
            확보하기 위해 wrapper 의 padding/높이를 살짝 키움. */}
        <div
          ref={handleRef}
          className="gs-share-handle-area"
          aria-hidden="true"
        >
          <div className="gf-sheet-handle" />
        </div>
        <div className="gs-share-title">공유 및 저장</div>
        <button
          className="export-insta"
          onClick={() => handle("인스타그램으로 공유했어요")}
        >
          <span className="ig-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="white" />
            </svg>
          </span>
          <span className="ig-text">
            <b>인스타 공유</b>
            <em>인스타그램 스토리에 바로 공유해보세요</em>
          </span>
        </button>
        <button
          className="export-row"
          onClick={() => handle("카카오톡으로 공유했어요")}
        >
          <span className="er-ic kk">K</span>
          <span>카카오톡 공유하기</span>
          <span className="er-arrow">›</span>
        </button>
        <button
          className="export-row"
          onClick={() => handle("공유 링크가 복사되었어요")}
        >
          <span className="er-ic">🔗</span>
          <span>공유 링크 복사</span>
          <span className="er-arrow">›</span>
        </button>
        <button
          className="export-row"
          onClick={() => handle("내 사진첩에 보관되었습니다")}
        >
          <span className="er-ic">🖼</span>
          <span>내 휴대폰 갤러리 저장</span>
          <span className="er-arrow">›</span>
        </button>
      </div>
    </>
  );
}
