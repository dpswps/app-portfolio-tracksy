"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { styleCards } from "@/data/styleCards";
import type { StyleCard } from "@/types";
import Mascot from "@/components/ui/Mascot";

/**
 * 스튜디오 → 스타일 불러오기 시트.
 *
 * 보관함의 "저장한 스타일" 탭에 노출되는 스타일 카드들을 그대로 가져와서
 * 한 장씩 미리보고 "이 스타일 사용하기" 로 스튜디오 캔버스에 적용한다.
 *
 * 적용 후에는 스튜디오의 기존 텍스트 편집 기능(EditableText)으로 자유롭게
 * 수정 가능 — 즉, 스타일은 "초기값"을 채워주는 역할.
 */
export default function StylePicker() {
  const open = useAppStore((s) => s.studioStylePickerOpen);
  const setOpen = useAppStore((s) => s.setStudioStylePickerOpen);
  const applyStyle = useAppStore((s) => s.applyStudioStyle);
  const showToast = useAppStore((s) => s.showToast);
  const removedIds = useAppStore((s) => s.removedSavedStyleIds);
  const userSavedStyles = useAppStore((s) => s.userSavedStyles);

  // 보관함의 "저장한 스타일" 탭 로직을 그대로 재현:
  // 사용자 저장본 + 기본 샘플을 dedupe + 삭제된 id 제외.
  const cards = useMemo<StyleCard[]>(() => {
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

  const [activeIdx, setActiveIdx] = useState(0);

  // 시트 열릴 때마다 첫 번째 카드로 reset
  useEffect(() => {
    if (open) setActiveIdx(0);
  }, [open]);

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

        {cards.length === 0 ? (
          <div className="sp-empty">
            <div className="sp-empty-mascot">
              <Mascot />
            </div>
            <div className="sp-empty-title">저장한 스타일이 없어요</div>
            <div className="sp-empty-sub">
              보관함의 스타일 보관소에서 마음에 드는 스타일을 저장해보세요
            </div>
          </div>
        ) : (
          <>
            {/* 가로 스크롤 carousel — 한 장씩 보여줌. 가로로 스와이프해서 다음 스타일 미리보기 */}
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
                {active && (
                  <div className="style-card sp-card">
                    <div className="sc-bg" style={{ background: active.bg }} />
                    <div className="sc-overlay" />
                    <div className="sc-content">
                      <div className="sc-meta">{active.date}</div>
                      <div className="sc-title">{active.title}</div>
                      <div
                        className="sc-dist"
                        style={{ color: active.distColor || "#fff" }}
                      >
                        {active.dist}
                      </div>
                      <div
                        className="sc-dist-unit"
                        style={{ color: active.distColor || "#fff" }}
                      >
                        킬로미터
                      </div>
                      <div className="sc-stats">
                        <div className="sc-stat-row">
                          {active.stats.slice(0, 3).map((s, i) => (
                            <div key={i} className="sc-stat">
                              <b>{s.v}</b>
                              <i>{s.l}</i>
                            </div>
                          ))}
                        </div>
                        <div className="sc-stat-row">
                          {active.stats.slice(3, 6).map((s, i) => (
                            <div key={i} className="sc-stat">
                              <b>{s.v}</b>
                              <i>{s.l}</i>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
