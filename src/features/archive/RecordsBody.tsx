"use client";

import { useAppStore } from "@/stores/useAppStore";
import Calendar from "./Calendar";
import RecordsList from "./RecordsList";
import ImportSection from "./ImportSection";
import AICard from "./AICard";

export default function RecordsBody() {
  const view = useAppStore((s) => s.archiveView);
  const month = useAppStore((s) => s.archiveMonth);
  const setView = useAppStore((s) => s.setArchiveView);
  const setMonth = useAppStore((s) => s.setArchiveMonth);
  const setModal = useAppStore((s) => s.setModal);

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
  const openPicker = () => setModal("monthPicker");

  return (
    <>
      <div className="records-area">
        <div className="month-bar">
          <button className="mb-arrow" onClick={prev} aria-label="이전 달">
            ‹
          </button>
          <button
            type="button"
            className="mb-title-btn"
            onClick={openPicker}
            aria-label="년월 선택"
          >
            <span className="mb-title">
              {month.y}년 {month.m}월
            </span>
            <svg className="mb-title-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button className="mb-arrow" onClick={next} aria-label="다음 달">
            ›
          </button>
          <div className="view-toggle" role="tablist" aria-label="보기 방식">
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              className={`vt-btn${view === "list" ? " active" : ""}`}
              onClick={() => setView("list")}
              aria-label="리스트 보기"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "calendar"}
              className={`vt-btn${view === "calendar" ? " active" : ""}`}
              onClick={() => setView("calendar")}
              aria-label="캘린더 보기"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18M8 2v4M16 2v4" />
              </svg>
            </button>
          </div>
        </div>

        {view === "calendar" ? <Calendar /> : <RecordsList />}
      </div>

      <ImportSection />
      <AICard />
    </>
  );
}
