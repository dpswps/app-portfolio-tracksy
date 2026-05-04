"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { KO_DOW, dateKey, pad2 } from "@/lib/date";

function formatDateInput(y: number, m: number, d: number) {
  return `${y}.${pad2(m)}.${pad2(d)}`;
}

function inputToKey(input: string): string | null {
  const m = input.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (!m) return null;
  return dateKey(Number(m[1]), Number(m[2]), Number(m[3]));
}

function keyToInput(key: string): string {
  const [y, mm, dd] = key.split("-");
  return `${y}.${mm}.${dd}`;
}

export default function ArchiveManualPage() {
  return (
    <Suspense fallback={<div className="archive-modal" />}>
      <ManualForm />
    </Suspense>
  );
}

function ManualForm() {
  const router = useRouter();
  const search = useSearchParams();
  const showToast = useAppStore((s) => s.showToast);
  const addRecord = useAppStore((s) => s.addRecord);
  const setArchiveMonth = useAppStore((s) => s.setArchiveMonth);
  const pickDate = useAppStore((s) => s.pickDate);
  const archiveSelected = useAppStore((s) => s.archiveSelected);

  const initialDateKey = search?.get("date") || null;
  const [date, setDate] = useState(initialDateKey ? keyToInput(initialDateKey) : "");
  const [dist, setDist] = useState("");
  const [time, setTime] = useState("");
  const [pace, setPace] = useState("");
  const [note, setNote] = useState("");

  const today = new Date();
  const initialPickerYM = (() => {
    if (initialDateKey) {
      const [yy, mm] = initialDateKey.split("-").map(Number);
      return { y: yy, m: mm };
    }
    return { y: today.getFullYear(), m: today.getMonth() + 1 };
  })();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYM, setPickerYM] = useState<{ y: number; m: number }>(initialPickerYM);
  const [pickedKey, setPickedKey] = useState<string | null>(initialDateKey);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickerOpen]);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/archive");
  };

  const save = () => {
    if (!date || !dist) {
      showToast("날짜와 거리는 필수예요");
      return;
    }
    const key = inputToKey(date);
    if (!key) {
      showToast("날짜 형식이 올바르지 않아요 (예: 2026.05.04)");
      return;
    }
    addRecord(key, {
      dist: dist.trim(),
      pace: pace.trim(),
      time: time.trim() || undefined,
      note: note.trim() || undefined,
    });
    const [yy, mm] = key.split("-").map(Number);
    setArchiveMonth(yy, mm);
    if (archiveSelected !== key) {
      pickDate(key);
    }
    showToast("기록을 저장했어요");
    setTimeout(() => back(), 500);
  };

  const togglePicker = () => {
    setPickerOpen((v) => !v);
  };

  const prevMonth = () => {
    setPickerYM(({ y, m }) => (m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }));
  };
  const nextMonth = () => {
    setPickerYM(({ y, m }) => (m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }));
  };

  const onPickDay = (y: number, m: number, d: number) => {
    const key = dateKey(y, m, d);
    setPickedKey(key);
    setDate(formatDateInput(y, m, d));
    setPickerOpen(false);
  };

  const { y, m } = pickerYM;
  const firstDow = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const prevDays = new Date(y, m - 1, 0).getDate();
  type Cell = { d: number; key: string; other: boolean; y: number; m: number };
  const cells: Cell[] = [];
  for (let i = 0; i < firstDow; i++) {
    const d = prevDays - firstDow + 1 + i;
    const py = m === 1 ? y - 1 : y;
    const pm = m === 1 ? 12 : m - 1;
    cells.push({ d, key: dateKey(py, pm, d), other: true, y: py, m: pm });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ d, key: dateKey(y, m, d), other: false, y, m });
  }
  while (cells.length % 7) {
    const d = cells.length - firstDow - daysInMonth + 1;
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    cells.push({ d, key: dateKey(ny, nm, d), other: true, y: ny, m: nm });
  }

  return (
    <div className="archive-modal">
      <div className="am-head">
        <div>
          <div className="am-title">데이터 직접 입력하기</div>
          <div className="am-sub">직접 러닝 기록을 입력해 보세요.</div>
        </div>
        <button className="am-close" onClick={back} aria-label="닫기">
          ×
        </button>
      </div>
      <div className="am-card">
        <div className="am-field">
          <label>날짜</label>
          <div className="am-date-input">
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="입력하기"
              readOnly
              onClick={togglePicker}
            />
            <button
              type="button"
              className="am-cal-btn"
              onClick={togglePicker}
              aria-label="캘린더 열기"
              aria-expanded={pickerOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18M8 2v4M16 2v4" />
              </svg>
            </button>

            {pickerOpen && (
              <div className="am-cal-pop" ref={pickerRef} role="dialog" aria-label="날짜 선택">
                <div className="amcp-head">
                  <button className="amcp-arrow" onClick={prevMonth} aria-label="이전 달" type="button">
                    ‹
                  </button>
                  <span className="amcp-title">
                    {y}년 {m}월
                  </span>
                  <button className="amcp-arrow" onClick={nextMonth} aria-label="다음 달" type="button">
                    ›
                  </button>
                </div>
                <div className="amcp-dow">
                  {KO_DOW.map((d, i) => (
                    <span key={d} className={i === 0 ? "sun" : i === 6 ? "sat" : ""}>
                      {d}
                    </span>
                  ))}
                </div>
                <div className="amcp-grid">
                  {cells.map((c, i) => {
                    const dow = i % 7;
                    const cls = ["amcp-day"];
                    if (c.other) cls.push("other");
                    if (pickedKey === c.key) cls.push("sel");
                    if (dow === 0) cls.push("sun");
                    if (dow === 6) cls.push("sat");
                    return (
                      <button
                        key={`${c.key}-${i}`}
                        type="button"
                        className={cls.join(" ")}
                        onClick={() => onPickDay(c.y, c.m, c.d)}
                      >
                        {c.d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="am-field">
          <label>거리</label>
          <input type="text" value={dist} onChange={(e) => setDist(e.target.value)} placeholder="입력하기" />
        </div>
        <div className="am-field">
          <label>시간</label>
          <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="입력하기" />
        </div>
        <div className="am-field">
          <label>평균 페이스</label>
          <input type="text" value={pace} onChange={(e) => setPace(e.target.value)} placeholder="입력하기" />
        </div>
        <div className="am-field">
          <label>러닝 메모(선택)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder=""
          />
          <div className="am-counter">
            <span>{note.length}</span>/200
          </div>
        </div>
      </div>
      <button className="primary-btn am-save" onClick={save}>
        기록 저장하기
      </button>
    </div>
  );
}
