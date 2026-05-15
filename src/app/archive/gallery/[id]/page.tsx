"use client";

import { useParams, useRouter } from "next/navigation";
import { galleryCards } from "@/data/galleryCards";
import { useAppStore } from "@/stores/useAppStore";
import type { GalleryCard, StyleCard } from "@/types";
import StudioSnapshotCard from "@/features/studio/StudioSnapshotCard";

/** Convert a gallery card into the StyleCard shape used by the saved-styles list. */
function galleryCardToStyle(card: GalleryCard): StyleCard {
  return {
    id: `gallery-${card.id}`,
    date: card.date,
    title: card.title,
    dist: card.dist,
    bg: card.bg,
    stats: [
      { v: card.pace, l: "평균 페이스" },
      { v: card.time, l: "시간" },
      { v: String(card.kcal), l: "칼로리" },
      { v: card.elev, l: "누적 상승" },
      { v: String(card.bpm), l: "평균 심박" },
      { v: String(card.cadence), l: "케이던스" },
    ],
  };
}

export default function GalleryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const addUserSavedStyle = useAppStore((s) => s.addUserSavedStyle);
  const userGalleryCards = useAppStore((s) => s.userGalleryCards);

  // 사용자가 저장한 카드 + 기본 샘플 모두 검색.
  const allCards = [...userGalleryCards, ...galleryCards];
  const card =
    allCards.find((c) => String(c.id) === String(params.id)) || galleryCards[0];

  const back = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/archive");
  };

  const onSaveStyle = () => {
    addUserSavedStyle(galleryCardToStyle(card));
    showToast(`${card.title} 스타일을 저장했어요`);
  };

  return (
    <>
      <div className="app-header g-detail-header">
        <button className="back-btn" onClick={back} aria-label="뒤로">
          ‹
        </button>
        <div className="g-detail-title">갤러리 게시물</div>
        {/* 우측 상단 북마크 아이콘 제거. 헤더 좌우 균형을 위해 빈 spacer로 대체. */}
        <span className="g-detail-spacer" aria-hidden="true" />
      </div>

      <section className="g-detail">
        {card.snapshot ? (
          // 스튜디오에서 저장한 카드 — 편집한 모습 그대로 재현 (스티커/텍스트/테마/레이아웃 등 모두)
          <div className="g-detail-snapshot">
            <div className="gd-meta-floating">{card.date}</div>
            <StudioSnapshotCard snapshot={card.snapshot} />
          </div>
        ) : (
          <div className="g-detail-card">
            <div className="g-detail-bg" style={{ background: card.bg }} />
            <div className="g-detail-overlay" />
            <div className="g-detail-content">
              <div className="gd-meta">{card.date}</div>
              <div className="gd-title">{card.title}</div>
              <div className="gd-distance">
                {card.dist}
                <small>킬로미터</small>
              </div>

              <div className="gd-stats-row">
                <div className="gd-cell">
                  <b>{card.pace}</b>
                  <i>평균 페이스</i>
                </div>
                <div className="gd-cell">
                  <b>{card.time}</b>
                  <i>시간</i>
                </div>
                <div className="gd-cell">
                  <b>{card.kcal}</b>
                  <i>칼로리</i>
                </div>
              </div>
              <div className="gd-stats-row sub">
                <div className="gd-cell">
                  <b>{card.elev}</b>
                  <i>누적 상승</i>
                </div>
                <div className="gd-cell">
                  <b>{card.bpm}</b>
                  <i>평균 심박</i>
                </div>
                <div className="gd-cell">
                  <b>{card.cadence}</b>
                  <i>케이던스</i>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="g-detail-body">
          <div className="gd-body-text">
            <div className="gd-body-title">{card.title}</div>
            <div className="gd-body-sub">
              {card.dist}km · {card.time} · 평균 페이스 {card.pace}
            </div>
          </div>
          <button
            type="button"
            className="gd-save-style-btn"
            onClick={onSaveStyle}
          >
            ✨ 이 스타일 저장하기
          </button>
        </div>
      </section>
    </>
  );
}
