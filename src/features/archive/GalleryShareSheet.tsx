"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { downloadCardAsImage } from "@/lib/downloadCard";

/**
 * Bottom sheet shown when the user taps the share icon on the gallery detail
 * page. Mirrors the design of the studio export screen with four light cards
 * (Instagram / KakaoTalk / Copy link / Save to phone gallery).
 *
 * Interactions:
 *  - Tap overlay or any option button -> close.
 *  - Drag the handle bar down: sheet follows the finger; release past 25% of
 *    sheet height (or with a fast flick) closes, otherwise snaps back.
 */
export default function GalleryShareSheet() {
  const setModal = useAppStore((s) => s.setModal);
  const showToast = useAppStore((s) => s.showToast);

  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [animating, setAnimating] = useState(false);
  const closingRef = useRef(false);

  const close = () => setModal(null);

  const handle = (msg: string) => {
    showToast(msg);
    close();
  };

  const onSaveToGallery = async () => {
    try {
      const result = await downloadCardAsImage(
        ".gd-card-wrap .running-card, .running-card",
      );
      if (result === "shared") {
        showToast("공유 시트에서 '사진에 저장'을 선택하세요");
      } else if (result === "downloaded") {
        showToast("내 사진첩(다운로드 폴더)에 저장되었습니다");
      }
    } catch (e) {
      showToast(`저장 실패: ${e instanceof Error ? e.message : "오류"}`);
    }
    close();
  };

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
    const FLICK_VELOCITY = 0.6;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      captured = false;
      startY = e.clientY;
      lastY = e.clientY;
      startTime = performance.now();
      lastTime = startTime;
      setAnimating(false);
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
      const velocity = dy / dt;

      const shouldClose =
        dy > DISMISS_DIST || (dy > 24 && velocity > FLICK_VELOCITY);

      setAnimating(true);
      if (shouldClose) {
        closingRef.current = true;
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
          <span className="er-arrow">&rsaquo;</span>
        </button>
        <button
          className="export-row"
          onClick={() => handle("공유 링크가 복사되었어요")}
        >
          <span className="er-ic">🔗</span>
          <span>공유 링크 복사</span>
          <span className="er-arrow">&rsaquo;</span>
        </button>
        <button className="export-row" onClick={onSaveToGallery}>
          <span className="er-ic">🖼</span>
          <span>내 휴대폰 갤러리 저장</span>
          <span className="er-arrow">&rsaquo;</span>
        </button>
      </div>
    </>
  );
}
