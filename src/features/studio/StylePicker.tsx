"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { styleCards } from "@/data/styleCards";
import type { StyleCard } from "@/types";
import Mascot from "@/components/ui/Mascot";
import StylePreviewCard from "@/features/archive/StylePreviewCard";

/**
 * 스튜디오 → 스타일 불러오기 시트.
 *
 * 보관함의 "스타일 보관소" 두 탭(저장한 스타일 / 내가 만든 스타일) 을 그대로
 * 가져와서 한 장씩 미리보고 "이 스타일 사용하기" 로 스튜디오 캔버스에 적용.
 *
 * 미리보기는 보관함과 동일한 StylePreviewCard 를 사용해서 "미리보기 = 적용 결과"
 * 가 시각적으로 일치하도록 한다.
 *
 * 적용 후에는 스튜디오의 기존 텍스트 편집 기능(EditableText)으로 자유롭게
 * 수정 가능 — 즉, 스타일은 텍스트/스티커 레이아웃 "초기값" 을 채워주는 역할.
 */
export default function StylePicker() {
  const open = useAppStore((s) => s.studioStylePickerOpen);
  const setOpen = useAppStore((s) => s.setStudioStylePickerOpen);
  const applyStyle = useAppStore((s) => s.applyStudioStyle);
  const showToast = useAppStore((s) => s.showToast);
  const removedIds = useAppStore((s) => s.removedSavedStyleIds);
  const userSavedStyles = useAppStore((s) => s.userSavedStyles);

  // 시트 안에서만 사용하는 sub-tab — 보관함의 styleSubTab 와는 분리해서
  // 스튜디오에서 픽커를 열 때마다 "저장한 스타일" 로 시작하도록 한다.
  const [sub, setSub] = useState<"saved" | "mine">("saved");

  // 보관함의 "저장한 스타일" 탭 로직을 그대로 재현:
  // 사용자 저장본 + 기본 샘플을 dedupe + 삭제된 id 제외.
  const savedCards = useMemo<StyleCard[]>(() => {
    const base = styleCards.saved || [];
    const seen = new Set<string>();
    const merged: StyleCard[] = [];
    for (const c of [...userSavedStyles, ...base]) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      merged.push(c);
    }
    return merged.filter((c) => !removedIds.includes(c.id));
  }, [userSavedStyles, removedIds]);

  const mineCards = useMemo<StyleCard[]>(() => styleCards.mine || [], []);

  const cards = sub === "saved" ? savedCards : mineCards;

  const [activeIdx, setActiveIdx] = useState(0);

  // 시트 열릴 때마다 첫 번째 카드로 reset + 기본 sub-tab 으로
  useEffect(() => {
    if (open) {
      setActiveIdx(0);
      setSub("saved");
    }
  }, [open]);

  // sub-tab 바뀔 때도 첫 카드로 리셋
  useEffect(() => {
    setActiveIdx(0);
  }, [sub]);

  // ESC 로 닫기
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const active = cards[activeIdx];

  const onUse = () => {
    if (!active) return;
    applyStyle(active);
    showToast(`${active.title} 스타일을 적용했어요`);
    setOpen(false);
  };

  return (
    <div className="record-picker-backdrop" onClick={() => setOpen(false)}>
      <div className="record-picker style-picker" onClick={(e) => e.stopPropagation()}>
        <div className="rp-handle" aria-hidden />
        <div className="rp-header">
          <span className="rp-title">스타일 보관소</span>
          <button
            className="rp-close"
            aria-label="닫기"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </div>

        {/* 저장한 / 내가 만든 sub-tab 토글 — 보관함의 StyleBody 와 동일한 분류 체계 */}
        <div className="sp-subtabs" role="tablist">
          <button
            role="tab"
            aria-selected={sub === "saved"}
            className={`sp-subtab${sub === "saved" ? " active" : ""}`}
            onClick={() => setSub("saved")}
          >
            저장한 스타일
          </button>
          <button
            role="tab"
            aria-selected={sub === "mine"}
            className={`sp-subtab${sub === "mine" ? " active" : ""}`}
            onClick={() => setSub("mine")}
          >
            내가 만든 스타일
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-mascot">
              <Mascot />
            </div>
            <div className="sp-empty-title">
              {sub === "saved" ? "저장한 스타일이 없어요" : "만든 스타일이 없어요"}
            </div>
            <div className="sp-empty-sub">
              {sub === "saved"
                ? "보관함의 스타일 보관소에서 마음에 드는 스타일을 저장해보세요"
                : "스튜디오에서 나만의 스타일을 만들어보세요"}
            </div>
          </div>
        ) : (
          <>
            {/* 가로 carousel — 한 장씩 보여줌. 화살표로 이전/다음 스타일 미리보기 */}
            <div className="sp-stage">
              <button
                className="sp-arrow sp-arrow-left"
                aria-label="이전"
                onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                disabled={activeIdx === 0}
              >
                ‹
              </button>
              <div className="sp-card-wrap">
                {active && <StylePreviewCard style={active} />}
              </div>
              <button
                className="sp-arrow sp-arrow-right"
                aria-label="다음"
                onClick={() =>
                  setActiveIdx((i) => Math.min(cards.length - 1, i + 1))
                }
                disabled={activeIdx >= cards.length - 1}
              >
                ›
              </button>
            </div>

            {/* dot indicator */}
            <div className="sp-dots" aria-hidden="true">
              {cards.map((_, i) => (
                <span
                  key={i}
                  className={`sp-dot${i === activeIdx ? " active" : ""}`}
                />
              ))}
            </div>

            <button className="sp-use-btn" onClick={onUse}>
              이 스타일 사용하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
