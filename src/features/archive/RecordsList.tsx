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

  const { y, m } = month;
  const daysInMonth = new Date(y, m, 0).getDate();
  type Item = { key: string; rec: typeof archiveRecords[string] | null };
  const all: Item[] = [];
  for (let d = daysInMonth; d >= 1; d--) {
    const k = dateKey(y, m, d);
    all.push({ key: k, rec: archiveRecords[k] || null });
  }
  const items = all.slice(0, count);
  const hasMore = all.length > items.length;

  return (
    <div className="list-card-wrap">
      {items.map((it) => {
        const isExp = expanded === it.key;
        const dateLabel = formatKoreanDate(it.key);
        if (!isExp) {
          return (
            <button key={it.key} className="list-row" onClick={() => toggle(it.key)}>
              <span className="lr-date">{dateLabel}</span>
              {it.rec ? (
                <span className="lr-stats">
                  <b>{it.rec.dist}</b>
                  <span>km</span>
                  <em>·</em>
                  <b>{it.rec.pace}</b>
                  <span>/km</span>
                  <em>·</em>
                  <b>{it.rec.bpm}</b>
                  <span>bpm</span>
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
            <div key={it.key} className="list-row expanded">
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
                <Link href="/archive/manual" className="primary-btn lr-empty-cta" style={{ textAlign: "center", textDecoration: "none" }}>
                  기록 추가하기 +
                </Link>
              </div>
            </div>
          );
        }
        return (
          <div key={it.key} className="list-row expanded">
            <button className="lr-head" onClick={() => toggle(it.key)}>
              <span className="lr-date">{dateLabel}</span>
              <span className="lr-arrow up">⌃</span>
            </button>
            <div className="lr-body lr-rec-body">
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
                  <b>{it.rec.bpm}</b>
                  <i>bpm</i>
                  <small>심박수</small>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {hasMore && (
        <button className="list-more" onClick={bump}>
          더보기 ▾
        </button>
      )}
    </div>
  );
}
