"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { styleCards } from "@/data/styleCards";
import type { StyleCard } from "@/types";
import Mascot from "@/components/ui/Mascot";
import StylePreviewCard from "./StylePreviewCard";

function StyleCardEl({ c, isSavedTab }: { c: StyleCard; isSavedTab: boolean }) {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const removeSavedStyle = useAppStore((s) => s.removeSavedStyle);
  const applyStudioStyle = useAppStore((s) => s.applyStudioStyle);
  const setStudioTab = useAppStore((s) => s.setStudioTab);

  const onBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedStyle(c.id);
    showToast("저장한 스타일에서 삭제했어요");
  };

  /**
   * "이 스타일 사용하기" — 보관함 → 스튜디오 진입 플로우.
   *
   *  1) applyStudioStyle 로 store 의 텍스트/스티커 레이아웃에 카드의 template
   *     을 덧붙임. 기존 배경/텍스트/스티커는 보존됨.
   *  2) 스튜디오의 활성 탭을 "edit" 으로 초기화해서, 진입 시 사용자가 바로
   *     카드를 보고 추가 편집을 시작할 수 있게 함.
   *  3) /studio 로 라우팅.
   */
  const onUse = () => {
    applyStudioStyle(c);
    setStudioTab("edit");
    showToast(`${c.title} 스타일을 적용했어요`);
    router.push("/studio");
  };

  return (
    <div className="style-block">
      <StylePreviewCard
        style={c}
        showBookmark={isSavedTab}
        onBookmarkClick={onBookmarkClick}
      />
      <button className="style-use-btn" onClick={onUse}>
        이 스타일 사용하기
      </button>
    </div>
  );
}

export default function StyleBody() {
  const sub = useAppStore((s) => s.styleSubTab);
  const setSub = useAppStore((s) => s.setStyleSubTab);
  const removedIds = useAppStore((s) => s.removedSavedStyleIds);
  const userSavedStyles = useAppStore((s) => s.userSavedStyles);

  // For the "saved" tab: merge default samples + user-saved styles, remove user-deleted ones.
  // For the "mine" tab: just show the seed data.
  const baseCards = styleCards[sub] || [];
  let cards: StyleCard[];
  if (sub === "saved") {
    // user-saved first (newest on top), then default samples; dedupe by id.
    const seen = new Set<string>();
    const merged: StyleCard[] = [];
    for (const c of [...userSavedStyles, ...baseCards]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      merged.push(c);
    }
    cards = merged.filter((c) => !removedIds.includes(c.id));
  } else {
    cards = baseCards;
  }

  return (
    <div className="style-area">
      <div className="style-subtabs">
        <button className={`sst${sub === "saved" ? " active" : ""}`} onClick={() => setSub("saved")}>
          저장한 스타일
        </button>
        <button className={`sst${sub === "mine" ? " active" : ""}`} onClick={() => setSub("mine")}>
          내가 만든 스타일
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="style-empty">
          <div className="style-empty-mascot">
            <Mascot />
          </div>
          <div className="style-empty-title">
            {sub === "saved" ? "저장한 스타일이 없어요" : "아직 만든 스타일이 없어요"}
          </div>
          <div className="style-empty-sub">
            {sub === "saved"
              ? "갤러리에서 마음에 드는 스타일을 저장해보세요"
              : "스튜디오에서 나만의 스타일을 만들어보세요"}
          </div>
        </div>
      ) : (
        <div className="style-list">
          {cards.map((c) => (
            <StyleCardEl key={c.id} c={c} isSavedTab={sub === "saved"} />
          ))}
        </div>
      )}
    </div>
  );
}
