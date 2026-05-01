"use client";

import { useAppStore } from "@/stores/useAppStore";
import { galleryCards } from "@/data/galleryCards";
import { pad2 } from "@/lib/date";

export default function GalleryBody() {
  const { y, m } = useAppStore((s) => s.galleryFilter);
  const setSheet = useAppStore((s) => s.setGallerySheet);
  const showToast = useAppStore((s) => s.showToast);

  return (
    <div className="gallery-area">
      <div className="gallery-filters">
        <button className="gf-pill" onClick={() => setSheet("year")}>
          <span>{y}년</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <button className="gf-pill" onClick={() => setSheet("month")}>
          <span>{pad2(m)}월</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      <div className="gallery-grid">
        {galleryCards.map((c) => (
          <div key={c.id} className="g-card" onClick={() => showToast(c.title)}>
            <div className="gc-bg" style={{ background: c.bg }} />
            <div className="gc-overlay" />
            <div className="gc-content">
              <div className="gc-meta">{c.date}</div>
              <div className="gc-title">{c.title}</div>
              <div className="gc-dist">
                {c.dist}
                <small>킬로미터</small>
              </div>
              <div className="gc-stats">
                <div className="gcs-cell">
                  <b>{c.pace}</b>
                  <i>평균 페이스</i>
                </div>
                <div className="gcs-cell">
                  <b>{c.time}</b>
                  <i>시간</i>
                </div>
                <div className="gcs-cell">
                  <b>{c.elev}</b>
                  <i>누적 상승</i>
                </div>
                <div className="gcs-cell">
                  <b>{c.kcal}</b>
                  <i>칼로리</i>
                </div>
                <div className="gcs-cell">
                  <b>{c.bpm}</b>
                  <i>평균 심박</i>
                </div>
                <div className="gcs-cell">
                  <b>{c.cadence}</b>
                  <i>케이던스</i>
                </div>
              </div>
              <div className="gc-reactions">
                <span className="gcr-item">❤ {c.likes}</span>
                <span className="gcr-item">💬 {c.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
