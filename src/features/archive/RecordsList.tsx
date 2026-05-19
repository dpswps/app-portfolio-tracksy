"use client";

import Link from "next/link";
import { archiveRecords } from "@/data/archiveRecords";
import { useAppStore } from "@/stores/useAppStore";
import { dateKey, formatKoreanDate } from "@/lib/date";
import Mascot from "@/components/ui/Mascot";

export default function RecordsList() {
  const month = useAppStore((s) => s.archiveMonth);
  const expanded = useAppStore((s) => s.archiveListExpanded);
  const count = useAppStore((s) => s.archiveListCount);
  const toggle = useAppStore((s) => s.toggleListExpanded);
  const bump = useAppStore((s) => s.bumpListCount);
  const resetCount = useAppStore((s) => s.resetListCount);
  const userRecords = useAppStore((s) => s.userRecords);

  const allRecords = { ...archiveRecords, ...userRecords };
  const { y, m } = month;
  const daysInMonth = new Date(y, m, 0).getDate();
  type Item = { key: string; rec: typeof allRecords[string] | null };
  const all: Item[] = [];
  for (let d = daysInMonth; d >= 1; d--) {
    const k = dateKey(y, m, d);
    all.push({ key: k, rec: allRecords[k] || null });
  }
  const items = all.slice(0, count);
  const hasMore = all.length > items.length;

  // 오늘 날짜 key — 리스트 행 중 오늘에 해당하는 항목에 "today" 원형 표시를
  // 위한 비교 기준.
  const _now = new Date();
  const todayKey = dateKey(_now.getFullYear(), _now.getMonth() + 1, _now.getDate());

  return (
    <div className="list-card-wrap">
      {items.map((it) => {
        const isExp = expanded === it.key;
        const isToday = it.key === todayKey;
        const dateLabel = formatKoreanDate(it.key);
        if (!isExp) {
          return (
            <button
              key={it.key}
              className={`list-row${isToday ? " today" : ""}`}
              onClick={() => toggle(it.key)}
            >
              <span className="lr-date">{dateLabel}</span>
              {it.rec ? (
                <span className="lr-stats">
                  <b>{it.rec.dist}</b>
                  <span>km</span>
                  <em>·</em>
                  <b>{it.rec.pace}</b>
                  <span>/km</span>
                  <em>·</em>
                  {it.rec.bpm != null ? (
                    <>
                      <b>{it.rec.bpm}</b>
                      <span>bpm</span>
                    </>
                  ) : (
                    <>
                      <b>{it.rec.time || "—"}</b>
                    </>
                  )}
                </span>
              ) : (
                <span className="lr-empty">기록없음</span>
              )}
              <span className="lr-arrow">›</span>
            </button>
          );
        }
        if (!it.rec) {
          return (
            <div
              key={it.key}
              className={`list-row expanded${isToday ? " today" : ""}`}
            >
              <button className="lr-head" onClick={() => toggle(it.key)}>
                <span className="lr-date">{dateLabel}</span>
                <span className="lr-arrow up">⌃</span>
              </button>
              <div className="lr-body lr-empty-body">
                <div className="lr-empty-mascot">
                  <Mascot />
                </div>
                <div className="lr-empty-title">선택된 날짜에 기록이 없어요</div>
                <div className="lr-empty-sub">오늘의 러닝을 기록해보세요</div>
                <Link
                  href={`/archive/manual?date=${encodeURIComponent(it.key)}`}
                  className="primary-btn lr-empty-cta"
                  style={{ textAlign: "center", textDecoration: "none" }}
                >
                  기록 추가하기 +
                </Link>
              </div>
            </div>
          );
        }
        const thirdLabel = it.rec.bpm != null ? "심박수" : "시간";
        const thirdValue = it.rec.bpm != null ? String(it.rec.bpm) : (it.rec.time || "—");
        const thirdUnit = it.rec.bpm != null ? "bpm" : "";
        return (
          <div
            key={it.key}
            className={`list-row expanded${isToday ? " today" : ""}`}
          >
            <button className="lr-head" onClick={() => toggle(it.key)}>
              <span className="lr-date">{dateLabel}</span>
              <span className="lr-arrow up">⌃</span>
            </button>
            <Link
              href={`/archive/records/${encodeURIComponent(it.key)}`}
              className="lr-body lr-rec-body lr-rec-link"
              aria-label="러닝 기록 자세히 보기"
            >
              <div className="lr-rec-stats">
                <div className="lr-stat">
                  <b>{it.rec.dist}</b>
                  <i>km</i>
                  <small>거리</small>
                </div>
                <div className="lr-stat">
                  <b>{it.rec.pace}</b>
                  <i>/km</i>
                  <small>페이스</small>
                </div>
                <div className="lr-stat">
                  <b>{thirdValue}</b>
                  {thirdUnit && <i>{thirdUnit}</i>}
                  <small>{thirdLabel}</small>
                </div>
              </div>
              {it.rec.note && <div className="lr-rec-note">{it.rec.note}</div>}
              <div className="lr-rec-hint">자세히 보기 ›</div>
            </Link>
          </div>
        );
      })}
      {(hasMore || count > 4) && (
        <div className="list-more-wrap">
          {hasMore && (
            <button className="list-more" onClick={bump}>
              더보기 ▾
            </button>
          )}
          {count > 4 && (
            <button className="list-collapse" onClick={resetCount}>
              접기 ▴
            </button>
          )}
        </div>
      )}
    </div>
  );
}
