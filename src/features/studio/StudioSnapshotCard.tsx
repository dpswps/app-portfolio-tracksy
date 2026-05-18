"use client";

import type { StudioCardSnapshot } from "@/types";

/**
 * 갤러리 보관소에 저장된 스튜디오 카드 스냅샷을 렌더링.
 *
 * RunningCard 와 동일한 클래스명/구조를 사용해서 같은 CSS 가 적용되도록 하지만,
 * 인터랙티브(편집/드래그)는 모두 제거된 정적 렌더링.
 *
 * 갤러리 디테일/그리드 등에서 "편집한 모습 그대로" 다시 보여줘야 할 때 사용.
 */

type Props = {
  snapshot: StudioCardSnapshot;
  /** 작은 미리보기(small) 변형. 갤러리 카드 그리드 같은 곳에서 사용. */
  small?: boolean;
};

function renderLayoutStatic(snap: StudioCardSnapshot, small: boolean) {
  const c = snap.cardData;
  const colors = snap.cardTextColors;
  void small;

  const cWeek = colors.weekTitle;
  const cDist = colors.distance;
  const cTime = colors.time;
  const cPace = colors.pace;
  const cCal = colors.calories;
  const cDate = colors.weekTitle;
  const dateLabel = "2026.04.30";

  switch (snap.layoutId) {
    case "layout-1":
      return (
        <div className="rc-lay rc-lay-1">
          <div className="rc-lay-big" style={cDist ? { color: cDist } : undefined}>
            {c.distance}
            <small>km</small>
          </div>
        </div>
      );
    case "layout-2":
      return (
        <div className="rc-lay rc-lay-2">
          <div className="rc-lay-big" style={cTime ? { color: cTime } : undefined}>
            {c.time}
          </div>
        </div>
      );
    case "layout-3":
      return (
        <div className="rc-lay rc-lay-3">
          <div className="rc-lay-date" style={cDate ? { color: cDate } : undefined}>
            {dateLabel}
          </div>
          <div className="rc-lay-mid" style={cDist ? { color: cDist } : undefined}>
            {c.distance}
            <small>km</small>
          </div>
        </div>
      );
    case "layout-4":
      return (
        <div className="rc-lay rc-lay-4">
          <div className="rc-lay-row">
            <span className="rc-lay-mid" style={cTime ? { color: cTime } : undefined}>
              {c.time}
            </span>
            <span className="rc-lay-sep">/</span>
            <span className="rc-lay-mid" style={cDist ? { color: cDist } : undefined}>
              {c.distance}
              <small>km</small>
            </span>
          </div>
        </div>
      );
    case "layout-5":
      return (
        <div className="rc-lay rc-lay-5">
          <div className="rc-lay-mid" style={cDist ? { color: cDist } : undefined}>
            {c.distance}
            <small>km</small>
          </div>
          <div className="rc-lay-sub" style={cPace ? { color: cPace } : undefined}>
            ⚡ {c.pace}
            <span className="rc-lay-unit"> /km</span>
          </div>
        </div>
      );
    case "layout-6":
      return (
        <div className="rc-lay rc-lay-6">
          <div className="rc-lay-icons">
            <span>🏃</span>
            <span>❤️</span>
            <span>⚡</span>
          </div>
        </div>
      );
    case "layout-7":
      return (
        <div className="rc-lay rc-lay-7">
          <div className="rc-lay-line" style={cTime ? { color: cTime } : undefined}>
            <span className="rc-lay-ic">⏱</span>
            {c.time}
            <i className="rc-lay-i">운동 시간</i>
          </div>
          <div className="rc-lay-line" style={cDist ? { color: cDist } : undefined}>
            <span className="rc-lay-ic">📏</span>
            {c.distance}
            <i className="rc-lay-i">km</i>
          </div>
          <div className="rc-lay-line" style={cPace ? { color: cPace } : undefined}>
            <span className="rc-lay-ic">⚡</span>
            {c.pace}
            <i className="rc-lay-i">평균 페이스</i>
          </div>
        </div>
      );
    case "layout-8":
      return (
        <div className="rc-lay rc-lay-8">
          <div className="rc-lay-date" style={cDate ? { color: cDate } : undefined}>
            {dateLabel}
          </div>
          <div className="rc-lay-line" style={cTime ? { color: cTime } : undefined}>
            <span className="rc-lay-ic">⏱</span>
            {c.time}
            <i className="rc-lay-i">운동 시간</i>
          </div>
          <div className="rc-lay-line" style={cDist ? { color: cDist } : undefined}>
            <span className="rc-lay-ic">📏</span>
            {c.distance}
            <i className="rc-lay-i">km</i>
          </div>
          <div className="rc-lay-line" style={cPace ? { color: cPace } : undefined}>
            <span className="rc-lay-ic">⚡</span>
            {c.pace}
            <i className="rc-lay-i">평균 페이스</i>
          </div>
          <div className="rc-lay-line" style={cCal ? { color: cCal } : undefined}>
            <span className="rc-lay-ic">🔥</span>
            {c.calories}
            <i className="rc-lay-i">kcal</i>
          </div>
        </div>
      );
    default:
      // default 레이아웃 — 풀 컴포지션 (week + distance + 3 stats)
      return (
        <>
          <div className="rc-week" style={cWeek ? { color: cWeek } : undefined}>
            <span>{c.weekTitle}</span> <span>🏃</span>
          </div>
          <div className="rc-distance" style={cDist ? { color: cDist } : undefined}>
            {c.distance}
            <small>km</small>
          </div>
          <div className="rc-stats">
            <div className="rc-stat" style={cTime ? { color: cTime } : undefined}>
              <span className="rc-ic">⏱</span>
              <b>{c.time}</b>
              <i>운동 시간</i>
            </div>
            <div className="rc-stat" style={cPace ? { color: cPace } : undefined}>
              <span className="rc-ic">⚡</span>
              <b>{c.pace}</b>
              <i>평균 페이스</i>
            </div>
            <div className="rc-stat" style={cCal ? { color: cCal } : undefined}>
              <span className="rc-ic">🔥</span>
              <b>{c.calories}</b>
              <i>kcal</i>
            </div>
          </div>
        </>
      );
  }
}

export default function StudioSnapshotCard({ snapshot, small = false }: Props) {
  const transforms: string[] = [];
  if (snapshot.rotate) transforms.push(`rotate(${snapshot.rotate}deg)`);
  if (snapshot.flipH) transforms.push("scaleX(-1)");
  if (snapshot.flipV) transforms.push("scaleY(-1)");
  if (snapshot.crop && snapshot.crop !== 1) transforms.push(`scale(${snapshot.crop})`);
  const transform = transforms.length > 0 ? transforms.join(" ") : undefined;

  const photoStyle = snapshot.bg
    ? {
        backgroundImage: `url("${snapshot.bg}")`,
        backgroundSize: "cover" as const,
        backgroundPosition: "center" as const,
        transform,
        transformOrigin: "center" as const,
      }
    : transform
    ? { transform, transformOrigin: "center" as const }
    : undefined;

  const cardOpacity = snapshot.layerOpacities["card"] != null
    ? snapshot.layerOpacities["card"] / 100
    : 1;
  const bgOpacityVal = snapshot.layerOpacities["bg"] != null
    ? snapshot.layerOpacities["bg"] / 100
    : 1;
  const photoStyleWithOpacity = photoStyle
    ? { ...photoStyle, opacity: bgOpacityVal }
    : bgOpacityVal !== 1
    ? { opacity: bgOpacityVal }
    : undefined;

  const bgHidden = !!snapshot.hiddenLayers["bg"];
  const cardHidden = !!snapshot.hiddenLayers["card"];

  return (
    <div className={`running-card${small ? " small" : ""} layout-${snapshot.layoutId || "default"}`}>
      {!bgHidden && <div className="rc-photo" style={photoStyleWithOpacity} />}
      {!bgHidden && <div className="rc-grad" />}
      {snapshot.themeOverlay && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={snapshot.themeOverlay} alt="" className="rc-theme-overlay" />
      )}

      {!cardHidden && (
        <div
          className="rc-stats-group"
          style={{
            transform: small
              ? undefined
              : `translate(${snapshot.statsOffset.x}px, ${snapshot.statsOffset.y}px)`,
            opacity: cardOpacity,
            // card 레이어가 layerOrder 에 포함돼 있으면 그 위치로 z-index 적용
            // (텍스트/스티커와 같은 reorder 그룹에 통합). 없으면 CSS 기본값(2) 사용.
            ...(small || !snapshot.layerOrder.includes("card")
              ? {}
              : { zIndex: snapshot.layerOrder.indexOf("card") + 1 }),
          }}
        >
          {renderLayoutStatic(snapshot, small)}
        </div>
      )}

      {/* 사용자가 추가한 텍스트 오버레이 — 위치/색상/폰트까지 동일 */}
      <div className="text-overlay" style={{ pointerEvents: "none" }}>
        {snapshot.texts
          .filter((t) => !snapshot.hiddenLayers[`text-${t.id}`])
          .map((t) => {
            const op = snapshot.layerOpacities[`text-${t.id}`];
            const opacity = op != null ? op / 100 : 1;
            const zIdx = snapshot.layerOrder.indexOf(`text-${t.id}`);
            const zIndex = zIdx >= 0 ? zIdx + 1 : undefined;
            return (
              <div
                key={t.id}
                className="stx"
                style={{
                  left: `${t.x}%`,
                  top: `${t.y}%`,
                  transform: "translate(-50%, -50%)",
                  fontFamily: t.font,
                  fontWeight: t.fontWeight ?? 500,
                  fontStyle: t.fontStyle ?? "normal",
                  fontSize: `${t.size}px`,
                  color: t.color,
                  opacity,
                  zIndex,
                  pointerEvents: "none",
                }}
              >
                <div className="stx-edit">{t.text}</div>
              </div>
            );
          })}
      </div>

      {/* 사용자가 배치한 스티커 — 위치/이미지 동일 */}
      <div className="placed-stickers">
        {snapshot.stickers
          .filter((p) => !snapshot.hiddenLayers[`sticker-${p.id}`])
          .map((p) => {
            const op = snapshot.layerOpacities[`sticker-${p.id}`];
            const opacity = op != null ? op / 100 : 1;
            const zIdx = snapshot.layerOrder.indexOf(`sticker-${p.id}`);
            const zIndex = zIdx >= 0 ? zIdx + 1 : undefined;
            return (
              <button
                key={p.id}
                type="button"
                className="placed-sticker"
                disabled
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  opacity,
                  zIndex,
                  pointerEvents: "none",
                  cursor: "default",
                }}
              >
                {p.emoji.startsWith("/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.emoji}
                    alt=""
                    draggable={false}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                ) : (
                  p.emoji
                )}
              </button>
            );
          })}
      </div>

      {/* 말풍선 + 마스코트 — bubble 텍스트가 있을 때만 */}
      {!cardHidden && snapshot.cardData.bubble.trim() !== "" && (
        <div
          className={`rc-bubble-wrap${snapshot.bubblePos ? " positioned" : ""}`}
          style={
            !small && snapshot.bubblePos
              ? {
                  left: `${snapshot.bubblePos.x}%`,
                  top: `${snapshot.bubblePos.y}%`,
                  right: "auto",
                  bottom: "auto",
                }
              : undefined
          }
        >
          <div
            className="rc-bubble"
            style={
              snapshot.cardTextColors.bubble
                ? { color: snapshot.cardTextColors.bubble }
                : undefined
            }
          >
            <div>{snapshot.cardData.bubble}</div>
          </div>
          <div className="rc-mascot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/main-character.png" alt="" draggable={false} />
          </div>
        </div>
      )}
    </div>
  );
}
