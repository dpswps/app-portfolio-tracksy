"use client";

import { useRef } from "react";
import { archiveRecords } from "@/data/archiveRecords";
import { useAppStore } from "@/stores/useAppStore";
import { dateKey, formatKoreanDate, KO_DOW } from "@/lib/date";
import Link from "next/link";

export default function Calendar() {
  const month = useAppStore((s) => s.archiveMonth);
  const expanded = useAppStore((s) => s.archiveCalExpanded);
  const selected = useAppStore((s) => s.archiveSelected);
  const pickDate = useAppStore((s) => s.pickDate);
  const setExpanded = useAppStore((s) => s.setCalExpanded);
  const userRecords = useAppStore((s) => s.userRecords);
  const allRecords = { ...archiveRecords, ...userRecords };

  const dragStartY = useRef<number | null>(null);
  const dragStartExpanded = useRef<boolean>(false);
  const triggered = useRef<boolean>(false);
  // 드래그로 expand/collapse 가 발동된 직후의 click 을 한 번 무시하기 위한 플래그.
  // 단순 click(드래그 없음) 일 땐 토글, 드래그 직후의 click 은 중복 토글 방지.
  const dragWasTriggered = useRef<boolean>(false);
  const DRAG_THRESHOLD = 18;

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY;
    dragStartExpanded.current = expanded;
    triggered.current = false;
    dragWasTriggered.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || triggered.current) return;
    const dy = e.clientY - dragStartY.current;
    if (!dragStartExpanded.current && dy > DRAG_THRESHOLD) {
      triggered.current = true;
      dragWasTriggered.current = true;
      setExpanded(true);
    } else if (dragStartExpanded.current && dy < -DRAG_THRESHOLD) {
      triggered.current = true;
      dragWasTriggered.current = true;
      setExpanded(false);
    }
  };
  const onHandlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current !== null) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
    dragStartY.current = null;
    triggered.current = false;
  };
  /**
   * 단순 클릭 — 드래그가 발동되지 않았던 경우에만 토글.
   * (드래그로 이미 expand/collapse 가 일어났다면 그 직후의 click 은 무시
   *  → 중복 토글 방지.)
   */
  const onHandleClick = () => {
    if (dragWasTriggered.current) {
      dragWasTriggered.current = false;
      return;
    }
    setExpanded(!expanded);
  };
  const onHandleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setExpanded(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setExpanded(false);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setExpanded(!expanded);
    }
  };

  const { y, m } = month;
  const firstDow = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const prevDays = new Date(y, m - 1, 0).getDate();

  type Cell = { d: number; key: string; other: boolean };
  const cells: Cell[] = [];
  for (let i = 0; i < firstDow; i++) {
    const d = prevDays - firstDow + 1 + i;
    cells.push({
      d,
      key: dateKey(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1, d),
      other: true,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ d, key: dateKey(y, m, d), other: false });
  }
  while (cells.length % 7) {
    const d = cells.length - firstDow - daysInMonth + 1;
    cells.push({
      d,
      key: dateKey(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, d),
      other: true,
    });
  }

  /* ──────────────────────────────────────────────────────────
   * 항상 모든 셀을 렌더하고, wrapper의 aspect-ratio와 grid의
   * transform: translateY(...) 를 CSS transition으로 보간해서
   * 펼침/접기 모션이 부드럽게 이어지도록 한다.
   *
   * - 접힘: aspect-ratio = 7/2 (2주만 보임) + translateY로
   *   선택된 날짜가 속한 주를 맨 위로 스크롤.
   * - 펼침: aspect-ratio = 7/totalRows (전체) + translateY=0.
   * ────────────────────────────────────────────────────────── */
  const totalRows = Math.ceil(cells.length / 7);
  const visibleRowsCollapsed = 2;

  let anchor = selected;
  if (!anchor || !cells.some((c) => c.key === anchor)) {
    anchor = dateKey(y, m, daysInMonth);
  }
  const anchorIdx = cells.findIndex((c) => c.key === anchor);
  let startRow = Math.max(0, Math.floor(anchorIdx / 7));
  if (startRow + visibleRowsCollapsed > totalRows) {
    startRow = Math.max(0, totalRows - visibleRowsCollapsed);
  }

  const visibleRows = expanded ? totalRows : visibleRowsCollapsed;
  // grid는 항상 totalRows 높이. 접힘 시 startRow만큼 위로 밀어 보여줄 주만 노출.
  const translatePct = expanded ? 0 : -(startRow / totalRows) * 100;

  // 오늘 날짜의 dateKey — 캘린더에서 "today" 셀에 원형 표시를 위한 비교 기준.
  // 컴포넌트가 마운트되는 시점의 today 를 한 번만 계산해서 사용.
  const _now = new Date();
  const todayKey = dateKey(_now.getFullYear(), _now.getMonth() + 1, _now.getDate());

  return (
    <>
      <div className={`cal-card${expanded ? " expanded" : ""}`}>
        <div className="cal-dow-row">
          {KO_DOW.map((d, i) => (
            <span key={d} className={i === 0 ? "sun" : i === 6 ? "sat" : ""}>
              {d}
            </span>
          ))}
        </div>
        <div
          className="cal-grid-wrap"
          style={{ aspectRatio: `7 / ${visibleRows}` }}
        >
          <div
            className="cal-grid"
            style={{ transform: `translateY(${translatePct}%)` }}
          >
            {cells.map((c, i) => {
              const has = !!allRecords[c.key];
              const isSel = selected === c.key;
              const isToday = c.key === todayKey && !c.other;
              const dow = i % 7;
              const cls = ["cal-day"];
              if (c.other) cls.push("other");
              if (has) cls.push("has");
              if (isSel) cls.push("sel");
              if (isToday) cls.push("today");
              if (dow === 0) cls.push("sun");
              if (dow === 6) cls.push("sat");
              return (
                <button key={`${c.key}-${i}`} className={cls.join(" ")} onClick={() => pickDate(c.key)}>
                  <span className="cd-num">{c.d}</span>
                  <span className="cd-dot" />
                </button>
              );
            })}
          </div>
        </div>
        <div
          className="cal-drag-handle"
          role="button"
          tabIndex={0}
          aria-label={expanded ? "캘린더 접기" : "캘린더 펼치기"}
          aria-expanded={expanded}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerEnd}
          onPointerCancel={onHandlePointerEnd}
          onClick={onHandleClick}
          onKeyDown={onHandleKeyDown}
        >
          {/* 아래/위 꺾쇠(chevron) — 접혀있을 땐 ▼, 펼쳐있을 땐 ▲.
              실제 회전은 CSS의 `.cal-card.expanded` 셀렉터로 처리. */}
          <svg
            className="cdh-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <SelectedDateBlock />
    </>
  );
}

function SelectedDateBlock() {
  const sel = useAppStore((s) => s.archiveSelected);
  const userRecords = useAppStore((s) => s.userRecords);

  if (!sel) {
    return (
      <div className="sel-block sel-empty">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/speech-bubble.png"
          alt=""
          className="sel-bubble"
          width={39}
          height={28}
        />
        <div className="sel-title">아직 선택된 날짜가 없어요</div>
        <div className="sel-sub">
          날짜를 선택하거나<br />
          기록을 추가해보세요
        </div>
        <Link href="/archive/manual" className="primary-btn sel-cta" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
          기록 추가하기 +
        </Link>
      </div>
    );
  }
  const rec = userRecords[sel] || archiveRecords[sel];
  if (!rec) {
    return (
      <div className="sel-block sel-empty">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/speech-bubble.png"
          alt=""
          className="sel-bubble"
          width={39}
          height={28}
        />
        <div className="sel-title">선택된 날짜에 기록이 없어요</div>
        <div className="sel-sub">
          오늘의 러닝을 기록하고<br />
          나만의 기록을 만들어보세요
        </div>
        <Link
          href={`/archive/manual?date=${encodeURIComponent(sel)}`}
          className="primary-btn sel-cta"
          style={{ display: "block", textAlign: "center", textDecoration: "none" }}
        >
          기록 추가하기 +
        </Link>
      </div>
    );
  }

  const thirdLabel = rec.bpm != null ? "심박수" : "시간";
  const thirdValue = rec.bpm != null ? String(rec.bpm) : (rec.time || "—");
  const thirdUnit = rec.bpm != null ? "bpm" : "";

  return (
    <Link
      href={`/archive/records/${encodeURIComponent(sel)}`}
      className="sel-block sel-record sel-record-link"
      aria-label="러닝 기록 자세히 보기"
    >
      <div className="sr-date">{formatKoreanDate(sel)}</div>
      <div className="sr-stats">
        <div className="sr-stat">
          <b>{rec.dist}</b>
          <i>km</i>
          <small>거리</small>
        </div>
        <div className="sr-divider" />
        <div className="sr-stat">
          <b>{rec.pace}</b>
          <i>/km</i>
          <small>페이스</small>
        </div>
        <div className="sr-divider" />
        <div className="sr-stat">
          <b>{thirdValue}</b>
          {thirdUnit && <i>{thirdUnit}</i>}
          <small>{thirdLabel}</small>
        </div>
      </div>
      {rec.note && <div className="sr-note">{rec.note}</div>}
      <div className="sr-detail-hint">자세히 보기 ›</div>
    </Link>
  );
}
