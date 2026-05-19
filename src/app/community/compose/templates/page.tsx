"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";
import { styleCards } from "@/data/styleCards";
import type { StyleCard } from "@/types";

/**
 * 커뮤니티 글쓰기 → 저장된 템플릿 가져오기.
 *
 * "카드 가져오기" 페이지(/community/compose/cards) 와 동일한 패턴.
 * 차이점: GalleryCard 대신 StyleCard 를 다룬다.
 *
 * 데이터 소스:
 *   1) 사용자가 보관함 > 스타일 보관소 에 저장한 StyleCard (userSavedStyles) — 위쪽
 *   2) 샘플 스타일 카드 (styleCards.saved) — 아래쪽
 *
 * 동일 id 가 양쪽에 있으면 사용자 것을 우선 (dedupe). 사용자가 삭제한 샘플
 * (removedSavedStyleIds) 은 목록에서 제외.
 *
 * 선택 후 "선택 완료" 누르면 store 의 composeSelectedTemplateId 에 저장하고
 * router.back() 으로 글쓰기 화면 복귀. 거기서 미리보기와 등록 시 활용.
 */

function TemplateItem({
  card,
  selected,
  onSelect,
}: {
  card: StyleCard;
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
        {/* StyleCard 시각 — bg + 어두운 그라데이션 오버레이 + 날짜/제목/거리/통계.
            카드 가져오기 와 동일한 .mc2-* 클래스 구조 재사용. */}
        <div className="mc2-cbg" style={{ background: card.bg }} aria-hidden="true" />
        <div className="mc2-coverlay" aria-hidden="true" />
        <div className="mc2-ccontent">
          <div className="mc2-cmeta">{card.date}</div>
          <div className="mc2-ctitle">{card.title}</div>
          <div
            className="mc2-cdist"
            style={card.distColor ? { color: card.distColor } : undefined}
          >
            {card.dist}
            <small>킬로미터</small>
          </div>
          <div className="mc2-cstats">
            {/* StyleCard 의 stats 는 동적 배열. 앞 3개만 미리보기에 노출. */}
            {card.stats.slice(0, 3).map((s, i) => (
              <div key={i}>
                <b>{s.v}</b>
                <i>{s.l}</i>
              </div>
            ))}
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

export default function MyTemplatesPickerPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const setComposeSelectedTemplateId = useAppStore(
    (s) => s.setComposeSelectedTemplateId,
  );
  const initialId = useAppStore((s) => s.composeSelectedTemplateId);
  const userSavedStyles = useAppStore((s) => s.userSavedStyles);
  const removedSavedStyleIds = useAppStore((s) => s.removedSavedStyleIds);
  const [selected, setSelected] = useState<string | null>(initialId);

  /**
   * 보관함 > 스타일 보관소 > 저장한 스타일 탭과 동일한 머지 규칙:
   *  - userSavedStyles 가 먼저, 같은 id 가 sample 에 있으면 사용자 것이 우선
   *  - removedSavedStyleIds 에 포함된 id 는 제외 (사용자가 보관함에서 삭제한 항목)
   */
  const sampleCards = styleCards.saved || [];
  const seen = new Set<string>();
  const merged: StyleCard[] = [];
  for (const c of [...userSavedStyles, ...sampleCards]) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    merged.push(c);
  }
  const allTemplates = merged.filter(
    (c) => !removedSavedStyleIds.includes(c.id),
  );

  const select = (id: string) => {
    setSelected((prev) => (prev === id ? null : id));
  };

  const onComplete = () => {
    if (!selected) {
      showToast("템플릿을 선택해주세요");
      return;
    }
    setComposeSelectedTemplateId(selected);
    showToast("템플릿을 가져왔어요");
    router.back();
  };

  const count = selected ? 1 : 0;

  return (
    /* mc2-page 레이아웃을 그대로 재사용 — 카드 가져오기 페이지와 시각적 일관성. */
    <div className="mc2-page">
      <AppHeader title="저장된 템플릿" fallback="/community/compose" />
      <section className="mc2-screen">
        <p className="mc2-sub">
          커뮤니티에 공유할 러닝 기록 템플릿을 선택하세요.
        </p>
        <div className="mc2-list">
          {allTemplates.length === 0 ? (
            <div className="mc2-empty">
              <p>저장된 템플릿이 없어요.</p>
              <p className="mc2-empty-sub">
                보관함 → 스타일 보관소에서 마음에 드는 스타일을 저장해보세요.
              </p>
            </div>
          ) : (
            allTemplates.map((card) => (
              <TemplateItem
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
