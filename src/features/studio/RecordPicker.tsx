"use client";

import { useEffect, useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { archiveRecords } from "@/data/archiveRecords";

function formatDate(date: string) {
  // "2026-04-30" → "2026.04.30 (목)"
  const [y, m, d] = date.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(y, m - 1, d);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${
    days[dt.getDay()]
  })`;
}

export default function RecordPicker() {
  const open = useAppStore((s) => s.studioRecordPickerOpen);
  const setOpen = useAppStore((s) => s.setStudioRecordPickerOpen);
  const loadRecord = useAppStore((s) => s.loadStudioRecord);
  const showToast = useAppStore((s) => s.showToast);
  const userRecords = useAppStore((s) => s.userRecords);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // userRecords + archiveRecords 머지본 — 사용자가 직접입력/타사앱연동/캡쳐스캔으로
  // 저장한 기록도 함께 보여주고, 같은 날짜면 사용자 기록을 우선.
  // entries: [date, rec, isUser] — isUser는 UI에 "내 기록" 뱃지 표시용.
  const entries = useMemo(() => {
    const merged: Record<string, { rec: (typeof archiveRecords)[string]; isUser: boolean }> = {};
    for (const [date, rec] of Object.entries(archiveRecords)) {
      merged[date] = { rec, isUser: false };
    }
    for (const [date, rec] of Object.entries(userRecords)) {
      merged[date] = { rec, isUser: true };
    }
    return Object.entries(merged)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, v]) => ({ date, rec: v.rec, isUser: v.isUser }));
  }, [userRecords]);

  if (!open) return null;

  const onPick = (date: string) => {
    loadRecord(date);
    showToast(`${formatDate(date)} 기록을 불러왔어요`);
    setOpen(false);
  };

  return (
    <div className="record-picker-backdrop" onClick={() => setOpen(false)}>
      <div className="record-picker" onClick={(e) => e.stopPropagation()}>
        <div className="rp-handle" aria-hidden />
        <div className="rp-header">
          <span className="rp-title">내 기록 보관소</span>
          <button
            className="rp-close"
            aria-label="닫기"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="rp-list">
          {entries.length === 0 && (
            <div className="rp-empty">저장된 기록이 없어요</div>
          )}
          {entries.map(({ date, rec, isUser }) => (
            <button
              key={date}
              className={`rp-row${isUser ? " rp-row-user" : ""}`}
              onClick={() => onPick(date)}
            >
              <div className="rp-row-date">
                {formatDate(date)}
                {isUser && <span className="rp-row-badge">내 기록</span>}
              </div>
              <div className="rp-row-stats">
                <span>
                  <b>{rec.dist}</b> km
                </span>
                <span>
                  <b>{rec.pace}</b>
                </span>
                {rec.bpm != null ? (
                  <span>
                    <b>{rec.bpm}</b> bpm
                  </span>
                ) : (
                  rec.time && (
                    <span>
                      <b>{rec.time}</b>
                    </span>
                  )
                )}
              </div>
              <span className="rp-row-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
