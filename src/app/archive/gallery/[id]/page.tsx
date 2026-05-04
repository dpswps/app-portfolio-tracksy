"use client";

import { useParams, useRouter } from "next/navigation";
import { galleryCards } from "@/data/galleryCards";
import { useAppStore } from "@/stores/useAppStore";

export default function GalleryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);

  const card =
    galleryCards.find((c) => String(c.id) === String(params.id)) || galleryCards[0];

  const back = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/archive");
  };

  return (
    <>
      <div className="app-header g-detail-header">
        <button className="back-btn" onClick={back} aria-label="뒤로">
          ‹
        </button>
        <div className="g-detail-title">갤러리 게시물</div>
        <button
          className="g-detail-bookmark"
          aria-label="저장"
          onClick={() => showToast("저장했어요")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </button>
      </div>

      <section className="g-detail">
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

            <div className="gd-reactions">
              <span className="gd-react">❤ {card.likes}</span>
              <span className="gd-react">💬 {card.comments}</span>
            </div>
          </div>
        </div>

        <div className="g-detail-body">
          <div className="gd-body-title">{card.title}</div>
          <div className="gd-body-sub">
            {card.dist}km · {card.time} · 평균 페이스 {card.pace}
          </div>
        </div>

        <div className="g-detail-actions">
          <button
            className="gd-act"
            onClick={() => showToast("즐겨찾기에 추가했어요")}
          >
            <span>⭐</span> 즐겨찾기
          </button>
          <button
            className="gd-act primary"
            onClick={() => showToast("이 카드 템플릿을 적용했어요")}
          >
            <span>✨</span> 이 템플릿 사용하기
          </button>
        </div>
      </section>
    </>
  );
}
