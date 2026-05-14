"use client";

import { useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

type ThemePreset = {
  id: string;
  name: string;
  /** 카드에 얹힐 투명 SVG 오버레이 (data URL). */
  overlay: string;
  /** 슬라이드 썸네일 미리보기용 — 같은 SVG지만 어두운 회색 배경 위에 표시. */
  thumbBg: string;
};

/**
 * 투명 배경 + 장식 요소만 있는 SVG 오버레이를 만든다.
 * 결과물은 RunningCard 위에 그대로 겹쳐져서 배경을 가리지 않고 장식만 더한다.
 *
 * @param decor 안쪽에 들어갈 SVG 노드 (rect, circle, path, text 등)
 */
function overlaySvg(decor: string) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 700" preserveAspectRatio="xMidYMid slice">` +
    decor +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ──────────────────────────────────────────────────────────
 * 테마 프리셋 — 모두 투명 배경 + 장식만.
 * 배경 사진을 가리지 않고 코너/엣지 장식만 얹는 구조.
 * ────────────────────────────────────────────────────────── */
const THEMES: ThemePreset[] = [
  {
    id: "none",
    name: "없음",
    overlay: "",
    thumbBg: overlaySvg(
      `<text x="200" y="370" font-family="sans-serif" font-size="64" fill="#888" text-anchor="middle" opacity="0.7">∅</text>`,
    ),
  },
  {
    id: "corner-mascot",
    name: "마스코트",
    overlay: overlaySvg(
      // 우측 하단에 보라색 동그란 캐릭터 (스크린샷 참고)
      `<g transform="translate(280 540)">` +
        `<circle cx="40" cy="40" r="38" fill="#8b5cf6"/>` +
        `<circle cx="40" cy="40" r="38" fill="none" stroke="#c4b5fd" stroke-width="2"/>` +
        // 눈
        `<circle cx="30" cy="36" r="5" fill="#fff"/>` +
        `<circle cx="50" cy="36" r="5" fill="#fff"/>` +
        `<circle cx="30" cy="36" r="2.5" fill="#1a0f2e"/>` +
        `<circle cx="50" cy="36" r="2.5" fill="#1a0f2e"/>` +
        // 미소
        `<path d="M28 50 Q40 58 52 50" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>` +
        // 작은 뿔(귀)
        `<path d="M14 18 L22 30 L8 26 Z" fill="#a78bfa"/>` +
        `<path d="M66 18 L58 30 L72 26 Z" fill="#a78bfa"/>` +
        `</g>`,
    ),
    thumbBg: overlaySvg(
      `<rect width="400" height="700" fill="#1a0f2e"/>` +
        `<g transform="translate(155 280)">` +
        `<circle cx="45" cy="45" r="42" fill="#8b5cf6"/>` +
        `<circle cx="35" cy="40" r="6" fill="#fff"/>` +
        `<circle cx="55" cy="40" r="6" fill="#fff"/>` +
        `<circle cx="35" cy="40" r="3" fill="#1a0f2e"/>` +
        `<circle cx="55" cy="40" r="3" fill="#1a0f2e"/>` +
        `<path d="M33 55 Q45 64 57 55" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>` +
        `<path d="M16 20 L26 33 L8 28 Z" fill="#a78bfa"/>` +
        `<path d="M74 20 L64 33 L82 28 Z" fill="#a78bfa"/>` +
        `</g>`,
    ),
  },
  {
    id: "sparkle",
    name: "반짝이",
    overlay: overlaySvg(
      // 곳곳에 별/반짝이
      `<g fill="#fcd34d" opacity="0.92">` +
        `<path d="M50 80 l5 -12 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 z"/>` +
        `<path d="M340 130 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z"/>` +
        `<path d="M30 580 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 z"/>` +
        `<path d="M350 600 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 z"/>` +
        `<path d="M200 50 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z"/>` +
        `</g>`,
    ),
    thumbBg: overlaySvg(
      `<rect width="400" height="700" fill="#1a0f2e"/>` +
        `<g fill="#fcd34d">` +
        `<path d="M120 200 l12 -30 l12 30 l30 12 l-30 12 l-12 30 l-12 -30 l-30 -12 z"/>` +
        `<path d="M280 420 l8 -22 l8 22 l22 8 l-22 8 l-8 22 l-8 -22 l-22 -8 z"/>` +
        `<path d="M90 480 l6 -16 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 z"/>` +
        `</g>`,
    ),
  },
  {
    id: "frame-purple",
    name: "보라 프레임",
    overlay: overlaySvg(
      // 카드 가장자리 보라 글로우 + 안쪽 테두리
      `<defs>` +
        `<linearGradient id="fp" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#8b5cf6" stop-opacity="0.55"/>` +
        `<stop offset="0.4" stop-color="#8b5cf6" stop-opacity="0"/>` +
        `<stop offset="0.6" stop-color="#ec4899" stop-opacity="0"/>` +
        `<stop offset="1" stop-color="#ec4899" stop-opacity="0.55"/>` +
        `</linearGradient>` +
        `</defs>` +
        `<rect width="400" height="700" fill="url(#fp)"/>` +
        `<rect x="12" y="12" width="376" height="676" rx="22" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="2"/>`,
    ),
    thumbBg: overlaySvg(
      `<defs>` +
        `<linearGradient id="fp2" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#8b5cf6"/>` +
        `<stop offset="1" stop-color="#ec4899"/>` +
        `</linearGradient>` +
        `</defs>` +
        `<rect width="400" height="700" fill="url(#fp2)" opacity="0.55"/>` +
        `<rect x="30" y="30" width="340" height="640" rx="40" fill="none" stroke="#fff" stroke-width="5"/>`,
    ),
  },
  {
    id: "wave-bottom",
    name: "웨이브",
    overlay: overlaySvg(
      // 하단 물결 장식
      `<path d="M0 580 Q100 540 200 580 T400 580 L400 700 L0 700 Z" fill="#a78bfa" opacity="0.65"/>` +
        `<path d="M0 620 Q100 590 200 620 T400 620 L400 700 L0 700 Z" fill="#7c3aed" opacity="0.55"/>`,
    ),
    thumbBg: overlaySvg(
      `<rect width="400" height="700" fill="#1a0f2e"/>` +
        `<path d="M0 480 Q100 380 200 480 T400 480 L400 700 L0 700 Z" fill="#a78bfa"/>` +
        `<path d="M0 560 Q100 460 200 560 T400 560 L400 700 L0 700 Z" fill="#7c3aed"/>`,
    ),
  },
  {
    id: "confetti",
    name: "컨페티",
    overlay: overlaySvg(
      // 흩뿌려진 색종이 조각
      `<g>` +
        `<rect x="40" y="100" width="14" height="14" fill="#fb7185" transform="rotate(20 47 107)"/>` +
        `<rect x="320" y="180" width="14" height="14" fill="#60a5fa" transform="rotate(-15 327 187)"/>` +
        `<rect x="80" y="300" width="14" height="14" fill="#fbbf24" transform="rotate(35 87 307)"/>` +
        `<rect x="350" y="380" width="14" height="14" fill="#34d399" transform="rotate(-25 357 387)"/>` +
        `<rect x="50" y="520" width="14" height="14" fill="#a78bfa" transform="rotate(10 57 527)"/>` +
        `<rect x="300" y="560" width="14" height="14" fill="#f472b6" transform="rotate(-30 307 567)"/>` +
        `<rect x="200" y="120" width="14" height="14" fill="#22d3ee" transform="rotate(45 207 127)"/>` +
        `<rect x="180" y="640" width="14" height="14" fill="#fde047" transform="rotate(-10 187 647)"/>` +
        `</g>`,
    ),
    thumbBg: overlaySvg(
      `<rect width="400" height="700" fill="#1a0f2e"/>` +
        `<g>` +
        `<rect x="80" y="120" width="34" height="34" fill="#fb7185" transform="rotate(20 97 137)"/>` +
        `<rect x="280" y="220" width="34" height="34" fill="#60a5fa" transform="rotate(-15 297 237)"/>` +
        `<rect x="120" y="370" width="34" height="34" fill="#fbbf24" transform="rotate(35 137 387)"/>` +
        `<rect x="290" y="450" width="34" height="34" fill="#34d399" transform="rotate(-25 307 467)"/>` +
        `<rect x="90" y="550" width="34" height="34" fill="#a78bfa" transform="rotate(10 107 567)"/>` +
        `</g>`,
    ),
  },
  {
    id: "corner-heart",
    name: "하트 코너",
    overlay: overlaySvg(
      // 우측 상단에 큰 분홍 하트
      `<g transform="translate(320 70)">` +
        `<path d="M30 50 C 10 30 10 5 30 5 C 40 5 45 12 45 12 C 45 12 50 5 60 5 C 80 5 80 30 60 50 L 45 65 Z" fill="#f472b6" opacity="0.9"/>` +
        `</g>`,
    ),
    thumbBg: overlaySvg(
      `<rect width="400" height="700" fill="#1a0f2e"/>` +
        `<g transform="translate(120 220)">` +
        `<path d="M80 120 C 30 80 30 20 80 20 C 110 20 125 40 125 40 C 125 40 140 20 170 20 C 220 20 220 80 170 120 L 125 160 Z" fill="#f472b6"/>` +
        `</g>`,
    ),
  },
];

export default function DesignSubmenu() {
  const submenu = useAppStore((s) => s.studioDesignSubmenu);
  const themeOverlay = useAppStore((s) => s.studioThemeOverlay);
  const setOverlay = useAppStore((s) => s.setStudioThemeOverlay);
  const showToast = useAppStore((s) => s.showToast);

  /* ──────────────────────────────────────────────────────────
   * 드래그 스크롤 — 사용자가 슬라이드를 누른 상태에서 좌우로 끌면
   * 가로 스크롤이 같이 움직이도록.
   *
   * touch 환경에서는 기본 native 스크롤로 충분하지만, 마우스/PC에서는
   * 클릭 후 끌어도 스크롤이 안 되므로 pointer 이벤트로 직접 처리.
   * 클릭 vs 드래그 구분을 위해 DRAG_THRESHOLD 만큼 움직였을 때만 드래그로 인식.
   * ────────────────────────────────────────────────────────── */
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  } | null>(null);
  const DRAG_THRESHOLD = 4;

  if (submenu !== "theme") return null;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = scrollerRef.current;
    if (!d || !el || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    if (!d.moved) {
      d.moved = true;
      try {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
      el.classList.add("dragging");
    }
    e.preventDefault();
    el.scrollLeft = d.startScrollLeft - dx;
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    scrollerRef.current?.classList.remove("dragging");
    dragRef.current = null;
  };

  return (
    <div className="design-theme-row">
      <div
        ref={scrollerRef}
        className="dtr-scroll"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {THEMES.map((th) => {
          // 빈 테마(id=none)는 overlay가 빈 문자열 — 해제 동작.
          const isActive =
            th.id === "none" ? !themeOverlay : themeOverlay === th.overlay;
          return (
            <button
              key={th.id}
              className={`dtr-thumb${isActive ? " active" : ""}`}
              style={{ backgroundImage: `url("${th.thumbBg}")` }}
              aria-label={th.name}
              title={th.name}
              onClick={(e) => {
                // 드래그가 막 끝난 직후의 click 은 무시 (드래그 중에 우연히 클릭이 잡힐 경우)
                if (dragRef.current?.moved) {
                  e.preventDefault();
                  return;
                }
                if (th.id === "none") {
                  setOverlay(null);
                  showToast("테마를 해제했어요");
                } else {
                  setOverlay(th.overlay);
                  showToast(`${th.name} 테마 적용됨`);
                }
              }}
            >
              <span className="dtr-name">{th.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
