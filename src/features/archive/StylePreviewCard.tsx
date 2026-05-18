"use client";

import type { StyleCard } from "@/types";

/**
 * 스타일 카드 미리보기.
 *
 * "스타일" 의 본질은 텍스트/스티커 레이아웃(template) 이므로, 보관함과
 * 스튜디오 픽커에서 보여줄 미리보기도 정확히 그 레이아웃을 그대로 보여줘야
 * "적용 결과 = 미리보기" 가 일치한다.
 *
 * 따라서 이 컴포넌트는:
 *  - 카드의 bg 를 배경으로 깔고
 *  - template.texts 를 (x%, y%) 좌표에 동일 폰트/사이즈/색상으로 렌더
 *  - template.stickers 를 (x%, y%) 좌표에 동일 크기로 렌더
 *  - (통계 그리드/거리 큰 숫자 등은 적용 시 반영되지 않으므로 미리보기에도 표시 X)
 *
 * 미리보기 박스 비율은 9/16(세로) — 스튜디오 카드 비율과 동일해서 좌표 시각이
 * 자연스럽게 매칭됨.
 *
 * size 옵션:
 *  - "list": 보관함의 카드 리스트용 — 가로 폭에 맞춰 자연스럽게 큼
 *  - "picker": 스튜디오 picker 안에서 — 작아도 또렷하게 보이도록 텍스트 사이즈
 *    스케일을 살짝 조정 (현재는 동일 비율 유지, 향후 필요 시 변경)
 */
export default function StylePreviewCard({
  style,
  showBookmark = false,
  onBookmarkClick,
}: {
  style: StyleCard;
  showBookmark?: boolean;
  onBookmarkClick?: (e: React.MouseEvent) => void;
}) {
  const tpl = style.template;
  return (
    <div className="spv-card">
      <div className="spv-bg" style={{ background: style.bg }} />
      <div className="spv-overlay" />
      {showBookmark && (
        <button
          className="spv-bookmark"
          aria-label="저장한 스타일에서 삭제"
          onClick={onBookmarkClick}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </button>
      )}
      {tpl?.texts.map((t, i) => (
        <div
          key={`t-${i}`}
          className="spv-text"
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            fontSize: `${t.size}px`,
            fontFamily: t.font,
            fontWeight: t.fontWeight,
            fontStyle: t.fontStyle,
            color: t.color,
          }}
        >
          {/* CSS 의 white-space: pre-wrap 이 \n 을 자동으로 줄바꿈으로 렌더. */}
          {t.text}
        </div>
      ))}
      {tpl?.stickers.map((s, i) =>
        s.emoji.startsWith("/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`s-${i}`}
            className="spv-sticker"
            src={s.emoji}
            alt=""
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            draggable={false}
          />
        ) : (
          <span
            key={`s-${i}`}
            className="spv-sticker spv-sticker-emoji"
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            {s.emoji}
          </span>
        ),
      )}
      {/* template 이 비어있는 (구버전) 카드를 위해 fallback — 미리보기 상에
          최소한 카드의 title 정도는 보여주기. 새 카드들은 모두 template 을
          갖고 있어 이 fallback 은 사용되지 않음. */}
      {!tpl && style.title && (
        <div className="spv-fallback-title">{style.title}</div>
      )}
    </div>
  );
}
