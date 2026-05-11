"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";
import { myCards, type MyRunCard } from "@/data/myCards";

function CardItem({
  card,
  selected,
  onSelect,
}: {
  card: MyRunCard;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="mc-row">
      <button
        type="button"
        className="mc-card"
        onClick={onSelect}
        aria-pressed={selected}
      >
        <img className="mc-photo" src={card.image} alt="러닝 카드" />
      </button>
      <button
        type="button"
        className={`mc-radio${selected ? " selected" : ""}`}
        onClick={onSelect}
        aria-label={selected ? "선택됨" : "선택"}
      >
        {selected && (
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
      <section className="mc-screen">
        <p className="mc-sub">커뮤니티에 공유할 러닝 기록 카드를 선택하세요.</p>
        <div className="mc-list">
          {myCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              selected={selected === card.id}
              onSelect={() => select(card.id)}
            />
          ))}
        </div>
        <div className="mc-cta-wrap">
          <button
            type="button"
            className="mc-cta"
            onClick={onComplete}
            disabled={count === 0}
          >
            <span>선택 완료</span>
            <span className="mc-cta-count">{count}</span>
          </button>
        </div>
      </section>
    </>
  );
}
