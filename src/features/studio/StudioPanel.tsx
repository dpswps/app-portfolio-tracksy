"use client";

import { useAppStore } from "@/stores/useAppStore";

const STICKERS = ["🏃", "💜", "✨", "🔥", "🎯", "⚡", "🏆", "❤️", "🌟", "😊", "🎉", "💪"];

function StickerGrid() {
  const addSticker = useAppStore((s) => s.addSticker);
  const showToast = useAppStore((s) => s.showToast);
  return (
    <div className="sp-stickers">
      {STICKERS.map((s) => (
        <button
          key={s}
          className="sp-sticker"
          onClick={() => {
            addSticker(s);
            showToast(`${s} 추가됨`);
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function TextTab() {
  const texts = useAppStore((s) => s.studioTexts);
  const activeId = useAppStore((s) => s.studioActiveTextId);
  const submenu = useAppStore((s) => s.studioTextSubmenu);
  const setSubmenu = useAppStore((s) => s.setStudioTextSubmenu);
  const addText = useAppStore((s) => s.addStudioText);
  const showToast = useAppStore((s) => s.showToast);

  const hasActive = texts.some((t) => t.id === activeId);
  const toggle = (m: "font" | "size" | "color") => {
    if (!hasActive) {
      showToast("먼저 텍스트를 추가해주세요");
      return;
    }
    setSubmenu(submenu === m ? "none" : m);
  };

  return (
    <div className="sp-tools sp-text">
      <button className="sp-tool" onClick={() => addText()}>
        <span className="sp-ic">
          <b style={{ fontSize: 18 }}>＋</b>
        </span>
        <i>추가</i>
      </button>
      <button
        className={`sp-tool${submenu === "font" ? " active" : ""}`}
        onClick={() => toggle("font")}
      >
        <span className="sp-ic">
          <b style={{ fontSize: 18, fontFamily: "serif" }}>Aa</b>
        </span>
        <i>글꼴</i>
      </button>
      <button
        className={`sp-tool${submenu === "size" ? " active" : ""}`}
        onClick={() => toggle("size")}
      >
        <span className="sp-ic">
          <b style={{ fontSize: 18 }}>Tr</b>
        </span>
        <i>글자크기</i>
      </button>
      <button
        className={`sp-tool${submenu === "color" ? " active" : ""}`}
        onClick={() => toggle("color")}
      >
        <span className="sp-ic">
          <span className="color-wheel" />
        </span>
        <i>색상</i>
      </button>
    </div>
  );
}

export default function StudioPanel({ tab }: { tab: "edit" | "text" | "sticker" | "design" }) {
  const showToast = useAppStore((s) => s.showToast);
  const rotateBackground = useAppStore((s) => s.rotateBackground);
  const toggleFlipH = useAppStore((s) => s.toggleFlipH);
  const toggleFlipV = useAppStore((s) => s.toggleFlipV);
  const setCropMode = useAppStore((s) => s.setStudioCropMode);
  const bg = useAppStore((s) => s.studioBackground);
  const cycleRatio = useAppStore((s) => s.cycleRatio);
  const ratio = useAppStore((s) => s.studioRatio);

  const ratioLabel = (r: string) => r.replace("/", ":");

  if (tab === "edit") {
    return (
      <>
        <div className="sp-head">
          <span>편집</span>
        </div>
        <div className="sp-tools">
          <button
            className="sp-tool"
            onClick={() => {
              if (!bg) {
                showToast("먼저 배경 사진을 등록해주세요");
                return;
              }
              setCropMode(true);
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                <path d="M2 6h14a2 2 0 0 1 2 2v14" />
              </svg>
            </span>
            <i>잘라내기</i>
          </button>
          <button
            className="sp-tool"
            onClick={() => {
              rotateBackground();
              showToast("회전");
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </span>
            <i>회전</i>
          </button>
          <button
            className="sp-tool"
            onClick={() => {
              toggleFlipH();
              showToast("좌우 반전");
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v18" />
                <path d="M3 8l4-3 4 3v8l-4 3-4-3z" />
                <path d="M21 8l-4-3-4 3v8l4 3 4-3z" strokeDasharray="3 2" />
              </svg>
            </span>
            <i>좌우 반전</i>
          </button>
          <button
            className="sp-tool"
            onClick={() => {
              toggleFlipV();
              showToast("상하 반전");
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 12h18" />
                <path d="M8 3l-3 4 3 4h8l3-4-3-4z" />
                <path d="M8 21l-3-4 3-4h8l3 4-3 4z" strokeDasharray="3 2" />
              </svg>
            </span>
            <i>상하 반전</i>
          </button>
          <button
            className="sp-tool"
            onClick={() => {
              cycleRatio();
              setTimeout(() => {
                const nextRatio = useAppStore.getState().studioRatio;
                showToast(`비율 ${ratioLabel(nextRatio)}`);
              }, 0);
            }}
          >
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 10h18" />
                <path d="M8 5v14" />
              </svg>
            </span>
            <i>비율 수정{ratio !== "9/16" ? ` (${ratioLabel(ratio)})` : ""}</i>
          </button>
        </div>
      </>
    );
  }

  if (tab === "text") {
    return <TextTab />;
  }

  if (tab === "sticker") {
    return <StickerGrid />;
  }

  if (tab === "design") {
    return <DesignTab />;
  }

  return null;
}

function DesignTab() {
  const submenu = useAppStore((s) => s.studioDesignSubmenu);
  const setSubmenu = useAppStore((s) => s.setStudioDesignSubmenu);
  const showToast = useAppStore((s) => s.showToast);
  const toggle = (m: "theme" | "style") => {
    setSubmenu(submenu === m ? "none" : m);
  };
  return (
    <div className="sp-tools sp-design">
      <button
        className={`sp-tool${submenu === "theme" ? " active" : ""}`}
        onClick={() => toggle("theme")}
      >
        <span className="sp-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M3 17l5-5 4 4 4-4 5 5" />
          </svg>
        </span>
        <i>테마</i>
      </button>
      <button
        className={`sp-tool${submenu === "style" ? " active" : ""}`}
        onClick={() => {
          toggle("style");
          if (submenu !== "style") showToast("스타일");
        }}
      >
        <span className="sp-ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3l9 9-9 9-9-9z" />
          </svg>
        </span>
        <i>스타일</i>
      </button>
    </div>
  );
}
