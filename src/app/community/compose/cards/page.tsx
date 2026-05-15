"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";
import { galleryCards } from "@/data/galleryCards";
import type { GalleryCard } from "@/types";

/**
 * 커뮤니티 글쓰기 → 카드 가져오기.
 *
 * 보관함 > 갤러리 보관소(userGalleryCards + 기본 sample galleryCards) 와 연동.
 * 사용자가 스튜디오에서 저장한 카드(userGalleryCards) 가 항상 위쪽에 먼저 노출.
 *
 * 썸네일은 가로형(가로가 더 긴 비율) 으로 렌더링. 카드를 선택 후 글쓰기 화면으로
 * 돌아가면 세로형(portrait) 으로 미리보기가 표시된다. (모두 동일한 GalleryCard
 * 데이터를 다른 비율의 컨테이너에 그려서 만든다 — 별도 이미지가 필요 없음.)
 */

function CardItem({
  card,
  selected,
  onSelect,
}: {
  card: GalleryCard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`mc2-row${selected ? " selected" : ""}`}>
      <button
        type="button"
        className="mc2-card"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${card.title} 선택`}
      >
        {/* 갤러리 카드와 동일한 시각 — bg(그라데이션/사진) + 어두운 그라데이션 오버레이
            + 텍스트 콘텐츠(date / title / dist / stats). 가로형 비율. */}
        <div className="mc2-cbg" style={{ background: card.bg }} aria-hidden="true" />
        <div className="mc2-coverlay" aria-hidden="true" />
        <div className="mc2-ccontent">
          <div className="mc2-cmeta">{card.date}</div>
          <div className="mc2-ctitle">{card.title}</div>
          <div className="mc2-cdist">
            {card.dist}
            <small>킬로미터</small>
          </div>
          <div className="mc2-cstats">
            <div><b>{card.pace}</b><i>평균 페이스</i></div>
            <div><b>{card.time}</b><i>시간</i></div>
            <div><b>{card.kcal}</b><i>칼로리</i></div>
          </div>
        </div>
      </button>
      <button
        type="button"
        className={`mc2-radio${selected ? " selected" : ""}`}
        onClick={onSelect}
        aria-label={selected ? "선택됨" : "선택"}
      >
        {selected && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function MyCardsPickerPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const setComposeSelectedCardId = useAppStore((s) => s.setComposeSelectedCardId);
  const initialId = useAppStore((s) => s.composeSelectedCardId);
  const userGalleryCards = useAppStore((s) => s.userGalleryCards);
  const [selected, setSelected] = useState<string | null>(initialId);

  // 보관함 > 갤러리 보관소와 동일하게: 사용자 카드를 먼저, 그 뒤에 sample.
  const allCards: GalleryCard[] = [...userGalleryCards, ...galleryCards];

  const select = (id: string) => {
    setSelected((prev) => (prev === id ? null : id));
  };

  const onComplete = () => {
    if (!selected) {
      showToast("카드를 선택해주세요");
      return;
    }
    setComposeSelectedCardId(selected);
    showToast("카드를 가져왔어요");
    router.back();
  };

  const count = selected ? 1 : 0;

  return (
    /* mc2-page 가 AppHeader + mc2-screen 을 한 묶음의 flex column 으로 만들어
     * #screen 전체 높이를 가득 채우고, mc2-screen 이 flex:1 로 남는 공간을
     * 정확히 차지하도록 한다. → 스크롤 없이 한 화면에 다 보임. (목록은 안에서 스크롤) */
    <div className="mc2-page">
      <AppHeader title="내가 만든 카드" fallback="/community/compose" />
      <section className="mc2-screen">
        <p className="mc2-sub">커뮤니티에 공유할 러닝 기록 카드를 선택하세요.</p>
        <div className="mc2-list">
          {allCards.length === 0 ? (
            <div className="mc2-empty">
              <p>저장된 카드가 없어요.</p>
              <p className="mc2-empty-sub">스튜디오에서 카드를 만들어 보관함에 저장해보세요.</p>
            </div>
          ) : (
            allCards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                selected={selected === String(card.id)}
                onSelect={() => select(String(card.id))}
              />
            ))
          )}
        </div>
        <div className="mc2-cta-wrap">
          <button
            type="button"
            className="mc2-cta"
            onClick={onComplete}
            disabled={count === 0}
          >
            <span>선택 완료</span>
            <span className="mc2-cta-count">{count}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
