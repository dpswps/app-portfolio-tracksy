"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import Mascot from "@/components/ui/Mascot";

const week = [
  { dow: "일", date: 13, on: false },
  { dow: "월", date: 14, on: true },
  { dow: "화", date: 15, on: true },
  { dow: "수", date: 16, on: false },
  { dow: "목", date: 17, on: true },
  { dow: "금", date: 18, on: false },
  { dow: "토", date: 19, on: false },
];

export default function HomePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const trackRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const main = mainRef.current;
    if (!track || !main) return;

    const center = () => {
      const targetLeft = main.offsetLeft - (track.clientWidth - main.clientWidth) / 2;
      track.scrollTo({ left: targetLeft, behavior: "auto" });
    };
    requestAnimationFrame(center);

    // Convert vertical wheel to horizontal scroll on desktop
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollLeft += e.deltaY;
      }
    };
    track.addEventListener("wheel", onWheel, { passive: false });

    // Mouse drag-to-slide on desktop
    let isDown = false;
    let startX = 0;
    let startScroll = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      isDown = true;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!isDown) return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    };
    const onUp = (e: PointerEvent) => {
      isDown = false;
      try {
        track.releasePointerCapture(e.pointerId);
      } catch {}
    };
    track.addEventListener("pointerdown", onDown);
    track.addEventListener("pointermove", onMove);
    track.addEventListener("pointerup", onUp);
    track.addEventListener("pointercancel", onUp);

    return () => {
      track.removeEventListener("wheel", onWheel);
      track.removeEventListener("pointerdown", onDown);
      track.removeEventListener("pointermove", onMove);
      track.removeEventListener("pointerup", onUp);
      track.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <section className="home-screen">
      <div className="home-greeting">
        <div className="greet-avatar">
          <Mascot />
        </div>
        <div className="greet-text">
          <div className="greet-name">
            {user.name || "닉네임"} <span>님</span>
          </div>
          <div className="greet-sub">오늘도 멋진 러너의 하루를 만들어봐요!</div>
        </div>
        <Link href="/settings" className="greet-settings" aria-label="설정">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </Link>
      </div>

      <div className="hero-carousel">
        <div className="hero-track" ref={trackRef}>
          <div className="hero-slide hero-photo">
            <div className="hp-bg" />
            <div className="hp-overlay" />
            <div className="hp-content">
              <div className="hp-distance">
                21<small>km</small>
              </div>
              <div className="hp-time">12:45</div>
            </div>
          </div>

          <div
            className="hero-slide hero-main"
            ref={mainRef}
            onClick={() => router.push("/record")}
            role="button"
            tabIndex={0}
          >
            <div className="hm-content">
              <h2>러닝 기록하기</h2>
              <p>오늘의 러닝을 등록해볼까요?</p>
              <div className="hm-plus">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </div>
            <div className="hm-mascot">
              <Mascot />
            </div>
            <div className="hm-wave" />
          </div>

          <div className="hero-slide hero-stats">
            <div className="hs-meta">
              <div className="hs-date">
                2026.04.06 <span>(월)</span>
              </div>
              <div className="hs-weather">오전 7:30 · 후 18°C</div>
            </div>
            <div className="hs-distance">
              5.21<small>km</small>
            </div>
            <div className="hs-rows">
              <div className="hs-row">
                <span className="hs-ic">⏱</span>
                <b>00:32:45</b>
                <i>시간</i>
              </div>
              <div className="hs-row">
                <span className="hs-ic">⚡</span>
                <b>6&apos;12&quot;</b>
                <i>페이스</i>
              </div>
              <div className="hs-row">
                <span className="hs-ic">🔥</span>
                <b>368</b>
                <i>kcal</i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="week-section">
        <div className="week-header">
          <h3>
            이번주 러닝 기록 <span className="cal">📅</span>
          </h3>
          <div className="week-legend">
            <span className="legend-item">
              <span className="dot dot-on" />
              기록있음
            </span>
            <span className="legend-item">
              <span className="dot dot-off" />
              기록없음
            </span>
          </div>
        </div>
        <div className="week-grid">
          {week.map((d) => (
            <div key={d.dow} className="week-day">
              <div className="dow">{d.dow}</div>
              <div className="dom">{d.date}</div>
              <div className={`dot ${d.on ? "dot-on" : "dot-off"}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="home-stats-row">
        <div className="hs-card hs-month">
          <div className="hs-fig">
            <svg viewBox="0 0 60 60" fill="none">
              <circle cx="38" cy="14" r="4" fill="#8B5CF6" />
              <path d="M22 50 L28 38 L34 30 L42 36 L48 32" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M28 38 L24 28 L34 22 L40 26" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M14 50 Q22 46 36 50 Q44 52 52 48" stroke="#E5E7EB" strokeWidth="6" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div className="hs-label">이번달 러닝 횟수</div>
          <div className="hs-value">
            12 <small>회</small>
          </div>
          <div className="hs-badge pink">↗ 지난달 대비 20%</div>
        </div>
        <div className="hs-card hs-best">
          <div className="hs-fig hs-trophy">🏆</div>
          <div className="hs-label">최고 기록(90일간)</div>
          <div className="hs-value">
            10.21 <small>km</small>
          </div>
          <div className="hs-badge gray">2026.04.06 달성!</div>
        </div>
      </div>
    </section>
  );
}
