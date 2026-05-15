"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";
import { myCards, type MyRunCard } from "@/data/myCards";

/**
 * 커뮤니티 글쓰기 → 카드 가져오기.
 *
 * 한 화면에 3장의 러닝 카드가 스크롤 없이 모두 보이는 컴팩트 레이아웃.
 * 카드 사진은 /community-mycards.png (세로 3장 스프라이트) 를 slice 해서 사용.
 * 원본 이미지의 우측 상단 북마크 아이콘은 mask 처리로 가린다.
 */

function CardItem({
  card,
  spriteIdx,
  selected,
  onSelect,
}: {
  card: MyRunCard;
  spriteIdx: number;
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
        <div className={`mc2-photo mc2-photo-${spriteIdx}`} aria-hidden="true" />
        {/* 업데이트된 card_2.png 에는 더 이상 북마크 아이콘이 없어서 별도 마스크 불필요 */}
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
  const [selected, setSelected] = useState<string | null>(initialId);

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
    <>
      <AppHeader title="내가 만든 카드" fallback="/community/compose" />
      <section className="mc2-screen">
        <p className="mc2-sub">커뮤니티에 공유할 러닝 기록 카드를 선택하세요.</p>
        <div className="mc2-list">
          {myCards.slice(0, 3).map((card, i) => (
            <CardItem
              key={card.id}
              card={card}
              spriteIdx={i}
              selected={selected === card.id}
              onSelect={() => select(card.id)}
            />
          ))}
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
    </>
  );
}
