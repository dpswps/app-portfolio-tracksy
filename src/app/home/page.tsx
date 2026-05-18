"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { archiveRecords } from "@/data/archiveRecords";
import { KO_DOW, parseKey, pad2 } from "@/lib/date";

export default function HomePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const userRecords = useAppStore((s) => s.userRecords);
  const bestMetric = useAppStore((s) => s.bestMetric);
  const setModal = useAppStore((s) => s.setModal);
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

  // Best run within the past 90 days, computed by selected metric.
  const bestRecord = useMemo(() => {
    const merged = { ...archiveRecords, ...userRecords };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - 90);

    const paceToSec = (p?: string) => {
      if (!p) return null;
      const m = p.match(/(\d+)['′](\d+)/);
      if (!m) return null;
      return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    };
    const timeToSec = (t?: string) => {
      if (!t) return null;
      const parts = t.split(":").map((x) => parseInt(x, 10));
      if (parts.some((n) => isNaN(n))) return null;
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return null;
    };

    type Best = { key: string; valueStr: string; numericRank: number };
    let best: Best | null = null;
    // For pace, smaller = better. For dist/time, larger = better.
    const isLowerBetter = bestMetric === "pace";

    for (const [key, rec] of Object.entries(merged)) {
      const d = new Date(`${key}T00:00:00`);
      if (isNaN(d.getTime()) || d < cutoff || d > today) continue;

      let n: number | null = null;
      let str = "";
      if (bestMetric === "dist") {
        n = parseFloat(rec.dist);
        if (isNaN(n)) continue;
        str = rec.dist;
      } else if (bestMetric === "time") {
        n = timeToSec(rec.time);
        if (n == null) continue;
        str = rec.time as string;
      } else {
        n = paceToSec(rec.pace);
        if (n == null) continue;
        str = rec.pace;
      }
      if (
        !best ||
        (isLowerBetter ? n < best.numericRank : n > best.numericRank)
      ) {
        best = { key, valueStr: str, numericRank: n };
      }
    }
    return best;
  }, [userRecords, todayKey, bestMetric]);

  const bestDateLabel = useMemo(() => {
    if (!bestRecord) return null;
    const { y, m, d } = parseKey(bestRecord.key);
    return `${y}.${pad2(m)}.${pad2(d)} 달성!`;
  }, [bestRecord]);

  const bestUnit =
    bestMetric === "dist" ? "km" : bestMetric === "time" ? "" : "/km";
  const bestActiveLabel =
    bestMetric === "dist" ? "거리" : bestMetric === "time" ? "시간" : "페이스";

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

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        track.scrollLeft += e.deltaY;
      }
    };
    track.addEventListener("wheel", onWheel, { passive: false });

    const snapToNearest = () => {
      const slides = Array.from(track.querySelectorAll<HTMLElement>(".hero-slide"));
      if (slides.length === 0) return null;
      const viewCenter = track.scrollLeft + track.clientWidth / 2;
      let nearestIdx = 0;
      let minDist = Infinity;
      slides.forEach((s, i) => {
        const c = s.offsetLeft + s.clientWidth / 2;
        const d = Math.abs(c - viewCenter);
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      });
      // If user flicks fast enough, advance one slide in the direction of motion.
      const FLICK = 0.45; // px/ms
      if (velocity < -FLICK && nearestIdx < slides.length - 1) nearestIdx++;
      else if (velocity > FLICK && nearestIdx > 0) nearestIdx--;
      return slides[nearestIdx];
    };
const getSnapTarget = (velocity: number) => {
  if (!trackRef.current) return null;

  const track = trackRef.current;
  const currentLeft = track.scrollLeft;
  const cards = Array.from(track.children) as HTMLElement[];

  if (cards.length === 0) return null;

  let nearestIndex = 0;
  let minDistance = Infinity;

  cards.forEach((card, index) => {
    const cardCenter = card.offsetLeft + card.clientWidth / 2;
    const trackCenter = currentLeft + track.clientWidth / 2;
    const distance = Math.abs(cardCenter - trackCenter);

    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = index;
    }
  });

  if (velocity > 0.5) {
    nearestIndex = Math.min(nearestIndex + 1, cards.length - 1);
  } else if (velocity < -0.5) {
    nearestIndex = Math.max(nearestIndex - 1, 0);
  }

  return cards[nearestIndex];
};
    const snapWithVelocity = (velocity: number) => {
      const target = getSnapTarget(velocity);
      if (!target) return;
      const targetLeft = target.offsetLeft - (track.clientWidth - target.clientWidth) / 2;
      track.scrollTo({ left: targetLeft, behavior: "smooth" });
    };

    let isDown = false;
    let captured = false;
    let startX = 0;
    let startScroll = 0;
    let dragDistance = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    const DRAG_THRESHOLD = 4;

    const onDown = (e: PointerEvent) => {
      isDown = true;
      captured = false;
      dragDistance = 0;
      startX = e.clientX;
      startScroll = track.scrollLeft;
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
        // 1:1 follow-finger scroll; CSS disables snap while .dragging is set.
        track.scrollLeft = startScroll - dx;
        // Smooth (low-pass) velocity sampling — px/ms.
        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 0) {
          const inst = (e.clientX - lastX) / dt;
          velocity = velocity * 0.6 + inst * 0.4;
        }
        lastX = e.clientX;
        lastTime = now;
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      if (captured) {
        try {
          track.releasePointerCapture(e.pointerId);
        } catch {}
        // Stale velocity guard — if the pointer paused before release, treat as 0.
        const sinceMove = performance.now() - lastTime;
        if (sinceMove > 80) velocity = 0;
        // Run snap on the next frame so the browser has up-to-date scrollLeft.
        requestAnimationFrame(() => snapWithVelocity(velocity));
        // Re-enable CSS snap after the smooth animation roughly finishes
        // so subsequent native scrolls still snap on each slide.
        window.setTimeout(() => {
          track.classList.remove("dragging");
        }, 280);
      }
      if (dragDistance > DRAG_THRESHOLD) {
        const suppress = (ev: Event) => {
          ev.stopPropagation();
          ev.preventDefault();
        };
        track.addEventListener("click", suppress, { capture: true, once: true });
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
            /* 기본 프로필 — basic_pro 이미지 사용. 51x51 렌더. */
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/basic_pro.png" alt="" className="greet-avatar-img" draggable={false} />
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
            {/* 기존 Mascot 제거. runcard_cha 캐릭터 이미지(86×116px)를 카드 하단에 배치. */}
            <div className="hm-mascot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/runcard_cha.png" alt="" draggable={false} />
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
              이번주 러닝 기록{" "}
              <span className="cal" aria-hidden="true">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/weekly_cal.png" alt="" draggable={false} />
              </span>
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
          {/* 우측 하단 배경 이미지 — month_run_bg.png (72×58px, 살짝 위로) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hs-bg-art" src="/month_run_bg.png" alt="" aria-hidden draggable={false} />
          <div className="hs-head">
            {/* 아이콘 상단 배치 — month_run.png (16×22px) */}
            <span className="hs-ico">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/month_run.png" alt="" draggable={false} />
            </span>
            <span className="hs-label">이번달 러닝 횟수</span>
          </div>
          <div className="hs-value">
            {monthStats.cur} <small>회</small>
          </div>
          <div className={`hs-badge ${monthStats.badge.cls}`}>{monthStats.badge.text}</div>
        </button>
        <div className="hs-card hs-best">
          <button
            type="button"
            className="best-options-btn"
            onClick={(e) => {
              e.stopPropagation();
              setModal("bestPicker");
            }}
            aria-label="최고 기록 옵션 변경"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="5" cy="12" r="1.4" fill="currentColor" />
              <circle cx="12" cy="12" r="1.4" fill="currentColor" />
              <circle cx="19" cy="12" r="1.4" fill="currentColor" />
            </svg>
          </button>

          <button
            type="button"
            className="hs-best-body"
            onClick={() => bestRecord && goToRecordOnArchive(bestRecord.key)}
            aria-label="최고 기록 보러가기"
            disabled={!bestRecord}
          >
            {/* 우측 하단 배경 이미지 — best_run_bg.png (62×58px, 살짝 위로) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="hs-bg-art" src="/best_run_bg.png" alt="" aria-hidden draggable={false} />
            <div className="hs-head">
              {/* 아이콘 상단 배치 — best_run.png (20×22px) */}
              <span className="hs-ico">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/best_run.png" alt="" draggable={false} />
              </span>
              <span className="hs-label">최고 {bestActiveLabel}(90일간)</span>
            </div>
            <div className="hs-value">
              {bestRecord ? bestRecord.valueStr : "—"}
              {bestUnit && <small>{bestUnit}</small>}
            </div>
            <div className="hs-badge gray">
              {bestDateLabel || "기록 없음"}
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
