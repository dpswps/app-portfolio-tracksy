"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { galleryCards } from "@/data/galleryCards";
import { pad2 } from "@/lib/date";
import Mascot from "@/components/ui/Mascot";

export default function GalleryBody() {
  const router = useRouter();
  const { y, m } = useAppStore((s) => s.galleryFilter);
  const setSheet = useAppStore((s) => s.setGallerySheet);
  const setGalleryFilter = useAppStore((s) => s.setGalleryFilter);
  // 사용자가 스튜디오에서 저장한 카드들과 기본 샘플을 함께 노출.
  // 사용자 카드는 항상 위쪽(=최신순)에 먼저, 그 뒤에 샘플 카드.
  const userGalleryCards = useAppStore((s) => s.userGalleryCards);
  const allCards = [...userGalleryCards, ...galleryCards];
  const filteredCards = allCards.filter((c) => c.y === y && c.m === m);

  /* 갤러리 보관소 진입 시 현재 연/월로 자동 동기화.
   * 사용자가 6월에 들어오면 6월, 7월에 들어오면 7월이 기본으로 보이도록.
   * (마운트 시 한 번만 동기화 — 같은 세션 안에서 사용자가 다른 연/월로
   * 이동하는 건 그대로 허용.) */
  useEffect(() => {
    const now = new Date();
    setGalleryFilter({ y: now.getFullYear(), m: now.getMonth() + 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {filteredCards.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-mascot">
            <Mascot />
          </div>
          <div className="gallery-empty-title">
            {y}년 {pad2(m)}월에 저장된 카드가 없어요
          </div>
          <div className="gallery-empty-sub">
            다른 연도 / 월을 선택해보세요
          </div>
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredCards.map((c) => (
            <div
              key={c.id}
              className="g-card"
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/archive/gallery/${c.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/archive/gallery/${c.id}`);
                }
              }}
            >
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
