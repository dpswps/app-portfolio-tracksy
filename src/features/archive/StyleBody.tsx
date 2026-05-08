"use client";

import { useAppStore } from "@/stores/useAppStore";
import { styleCards } from "@/data/styleCards";
import type { StyleCard } from "@/types";
import Mascot from "@/components/ui/Mascot";

function StyleCardEl({ c, isSavedTab }: { c: StyleCard; isSavedTab: boolean }) {
  const showToast = useAppStore((s) => s.showToast);
  const removeSavedStyle = useAppStore((s) => s.removeSavedStyle);

  const onBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeSavedStyle(c.id);
    showToast("저장한 스타일에서 삭제했어요");
  };

  return (
    <div className="style-block">
      <div className="style-card">
        <div className="sc-bg" style={{ background: c.bg }} />
        <div className="sc-overlay" />
        {isSavedTab && (
          <button
            className="sc-bookmark saved"
            aria-label="저장한 스타일에서 삭제"
            onClick={onBookmarkClick}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
          </button>
        )}
        <div className="sc-content">
          <div className="sc-meta">{c.date}</div>
          <div className="sc-title">{c.title}</div>
          <div className="sc-dist" style={{ color: c.distColor || "#fff" }}>
            {c.dist}
          </div>
          <div className="sc-dist-unit" style={{ color: c.distColor || "#fff" }}>
            킬로미터
          </div>
          <div className="sc-stats">
            <div className="sc-stat-row">
              {c.stats.slice(0, 3).map((s, i) => (
                <div key={i} className="sc-stat">
                  <b>{s.v}</b>
                  <i>{s.l}</i>
                </div>
              ))}
            </div>
            <div className="sc-stat-row">
              {c.stats.slice(3, 6).map((s, i) => (
                <div key={i} className="sc-stat">
                  <b>{s.v}</b>
                  <i>{s.l}</i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <button
        className="style-use-btn"
        onClick={() => showToast(`${c.title} 스타일을 적용했어요`)}
      >
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
