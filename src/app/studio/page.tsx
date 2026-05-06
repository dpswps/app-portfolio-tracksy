"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import RunningCard from "@/features/studio/RunningCard";
import StudioPanel from "@/features/studio/StudioPanel";
import { useAppStore } from "@/stores/useAppStore";

export default function StudioPage() {
  const router = useRouter();
  const tab = useAppStore((s) => s.studioTab);
  const setTab = useAppStore((s) => s.setStudioTab);
  const panelOpen = useAppStore((s) => s.studioPanelOpen);
  const setPanelOpen = useAppStore((s) => s.setStudioPanelOpen);
  const placedStickers = useAppStore((s) => s.placedStickers);
  const removeSticker = useAppStore((s) => s.removeSticker);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  };

  return (
    <section className="studio-screen">
      <div className="studio-toolbar">
        <button className="st-icon" onClick={back} aria-label="뒤로">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button className="st-icon" aria-label="실행취소">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-4" />
          </svg>
        </button>
        <button className="st-icon" aria-label="다시실행">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14l5-5-5-5" />
            <path d="M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h4" />
          </svg>
        </button>
        <button className="st-icon" aria-label="레이어">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
            <polyline points="2 15.5 12 22 22 15.5" />
          </svg>
        </button>
        <span style={{ flex: 1 }} />
        <Link href="/studio/export" className="st-export" style={{ textDecoration: "none" }}>
          내보내기
        </Link>
      </div>

      <div className="studio-canvas">
        <div className="studio-card-wrap">
          <RunningCard />
          <div className="placed-stickers">
            {placedStickers.map((p) => (
              <button
                key={p.id}
                className="placed-sticker"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                onClick={() => removeSticker(p.id)}
                aria-label={`${p.emoji} 제거`}
                title="클릭하여 제거"
              >
                {p.emoji}
              </button>
            ))}
          </div>
        </div>
        <button className="st-fab" aria-label="스티커 추가" onClick={() => setTab("sticker")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <circle cx="9" cy="10" r="0.8" fill="currentColor" />
            <circle cx="15" cy="10" r="0.8" fill="currentColor" />
            <path d="M8.5 14.5c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" />
          </svg>
        </button>
      </div>

      {panelOpen && (
        <div className="studio-panel">
          <StudioPanel tab={tab} onClose={() => setPanelOpen(false)} />
        </div>
      )}

      <div className="studio-tabs">
        <button className={`st-tab${tab === "edit" ? " active" : ""}`} onClick={() => setTab("edit")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2v16a2 2 0 0 0 2 2h14" />
            <path d="M2 6h16a2 2 0 0 1 2 2v14" />
          </svg>
          <span>편집</span>
        </button>
        <button className={`st-tab${tab === "text" ? " active" : ""}`} onClick={() => setTab("text")}>
          <span className="tab-tr">Tr</span>
          <span>텍스트</span>
        </button>
        <button className={`st-tab${tab === "sticker" ? " active" : ""}`} onClick={() => setTab("sticker")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <circle cx="9" cy="10" r="0.9" fill="currentColor" />
            <circle cx="15" cy="10" r="0.9" fill="currentColor" />
            <path d="M8 14c1.2 1.5 2.5 2.2 4 2.2s2.8-.7 4-2.2" />
          </svg>
          <span>스티커</span>
        </button>
        <button className={`st-tab${tab === "design" ? " active" : ""}`} onClick={() => setTab("design")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3a9 9 0 0 0 0 18c1.7 0 3-1.3 3-3a2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 9 9 0 0 0-9-9z" />
            <circle cx="7.5" cy="11" r="1.2" fill="currentColor" />
            <circle cx="11" cy="7" r="1.2" fill="currentColor" />
            <circle cx="16" cy="8" r="1.2" fill="currentColor" />
            <circle cx="18" cy="13" r="1.2" fill="currentColor" />
          </svg>
          <span>디자인</span>
        </button>
      </div>
    </section>
  );
}
