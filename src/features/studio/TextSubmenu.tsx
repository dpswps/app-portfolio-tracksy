"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

function HScroller({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number | null;
    startX: number;
    startScroll: number;
    captured: boolean;
    moved: boolean;
  }>({ pointerId: null, startX: 0, startScroll: 0, captured: false, moved: false });
  const DRAG_THRESHOLD = 8;

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 1);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const onScroll = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (dx: number) => {
    ref.current?.scrollBy({ left: dx, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Only mouse needs custom drag — touch already uses native overflow scroll.
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      captured: false,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d.pointerId !== e.pointerId) return;
    const el = ref.current;
    if (!el) return;
    const dx = e.clientX - d.startX;
    if (!d.captured) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      // threshold passed — start real drag now
      d.captured = true;
      d.moved = true;
      setDragging(true);
      try {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
    }
    el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d.captured) {
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
    }
    d.pointerId = null;
    d.captured = false;
    setDragging(false);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    // suppress click only if the pointer actually dragged past threshold
    if (dragRef.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current.moved = false;
    }
  };

  return (
    <div className="hscroll-wrap">
      {canL && (
        <button
          className="hscroll-arrow hscroll-l"
          aria-label="왼쪽으로"
          onClick={() => scrollBy(-120)}
        >
          ‹
        </button>
      )}
      <div
        ref={ref}
        className={`hscroll${dragging ? " dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {children}
      </div>
      {canR && (
        <button
          className="hscroll-arrow hscroll-r"
          aria-label="오른쪽으로"
          onClick={() => scrollBy(120)}
        >
          ›
        </button>
      )}
    </div>
  );
}

type FontDef = {
  key: string;
  label: string;
  family: string;
  weight?: number;
  style?: string;
};

const FONTS: FontDef[] = [
  { key: "sans", label: "기본", family: "var(--font-noto-kr), 'Noto Sans KR', system-ui, sans-serif", weight: 500 },
  { key: "bold", label: "Strong", family: "var(--font-noto-kr), 'Noto Sans KR', sans-serif", weight: 900 },
  { key: "light", label: "Light", family: "var(--font-noto-kr), 'Noto Sans KR', sans-serif", weight: 300 },
  { key: "serif", label: "Elegant", family: "Georgia, 'Nanum Myeongjo', serif", weight: 500 },
  { key: "italic", label: "Italic", family: "Georgia, 'Times New Roman', serif", weight: 500, style: "italic" },
  { key: "playful", label: "Meme", family: "Impact, 'Black Han Sans', sans-serif", weight: 900 },
  { key: "display", label: "Display", family: "'Arial Black', 'Black Han Sans', sans-serif", weight: 900 },
  { key: "round", label: "Round", family: "'Comic Sans MS', 'Apple SD Gothic Neo', sans-serif", weight: 700 },
  { key: "mono", label: "Mono", family: "ui-monospace, 'Courier New', monospace", weight: 500 },
  { key: "tech", label: "Tech", family: "'Courier New', 'D2Coding', monospace", weight: 700 },
  { key: "script", label: "Script", family: "'Brush Script MT', 'Lucida Handwriting', cursive", weight: 500, style: "italic" },
  { key: "marker", label: "Marker", family: "'Permanent Marker', 'Comic Sans MS', cursive", weight: 700 },
  { key: "myeongjo", label: "명조", family: "'Nanum Myeongjo', 'Times New Roman', serif", weight: 500 },
  { key: "myeongjo-bold", label: "명조 Bold", family: "'Nanum Myeongjo', 'Times New Roman', serif", weight: 800 },
  { key: "gothic", label: "고딕", family: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif", weight: 600 },
  { key: "ultra", label: "Ultra", family: "var(--font-noto-kr), 'Noto Sans KR', sans-serif", weight: 900, style: "italic" },
];

const COLORS = [
  "#FFFFFF",
  "#000000",
  "#EF4444",
  "#F59E0B",
  "#FBBF24",
  "#10B981",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F472B6",
];

function EyedropperButton({
  currentColor,
}: {
  currentColor: string;
  onPick: (hex: string) => void;
}) {
  const setEyedropperActive = useAppStore((s) => s.setStudioEyedropperActive);
  const bg = useAppStore((s) => s.studioBackground);
  const showToast = useAppStore((s) => s.showToast);

  const onClick = () => {
    if (!bg) {
      showToast("먼저 배경 사진을 등록해주세요");
      return;
    }
    setEyedropperActive(true);
  };

  // currentColor unused now — kept on signature for caller compatibility.
  void currentColor;

  return (
    <button
      className="tcolor tcolor-pick"
      aria-label="스포이드로 색 선택"
      title="스포이드"
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 3.5a2.121 2.121 0 1 1 3 3L15 9l-3-3 2.5-2.5z" />
        <path d="M12 6l6 6" />
        <path d="M12 6l-7.5 7.5a2 2 0 0 0-.5.86L3 18l3.64-1a2 2 0 0 0 .86-.5L15 9" />
      </svg>
    </button>
  );
}

export default function TextSubmenu() {
  const submenu = useAppStore((s) => s.studioTextSubmenu);
  const activeId = useAppStore((s) => s.studioActiveTextId);
  const texts = useAppStore((s) => s.studioTexts);
  const updateText = useAppStore((s) => s.updateStudioText);
  const setSubmenu = useAppStore((s) => s.setStudioTextSubmenu);
  const showToast = useAppStore((s) => s.showToast);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  // 카드 빌트인 텍스트(weekTitle/distance/time/pace/calories/bubble) 색상 지원.
  // 사용자가 카드 텍스트를 탭하면 activeCardField 가 설정되고, 그 상태에서
  // 색상 picker를 누르면 그 필드의 색이 바뀐다.
  const activeCardField = useAppStore((s) => s.studioActiveCardField);
  const cardTextColors = useAppStore((s) => s.studioCardTextColors);
  const setCardTextColor = useAppStore((s) => s.setStudioCardTextColor);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean }>({ active: false });

  const active = texts.find((t) => t.id === activeId);
  // 색상 picker 대상: 텍스트 오버레이가 active 면 그쪽, 아니면 카드 빌트인 필드.
  const colorTarget: "overlay" | "card" | null =
    active ? "overlay" : activeCardField ? "card" : null;
  const currentColor =
    colorTarget === "overlay"
      ? active!.color
      : colorTarget === "card"
        ? cardTextColors[activeCardField!] ?? "#FFFFFF"
        : "#FFFFFF";

  // 색상/폰트/사이즈 submenu 는 텍스트 오버레이가 있을 때 + 카드 필드 active 일 때
  // 모두 노출. 폰트/사이즈는 텍스트 오버레이 전용이라 카드 필드만 active 면 색상만 표시.
  useEffect(() => {
    if (!active && !activeCardField && submenu !== "none") setSubmenu("none");
  }, [active, activeCardField, submenu, setSubmenu]);

  const applyColor = (c: string) => {
    pushHistory();
    if (colorTarget === "overlay" && active) {
      updateText(active.id, { color: c });
    } else if (colorTarget === "card" && activeCardField) {
      setCardTextColor(activeCardField, c);
    }
  };

  const setSize = (clientY: number) => {
    if (!active || !sliderRef.current) return;
    const r = sliderRef.current.getBoundingClientRect();
    const ratio = 1 - Math.max(0, Math.min(1, (clientY - r.top) / r.height));
    const min = 12;
    const max = 80;
    const size = Math.round(min + (max - min) * ratio);
    updateText(active.id, { size });
  };

  const onSliderDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!active) {
      showToast("먼저 텍스트를 추가해주세요");
      return;
    }
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current.active = true;
    // record one undo entry per slider drag session
    pushHistory();
    setSize(e.clientY);
  };
  const onSliderMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    setSize(e.clientY);
  };
  const onSliderUp = (e: React.PointerEvent) => {
    dragRef.current.active = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const sizeRatio = (() => {
    if (!active) return 0.5;
    const min = 12;
    const max = 80;
    return Math.max(0, Math.min(1, (active.size - min) / (max - min)));
  })();

  // 텍스트 오버레이도 카드 필드도 active 가 아니면 어떤 submenu 도 표시 안 함.
  if (!active && !activeCardField) return null;

  return (
    <>
      {submenu === "size" && active && (
        <div
          ref={sliderRef}
          className="text-size-slider"
          onPointerDown={onSliderDown}
          onPointerMove={onSliderMove}
          onPointerUp={onSliderUp}
          onPointerCancel={onSliderUp}
        >
          <div className="tss-track" />
          <div
            className="tss-fill"
            style={{ height: `${sizeRatio * 100}%` }}
          />
          <div
            className="tss-thumb"
            style={{ bottom: `calc(${sizeRatio * 100}% - 11px)` }}
          />
        </div>
      )}

      {submenu === "font" && active && (
        <div className="text-font-row">
          <HScroller>
            {FONTS.map((f) => {
              const isActive =
                active.font === f.family &&
                (active.fontWeight ?? 500) === (f.weight ?? 500) &&
                (active.fontStyle ?? "normal") === (f.style ?? "normal");
              return (
                <button
                  key={f.key}
                  className={`tfont${isActive ? " active" : ""}`}
                  style={{ fontFamily: f.family, fontWeight: f.weight ?? 500, fontStyle: f.style ?? "normal" }}
                  onClick={() => {
                    pushHistory();
                    updateText(active.id, {
                      font: f.family,
                      fontWeight: f.weight ?? 500,
                      fontStyle: f.style ?? "normal",
                    });
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </HScroller>
        </div>
      )}

      {submenu === "color" && (colorTarget === "overlay" || colorTarget === "card") && (
        <div className="text-color-row">
          <HScroller>
            <EyedropperButton
              currentColor={currentColor}
              onPick={(c) => applyColor(c)}
            />
            {COLORS.map((c) => (
              <button
                key={c}
                className={`tcolor${currentColor === c ? " active" : ""}`}
                style={{ background: c }}
                aria-label={c}
                onClick={() => applyColor(c)}
              />
            ))}
          </HScroller>
        </div>
      )}
    </>
  );
}
