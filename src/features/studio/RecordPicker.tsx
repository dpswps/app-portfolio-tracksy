"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { archiveRecords } from "@/data/archiveRecords";

function formatDate(date: string) {
  // "2026-04-30" → "2026.04.30 (목)"
  const [y, m, d] = date.split("-").map((s) => parseInt(s, 10));
  const dt = new Date(y, m - 1, d);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${days[dt.getDay()]})`;
}

export default function RecordPicker() {
  const open = useAppStore((s) => s.studioRecordPickerOpen);
  const setOpen = useAppStore((s) => s.setStudioRecordPickerOpen);
  const loadRecord = useAppStore((s) => s.loadStudioRecord);
  const showToast = useAppStore((s) => s.showToast);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const entries = Object.entries(archiveRecords).sort(([a], [b]) =>
    a < b ? 1 : -1,
  );

  const onPick = (date: string) => {
    loadRecord(date);
    showToast(`${date} 기록 불러옴`);
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
          {entries.map(([date, rec]) => (
            <button
              key={date}
              className="rp-row"
              onClick={() => onPick(date)}
            >
              <div className="rp-row-date">{formatDate(date)}</div>
              <div className="rp-row-stats">
                <span><b>{rec.dist}</b> km</span>
                <span><b>{rec.pace}</b></span>
                <span><b>{rec.bpm}</b> bpm</span>
              </div>
              <span className="rp-row-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
