"use client";

import { useAppStore } from "@/stores/useAppStore";
import { styleCards } from "@/data/styleCards";
import type { StyleCard } from "@/types";

function StyleCardEl({ c }: { c: StyleCard }) {
  const showToast = useAppStore((s) => s.showToast);
  return (
    <div className="style-block">
      <div className="style-card">
        <div className="sc-bg" style={{ background: c.bg }} />
        <div className="sc-overlay" />
        <button
          className="sc-bookmark"
          aria-label="저장"
          onClick={(e) => {
            e.stopPropagation();
            showToast("저장됨");
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </button>
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
  const cards = styleCards[sub] || [];

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

      <div className="style-list">
        {cards.map((c) => (
          <StyleCardEl key={c.id} c={c} />
        ))}
      </div>
    </div>
  );
}
