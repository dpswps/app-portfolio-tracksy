"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import Mascot from "@/components/ui/Mascot";
import { archiveRecords } from "@/data/archiveRecords";
import { KO_DOW, parseKey, pad2 } from "@/lib/date";

export default function HomePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const userRecords = useAppStore((s) => s.userRecords);
  const setArchiveMainTab = useAppStore((s) => s.setArchiveMainTab);
  const setArchiveView = useAppStore((s) => s.setArchiveView);
  const setCalExpanded = useAppStore((s) => s.setCalExpanded);
  const setArchiveMonth = useAppStore((s) => s.setArchiveMonth);
  const pickDate = useAppStore((s) => s.pickDate);
  const trackRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Today as YYYY-MM-DD (local time)
  const todayKey = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
  }, []);

  // Pick the 2 most recent runs (today or earlier) from static + user records.
  const recentRuns = useMemo(() => {
    const merged = { ...archiveRecords, ...userRecords };
    return Object.entries(merged)
      .filter(([k]) => k <= todayKey)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 2)
      .map(([key, rec]) => ({ key, rec }));
  }, [userRecords, todayKey]);

  // Count of runs in current month + delta vs. previous month.
  const monthStats = useMemo(() => {
    const merged = { ...archiveRecords, ...userRecords };
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1; // 1-indexed
    const prevY = m === 1 ? y - 1 : y;
    const prevM = m === 1 ? 12 : m - 1;
    const curPrefix = `${y}-${pad2(m)}`;
    const prevPrefix = `${prevY}-${pad2(prevM)}`;
    let cur = 0;
    let prev = 0;
    for (const k of Object.keys(merged)) {
      if (k.startsWith(curPrefix)) cur++;
      else if (k.startsWith(prevPrefix)) prev++;
    }
    let badge: { text: string; cls: "pink" | "gray" };
    if (prev === 0 && cur === 0) {
      badge = { text: "기록을 등록해보세요", cls: "gray" };
    } else if (prev === 0) {
      badge = { text: `↗ 이번달 ${cur}회 기록`, cls: "pink" };
    } else if (cur === 0) {
      badge = { text: "↘ 이번달 첫 기록 도전!", cls: "gray" };
    } else {
      const diff = Math.round(((cur - prev) / prev) * 100);
      if (diff > 0) badge = { text: `↗ 지난달 대비 ${diff}%`, cls: "pink" };
      else if (diff < 0) badge = { text: `↘ 지난달 대비 ${Math.abs(diff)}%`, cls: "gray" };
      else badge = { text: "지난달과 동일", cls: "gray" };
    }
    return { cur, prev, badge };
  }, [userRecords]);

  // Best run (longest distance) within the past 90 days.
  const bestRecord = useMemo(() => {
    const merged = { ...archiveRecords, ...userRecords };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 90);
    let best: { key: string; dist: number; distStr: string } | null = null;
    for (const [key, rec] of Object.entries(merged)) {
      const d = new Date(`${key}T00:00:00`);
      if (isNaN(d.getTime()) || d < cutoff || d > today) continue;
      const dist = parseFloat(rec.dist);
      if (isNaN(dist)) continue;
      if (!best || dist > best.dist) {
        best = { key, dist, distStr: rec.dist };
      }
    }
    return best;
  }, [userRecords, todayKey]);

  const bestDateLabel = useMemo(() => {
    if (!bestRecord) return null;
    const { y, m, d } = parseKey(bestRecord.key);
    return `${y}.${pad2(m)}.${pad2(d)} 달성!`;
  }, [bestRecord]);

  // This week's 7 days (Sunday → Saturday) based on today's date.
  const week = useMemo(() => {
    const merged = { ...archiveRecords, ...userRecords };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay()); // back to Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      return {
        dow: KO_DOW[i],
        date: d.getDate(),
        key,
        on: !!merged[key],
        isToday: key === todayKey,
      };
    });
  }, [userRecords, todayKey]);

  const recentPrimary = recentRuns[0];
  const recentSecondary = recentRuns[1];

  const goToRecordsArchive = () => {
    setArchiveMainTab("records");
    setArchiveView("calendar");
    // setArchiveView resets archiveCalExpanded to false, so set it true after.
    setTimeout(() => setCalExpanded(true), 0);
    router.push("/archive");
  };

  const goToRecordOnArchive = (key: string) => {
    const { y, m } = parseKey(key);
    setArchiveMainTab("records");
    setArchiveView("calendar");
    setArchiveMonth(y, m);
    pickDate(key);
    setTimeout(() => setCalExpanded(true), 0);
    router.push("/archive");
  };

  const formatShortDate = (k: string) => {
    const { m, d, dow } = parseKey(k);
    return `${pad2(m)}.${pad2(d)} ${KO_DOW[dow]}`;
  };
  const formatLongDate = (k: string) => {
    const { y, m, d, dow } = parseKey(k);
    return { full: `${y}.${pad2(m)}.${pad2(d)}`, dow: KO_DOW[dow] };
  };

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

    // Snap to nearest slide center
    const snapToNearest = () => {
      const slides = Array.from(track.querySelectorAll<HTMLElement>(".hero-slide"));
      const center = track.scrollLeft + track.clientWidth / 2;
      let nearest = slides[0];
      let minDist = Infinity;
      for (const s of slides) {
        const c = s.offsetLeft + s.clientWidth / 2;
        const d = Math.abs(c - center);
        if (d < minDist) {
          minDist = d;
          nearest = s;
        }
      }
      if (nearest) {
        const targetLeft = nearest.offsetLeft - (track.clientWidth - nearest.clientWidth) / 2;
        track.scrollTo({ left: targetLeft, behavior: "smooth" });
      }
    };

    // Pointer drag-to-slide (mouse + touch)
    let isDown = false;
    let captured = false;
    let startX = 0;
    let startScroll = 0;
    let dragDistance = 0;
    const DRAG_THRESHOLD = 4;

    const onDown = (e: PointerEvent) => {
      isDown = true;
      captured = false;
      dragDistance = 0;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      // Don't capture pointer yet — wait until actual drag starts so that
      // simple clicks reach their underlying targets (e.g. hero-main onClick).
    };
    const onMove = (e: PointerEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      dragDistance = Math.max(dragDistance, Math.abs(dx));
      if (!captured && Math.abs(dx) > DRAG_THRESHOLD) {
        try {
          track.setPointerCapture(e.pointerId);
        } catch {}
        captured = true;
        track.classList.add("dragging");
      }
      if (captured) {
        track.scrollLeft = startScroll - dx;
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      if (captured) {
        try {
          track.releasePointerCapture(e.pointerId);
        } catch {}
        track.classList.remove("dragging");
      }
      // If user actually dragged, suppress the upcoming click so the
      // hero-main onClick doesn't accidentally navigate to /record.
      if (dragDistance > DRAG_THRESHOLD) {
        const suppress = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        track.addEventListener("click", suppress, { capture: true, once: true });
        // Snap to nearest slide after drag ends
        requestAnimationFrame(snapToNearest);
      }
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
        <Link href="/profile" className="greet-avatar" aria-label="프로필">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="프로필" className="greet-avatar-img" />
          ) : (
            <Mascot />
          )}
        </Link>
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
          <div
            className="hero-slide hero-photo"
            onClick={() => recentPrimary && goToRecordOnArchive(recentPrimary.key)}
            role={recentPrimary ? "button" : undefined}
            tabIndex={recentPrimary ? 0 : undefined}
          >
            <div className="hp-bg" />
            <div className="hp-glow" />
            <div className="hp-content">
              <div className="hp-top">
                <span className="hp-label">최근 러닝</span>
                <span className="hp-date">
                  {recentPrimary ? formatShortDate(recentPrimary.key) : "기록 없음"}
                </span>
              </div>
              <div className="hp-distance">
                {recentPrimary ? recentPrimary.rec.dist : "—"}
                <small>km</small>
              </div>
              <svg className="hp-route" viewBox="0 0 220 70" fill="none" preserveAspectRatio="none">
                <path
                  d="M5,45 Q35,15 65,32 T125,38 Q160,52 195,22 L215,30"
                  stroke="#C4B5FD"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="5" cy="45" r="3.5" fill="#C4B5FD" />
                <circle cx="215" cy="30" r="3.5" fill="#fff" stroke="#C4B5FD" strokeWidth="2" />
              </svg>
              <div className="hp-meta">
                <div className="hp-meta-item">
                  <span className="hp-ic">⏱</span>
                  <span>{recentPrimary?.rec.time || "—"}</span>
                </div>
                <div className="hp-meta-item">
                  <span className="hp-ic">⚡</span>
                  <span>{recentPrimary?.rec.pace || "—"}</span>
                </div>
              </div>
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

          <div
            className="hero-slide hero-stats"
            onClick={() => recentSecondary && goToRecordOnArchive(recentSecondary.key)}
            role={recentSecondary ? "button" : undefined}
            tabIndex={recentSecondary ? 0 : undefined}
          >
            <div className="hs-meta">
              <div className="hs-date">
                {recentSecondary ? (
                  <>
                    {formatLongDate(recentSecondary.key).full}{" "}
                    <span>({formatLongDate(recentSecondary.key).dow})</span>
                  </>
                ) : (
                  "기록 없음"
                )}
              </div>
              <div className="hs-weather">이전 러닝 기록</div>
            </div>
            <div className="hs-distance">
              {recentSecondary ? recentSecondary.rec.dist : "—"}
              <small>km</small>
            </div>
            <div className="hs-rows">
              <div className="hs-row">
                <span className="hs-ic">⏱</span>
                <b>{recentSecondary?.rec.time || "—"}</b>
                <i>시간</i>
              </div>
              <div className="hs-row">
                <span className="hs-ic">⚡</span>
                <b>{recentSecondary?.rec.pace || "—"}</b>
                <i>페이스</i>
              </div>
              <div className="hs-row">
                <span className="hs-ic">❤️</span>
                <b>{recentSecondary?.rec.bpm ?? "—"}</b>
                <i>bpm</i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="week-section">
        <div className="week-header">
          <h3>
            <button
              type="button"
              className="week-title-btn"
              onClick={goToRecordsArchive}
              aria-label="내 기록 보관소로 이동"
            >
              이번주 러닝 기록 <span className="cal">📅</span>
            </button>
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
            <button
              key={d.key}
              type="button"
              className={`week-day${d.isToday ? " today" : ""}`}
              onClick={() => goToRecordOnArchive(d.key)}
              aria-label={`${d.dow}요일 ${d.date}일 보관함으로 이동`}
            >
              <div className="dow">{d.dow}</div>
              <div className="dom">{d.date}</div>
              <div className={`dot ${d.on ? "dot-on" : "dot-off"}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="home-stats-row">
        <button
          type="button"
          className="hs-card hs-month"
          onClick={goToRecordsArchive}
          aria-label="이번달 러닝 기록 보러가기"
        >
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
            {monthStats.cur} <small>회</small>
          </div>
          <div className={`hs-badge ${monthStats.badge.cls}`}>{monthStats.badge.text}</div>
        </button>
        <button
          type="button"
          className="hs-card hs-best"
          onClick={() => bestRecord && goToRecordOnArchive(bestRecord.key)}
          aria-label="최고 기록 보러가기"
          disabled={!bestRecord}
        >
          <div className="hs-fig hs-trophy">🏆</div>
          <div className="hs-label">최고 기록(90일간)</div>
          <div className="hs-value">
            {bestRecord ? bestRecord.distStr : "—"} <small>km</small>
          </div>
          <div className="hs-badge gray">
            {bestDateLabel || "기록 없음"}
          </div>
        </button>
      </div>
    </section>
  );
}
