"use client";

import { useRef } from "react";
import { archiveRecords } from "@/data/archiveRecords";
import { useAppStore } from "@/stores/useAppStore";
import { dateKey, formatKoreanDate, KO_DOW } from "@/lib/date";
import Mascot from "@/components/ui/Mascot";
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
  const DRAG_THRESHOLD = 18;

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY;
    dragStartExpanded.current = expanded;
    triggered.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || triggered.current) return;
    const dy = e.clientY - dragStartY.current;
    if (!dragStartExpanded.current && dy > DRAG_THRESHOLD) {
      triggered.current = true;
      setExpanded(true);
    } else if (dragStartExpanded.current && dy < -DRAG_THRESHOLD) {
      triggered.current = true;
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
  const onHandleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setExpanded(true);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setExpanded(false);
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

  let visibleCells = cells;
  if (!expanded) {
    let anchor = selected;
    if (!anchor || !cells.some((c) => c.key === anchor)) {
      anchor = dateKey(y, m, daysInMonth);
    }
    const idx = cells.findIndex((c) => c.key === anchor);
    const weekStart = Math.floor(idx / 7) * 7;
    visibleCells = cells.slice(weekStart, weekStart + 14);
    if (visibleCells.length < 14) {
      visibleCells = cells.slice(Math.max(0, cells.length - 14));
    }
  }

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
        <div className="cal-grid">
          {visibleCells.map((c, i) => {
            const has = !!allRecords[c.key];
            const isSel = selected === c.key;
            const dow = i % 7;
            const cls = ["cal-day"];
            if (c.other) cls.push("other");
            if (has) cls.push("has");
            if (isSel) cls.push("sel");
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
        <div
          className="cal-drag-handle"
          role="separator"
          tabIndex={0}
          aria-label={expanded ? "위로 드래그하여 캘린더 접기" : "아래로 드래그하여 캘린더 펼치기"}
          aria-orientation="horizontal"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerEnd}
          onPointerCancel={onHandlePointerEnd}
          onKeyDown={onHandleKeyDown}
        >
          <span className="cdh-bar" />
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
        <div className="sel-mascot">
          <Mascot />
        </div>
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
        <div className="sel-mascot">
          <Mascot />
        </div>
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
