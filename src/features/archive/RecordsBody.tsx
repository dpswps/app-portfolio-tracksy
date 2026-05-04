"use client";

import { useAppStore } from "@/stores/useAppStore";
import Calendar from "./Calendar";
import RecordsList from "./RecordsList";
import ImportSection from "./ImportSection";
import AICard from "./AICard";

export default function RecordsBody() {
  const view = useAppStore((s) => s.archiveView);
  const expanded = useAppStore((s) => s.archiveCalExpanded);
  const month = useAppStore((s) => s.archiveMonth);
  const setView = useAppStore((s) => s.setArchiveView);
  const toggleExp = useAppStore((s) => s.toggleCalExpanded);
  const setMonth = useAppStore((s) => s.setArchiveMonth);

  const prev = () => {
    const { y, m } = month;
    if (m === 1) setMonth(y - 1, 12);
    else setMonth(y, m - 1);
  };
  const next = () => {
    const { y, m } = month;
    if (m === 12) setMonth(y + 1, 1);
    else setMonth(y, m + 1);
  };

  return (
    <>
      <div className="records-area">
        <div className="month-bar">
          <button className="mb-arrow" onClick={prev} aria-label="이전 달">
            ‹
          </button>
          <span className="mb-title">
            {month.y}년 {month.m}월
          </span>
          <button className="mb-arrow" onClick={next} aria-label="다음 달">
            ›
          </button>
          <div className="mb-toggles">
            <button
              className={`mb-toggle${view === "list" ? " active" : ""}`}
              onClick={() => setView(view === "list" ? "calendar" : "list")}
              aria-label={view === "list" ? "캘린더 보기" : "리스트 보기"}
            >
              {view === "list" ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M3 10h18M8 2v4M16 2v4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            {view === "calendar" && (
              <button className="mb-toggle" onClick={toggleExp} aria-label="펼치기">
                {expanded ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {view === "calendar" ? <Calendar /> : <RecordsList />}
      </div>

      <ImportSection />
      <AICard />
    </>
  );
}
