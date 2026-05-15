"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { myCards } from "@/data/myCards";

export default function CommunityComposePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);
  const composeSelectedCardId = useAppStore((s) => s.composeSelectedCardId);
  const setComposeSelectedCardId = useAppStore((s) => s.setComposeSelectedCardId);

  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");

  const selectedCard = composeSelectedCardId
    ? myCards.find((c) => c.id === composeSelectedCardId) ?? null
    : null;
  // 카드 픽커에서 선택된 카드의 sprite index — myCards 배열 안에서의 위치(0/1/2).
  // 픽커 페이지와 동일한 community-mycards.png 스프라이트의 같은 슬라이스를 보여줘서
  // 미리보기가 픽커에서 본 모습 그대로 노출되도록.
  const selectedSpriteIdx = selectedCard
    ? myCards.findIndex((c) => c.id === selectedCard.id)
    : -1;

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/community");
  };

  const goToPicker = () => router.push("/community/compose/cards");

  const removeCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    setComposeSelectedCardId(null);
  };

  return (
    <div className="comm-compose-screen">
      <div className="app-header comm-post-header">
        <button className="back-btn" onClick={back}>
          ‹
        </button>
        <div className="comm-post-user">
          <div
            className="cpu-avatar"
            style={{ background: "linear-gradient(135deg,#A78BFA,#7C3AED)" }}
          />
          <span>{user.name || "김러너"}</span>
        </div>
        {/* 우측 상단 북마크 버튼 제거. 헤더 균형 유지를 위해 spacer 만 둠. */}
        <span style={{ marginLeft: "auto", width: 32, height: 32 }} aria-hidden="true" />
      </div>
      <section className="comm-compose">
        {selectedCard ? (
          /* 선택된 카드 미리보기 — 픽커에서 본 동일한 card_2 스프라이트 슬라이스를 사용.
             텍스트 오버레이는 이미 이미지에 포함되어 있으므로 별도 렌더 안 함. */
          <div
            className="compose-canvas has-card-sprite"
            onClick={goToPicker}
            role="button"
            tabIndex={0}
          >
            <div
              className={`cc-card-sprite cc-card-sprite-${selectedSpriteIdx}`}
              aria-label={`${selectedCard.title} 카드`}
            />
            <button
              type="button"
              className="cc-card-remove"
              onClick={removeCard}
              aria-label="카드 제거"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="compose-canvas">
            {/* 캐릭터 + 카드 아이콘 — public/tracksy-card.png (트랙시 마스코트가 카드 액자
                를 들고 있는 단일 일러스트). 이전 Mascot + 별도 카드 SVG 두 개를 합쳐
                하나의 이미지로 대체. */}
            <div className="cc-tracksy">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tracksy-card.png" alt="" draggable={false} />
            </div>
            <div className="cc-bring">카드 가져오기</div>
            <button
              className="cc-plus"
              onClick={goToPicker}
              aria-label="카드 가져오기"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        )}
        <div className="compose-fields">
          <input
            type="text"
            className="compose-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="캡션 추가..."
          />
          <input
            type="text"
            className="compose-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="해시태그 추가..."
          />
        </div>
        <div className="compose-actions">
          <button
            className="compose-template-btn"
            onClick={() => showToast("저장된 템플릿을 불러왔어요")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
            저장된 템플릿 가져오기
          </button>
          <button
            className="compose-submit-btn"
            onClick={() => showToast("등록되었어요")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            등록하기
          </button>
        </div>
      </section>
    </div>
  );
}
