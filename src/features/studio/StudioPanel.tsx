"use client";

import { useAppStore } from "@/stores/useAppStore";

const STICKERS = ["🏃", "💜", "✨", "🔥", "🎯", "⚡", "🏆", "❤️", "🌟", "😊", "🎉", "💪"];

export default function StudioPanel({ tab }: { tab: "edit" | "text" | "sticker" | "design" }) {
  const showToast = useAppStore((s) => s.showToast);
  const t = (msg: string) => () => showToast(msg);

  if (tab === "edit") {
    return (
      <>
        <div className="sp-head">
          <span>편집</span>
          <button className="sp-close" aria-label="닫기">
            ×
          </button>
        </div>
        <div className="sp-tools">
          <button className="sp-tool" onClick={t("잘라내기")}>
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                <path d="M2 6h14a2 2 0 0 1 2 2v14" />
              </svg>
            </span>
            <i>잘라내기</i>
          </button>
          <button className="sp-tool" onClick={t("회전")}>
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </span>
            <i>회전</i>
          </button>
          <button className="sp-tool" onClick={t("좌우 반전")}>
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v18" />
                <path d="M3 8l4-3 4 3v8l-4 3-4-3z" />
                <path d="M21 8l-4-3-4 3v8l4 3 4-3z" strokeDasharray="3 2" />
              </svg>
            </span>
            <i>좌우 반전</i>
          </button>
          <button className="sp-tool" onClick={t("상하 반전")}>
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 12h18" />
                <path d="M8 3l-3 4 3 4h8l3-4-3-4z" />
                <path d="M8 21l-3-4 3-4h8l3 4-3 4z" strokeDasharray="3 2" />
              </svg>
            </span>
            <i>상하 반전</i>
          </button>
          <button className="sp-tool" onClick={t("색상 수정")}>
            <span className="sp-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3a9 9 0 0 1 0 18 4 4 0 0 0 0-8 4 4 0 0 1 0-8z" fill="currentColor" opacity="0.3" />
              </svg>
            </span>
            <i>색을 수정</i>
          </button>
        </div>
      </>
    );
  }

  if (tab === "text") {
    return (
      <div className="sp-tools sp-text">
        <button className="sp-tool" onClick={t("글꼴")}>
          <span className="sp-ic">
            <b style={{ fontSize: 18, fontFamily: "serif" }}>Aa</b>
          </span>
          <i>글꼴</i>
        </button>
        <button className="sp-tool" onClick={t("글자크기")}>
          <span className="sp-ic">
            <b style={{ fontSize: 18 }}>Tr</b>
          </span>
          <i>글자크기</i>
        </button>
        <button className="sp-tool" onClick={t("색상")}>
          <span className="sp-ic">
            <span className="color-wheel" />
          </span>
          <i>색상</i>
        </button>
      </div>
    );
  }

  if (tab === "sticker") {
    return (
      <div className="sp-stickers">
        {STICKERS.map((s) => (
          <button key={s} className="sp-sticker" onClick={t(`${s} 추가됨`)}>
            {s}
          </button>
        ))}
      </div>
    );
  }

  if (tab === "design") {
    return (
      <div className="sp-tools sp-design">
        <button className="sp-tool" onClick={t("테마컬러")}>
          <span className="sp-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M3 17l5-5 4 4 4-4 5 5" />
            </svg>
          </span>
          <i>테마컬러</i>
        </button>
        <button className="sp-tool" onClick={t("스타일")}>
          <span className="sp-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3l9 9-9 9-9-9z" />
            </svg>
          </span>
          <i>스타일</i>
        </button>
        <a href="/studio/background" className="sp-tool" style={{ textDecoration: "none" }}>
          <span className="sp-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 14l4-3 4 3 4-4 6 5" />
            </svg>
          </span>
          <i>배경</i>
        </a>
      </div>
    );
  }

  return null;
}
