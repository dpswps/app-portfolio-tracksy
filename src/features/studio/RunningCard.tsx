"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

/* ──────────────────────────────────────────────────────────
 * 레이아웃별 stats-group 렌더링.
 *
 * layoutId 가 layout-1 ~ layout-8 이면 각자의 JSX 템플릿을,
 * 그 외(default 또는 미지정)는 기존 전체 풀 레이아웃을 보여준다.
 *
 * 모든 텍스트 값은 store 의 studioCardData 에서 가져오므로
 * 실제 러닝 데이터가 그대로 사용된다. EditableText 로 인라인 편집도 가능.
 * ────────────────────────────────────────────────────────── */
type CardData = {
  weekTitle: string;
  distance: string;
  time: string;
  pace: string;
  calories: string;
  bubble: string;
};

function renderLayoutContent({
  layoutId,
  small,
  cardLocked,
  card,
  setCard,
  colors,
}: {
  layoutId: string;
  small: boolean;
  cardLocked: boolean;
  card: CardData;
  setCard: (patch: Partial<CardData>) => void;
  /** studioCardTextColors — 필드별 색상 lookup. 없으면 기본 색. */
  colors: Record<string, string>;
}): React.ReactNode {
  // 각 필드의 색상을 lookup. 미설정이면 undefined → CSS 기본 사용.
  const cWeek = colors.weekTitle;
  const cDist = colors.distance;
  const cTime = colors.time;
  const cPace = colors.pace;
  const cCal = colors.calories;
  // 날짜 색상은 weekTitle 과 묶어서 함께 변경되도록 (요청한 "러닝 기록 텍스트" 범주에 묶임)
  const cDate = colors.weekTitle;
  // 임시 날짜 — 추후 selectedDate 와 연동 가능. 일단 자리표시자.
  const dateLabel = "2026.04.30";

  switch (layoutId) {
    /* layout-1: 거리만 큼지막하게 가운데 */
    case "layout-1":
      return (
        <div className="rc-lay rc-lay-1">
          <div className="rc-lay-big" style={cDist ? { color: cDist } : undefined}>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.distance}
              onChange={(v) => setCard({ distance: v })}
              field="distance"
              color={cDist}
            />
            <small>km</small>
          </div>
        </div>
      );

    /* layout-2: 운동 시간을 가운데에 크게 */
    case "layout-2":
      return (
        <div className="rc-lay rc-lay-2">
          <div className="rc-lay-big" style={cTime ? { color: cTime } : undefined}>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.time}
              onChange={(v) => setCard({ time: v })}
              field="time"
              color={cTime}
            />
          </div>
        </div>
      );

    /* layout-3: 날짜 위, 거리 아래 */
    case "layout-3":
      return (
        <div className="rc-lay rc-lay-3">
          <div className="rc-lay-date" style={cDate ? { color: cDate } : undefined}>
            {dateLabel}
          </div>
          <div className="rc-lay-mid" style={cDist ? { color: cDist } : undefined}>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.distance}
              onChange={(v) => setCard({ distance: v })}
              field="distance"
              color={cDist}
            />
            <small>km</small>
          </div>
        </div>
      );

    /* layout-4: 시간 / 거리 한 줄 */
    case "layout-4":
      return (
        <div className="rc-lay rc-lay-4">
          <div className="rc-lay-row">
            <span className="rc-lay-mid" style={cTime ? { color: cTime } : undefined}>
              <EditableText
                small={small}
                locked={cardLocked}
                value={card.time}
                onChange={(v) => setCard({ time: v })}
                field="time"
                color={cTime}
              />
            </span>
            <span className="rc-lay-sep">/</span>
            <span className="rc-lay-mid" style={cDist ? { color: cDist } : undefined}>
              <EditableText
                small={small}
                locked={cardLocked}
                value={card.distance}
                onChange={(v) => setCard({ distance: v })}
                field="distance"
                color={cDist}
              />
              <small>km</small>
            </span>
          </div>
        </div>
      );

    /* layout-5: 거리 + 페이스 */
    case "layout-5":
      return (
        <div className="rc-lay rc-lay-5">
          <div className="rc-lay-mid" style={cDist ? { color: cDist } : undefined}>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.distance}
              onChange={(v) => setCard({ distance: v })}
              field="distance"
              color={cDist}
            />
            <small>km</small>
          </div>
          <div className="rc-lay-sub" style={cPace ? { color: cPace } : undefined}>
            ⚡{" "}
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.pace}
              onChange={(v) => setCard({ pace: v })}
              field="pace"
              color={cPace}
            />
            <span className="rc-lay-unit"> /km</span>
          </div>
        </div>
      );

    /* layout-6: 아이콘만 하단 */
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

    /* layout-7: 시간 / 거리 / 페이스 세로 */
    case "layout-7":
      return (
        <div className="rc-lay rc-lay-7">
          <div className="rc-lay-line" style={cTime ? { color: cTime } : undefined}>
            <span className="rc-lay-ic">⏱</span>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.time}
              onChange={(v) => setCard({ time: v })}
              field="time"
              color={cTime}
            />
            <i className="rc-lay-i">운동 시간</i>
          </div>
          <div className="rc-lay-line" style={cDist ? { color: cDist } : undefined}>
            <span className="rc-lay-ic">📏</span>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.distance}
              onChange={(v) => setCard({ distance: v })}
              field="distance"
              color={cDist}
            />
            <i className="rc-lay-i">km</i>
          </div>
          <div className="rc-lay-line" style={cPace ? { color: cPace } : undefined}>
            <span className="rc-lay-ic">⚡</span>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.pace}
              onChange={(v) => setCard({ pace: v })}
              field="pace"
              color={cPace}
            />
            <i className="rc-lay-i">평균 페이스</i>
          </div>
        </div>
      );

    /* layout-8: 시간 / 거리 / 페이스 / 칼로리 풀 세로 */
    case "layout-8":
      return (
        <div className="rc-lay rc-lay-8">
          <div className="rc-lay-date" style={cDate ? { color: cDate } : undefined}>
            {dateLabel}
          </div>
          <div className="rc-lay-line" style={cTime ? { color: cTime } : undefined}>
            <span className="rc-lay-ic">⏱</span>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.time}
              onChange={(v) => setCard({ time: v })}
              field="time"
              color={cTime}
            />
            <i className="rc-lay-i">운동 시간</i>
          </div>
          <div className="rc-lay-line" style={cDist ? { color: cDist } : undefined}>
            <span className="rc-lay-ic">📏</span>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.distance}
              onChange={(v) => setCard({ distance: v })}
              field="distance"
              color={cDist}
            />
            <i className="rc-lay-i">km</i>
          </div>
          <div className="rc-lay-line" style={cPace ? { color: cPace } : undefined}>
            <span className="rc-lay-ic">⚡</span>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.pace}
              onChange={(v) => setCard({ pace: v })}
              field="pace"
              color={cPace}
            />
            <i className="rc-lay-i">평균 페이스</i>
          </div>
          <div className="rc-lay-line" style={cCal ? { color: cCal } : undefined}>
            <span className="rc-lay-ic">🔥</span>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.calories}
              onChange={(v) => setCard({ calories: v })}
              field="calories"
              color={cCal}
            />
            <i className="rc-lay-i">kcal</i>
          </div>
        </div>
      );

    /* 기본(default) — 기존 풀 레이아웃 (주제목 + 거리 + 통계 3개) */
    default:
      return (
        <>
          <div className="rc-week" style={cWeek ? { color: cWeek } : undefined}>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.weekTitle}
              onChange={(v) => setCard({ weekTitle: v })}
              field="weekTitle"
              color={cWeek}
            />{" "}
            <span>🏃</span>
          </div>
          <div className="rc-distance" style={cDist ? { color: cDist } : undefined}>
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.distance}
              onChange={(v) => setCard({ distance: v })}
              field="distance"
              color={cDist}
            />
            <small>km</small>
          </div>
          <div className="rc-stats">
            <div className="rc-stat" style={cTime ? { color: cTime } : undefined}>
              <span className="rc-ic">⏱</span>
              <b>
                <EditableText
                  small={small}
                  locked={cardLocked}
                  value={card.time}
                  onChange={(v) => setCard({ time: v })}
                  field="time"
                  color={cTime}
                />
              </b>
              <i>운동 시간</i>
            </div>
            <div className="rc-stat" style={cPace ? { color: cPace } : undefined}>
              <span className="rc-ic">⚡</span>
              <b>
                <EditableText
                  small={small}
                  locked={cardLocked}
                  value={card.pace}
                  onChange={(v) => setCard({ pace: v })}
                  field="pace"
                  color={cPace}
                />
              </b>
              <i>평균 페이스</i>
            </div>
            <div className="rc-stat" style={cCal ? { color: cCal } : undefined}>
              <span className="rc-ic">🔥</span>
              <b>
                <EditableText
                  small={small}
                  locked={cardLocked}
                  value={card.calories}
                  onChange={(v) => setCard({ calories: v })}
                  field="calories"
                  color={cCal}
                />
              </b>
              <i>kcal</i>
            </div>
          </div>
        </>
      );
  }
}

function EditableText({
  value,
  onChange,
  className,
  multiline = false,
  small,
  locked = false,
  field,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
  small?: boolean;
  locked?: boolean;
  /** 카드 빌트인 필드 이름. 설정하면 클릭/포커스 시 그 필드가 active 가 되어
   *  텍스트 탭의 색상 picker 가 이 필드의 색을 바꿀 수 있다. */
  field?: string;
  /** 이 텍스트의 색상 (studioCardTextColors[field] 에서 옴). 미설정 시 inherit. */
  color?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const editedRef = useRef(false);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const setActiveField = useAppStore((s) => s.setStudioActiveCardField);
  const activeField = useAppStore((s) => s.studioActiveCardField);
  const setStudioTab = useAppStore((s) => s.setStudioTab);
  const Tag = (multiline ? "div" : "span") as "div" | "span";
  const isActiveField = field != null && activeField === field;

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  if (small || locked) {
    // Read-only render: still shows the value but no contentEditable.
    return (
      <Tag className={className} style={color ? { color } : undefined}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLSpanElement & HTMLDivElement>}
      className={`${className ?? ""}${isActiveField ? " card-text-active" : ""}`}
      style={color ? { color } : undefined}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onPointerDown={() => {
        // 카드 필드를 누르면 그 필드를 활성화 — 텍스트 탭의 색상 picker가 이 필드에 적용됨.
        // 텍스트 탭으로 자동 전환해서 사용자가 바로 색상/폰트 등 옵션에 접근 가능.
        if (field) {
          setActiveField(field);
          setStudioTab("text");
        }
      }}
      onFocus={() => {
        if (field) {
          setActiveField(field);
          setStudioTab("text");
        }
      }}
      onInput={(e) => {
        if (!editedRef.current) {
          pushHistory();
          editedRef.current = true;
        }
        onChange((e.currentTarget as HTMLElement).innerText);
      }}
      onBlur={() => {
        editedRef.current = false;
      }}
    />
  );
}

export default function RunningCard({ small = false }: { small?: boolean }) {
  const bg = useAppStore((s) => s.studioBackground);
  const themeOverlay = useAppStore((s) => s.studioThemeOverlay);
  const layoutId = useAppStore((s) => s.studioLayoutId);
  const hidden = useAppStore((s) => s.studioHiddenLayers);
  const locked = useAppStore((s) => s.studioLockedLayers);
  const opacities = useAppStore((s) => s.studioLayerOpacities);
  const bgHidden = !small && !!hidden["bg"];
  const cardHidden = !small && !!hidden["card"];
  const cardLocked = !small && !!locked["card"];
  // 레이어 패널의 불투명도 (0~1). small preview에서는 항상 1.
  const bgOpacity = small ? 1 : (opacities["bg"] != null ? opacities["bg"] / 100 : 1);
  const cardOpacity = small ? 1 : (opacities["card"] != null ? opacities["card"] / 100 : 1);
  // Themes are SVG-data-URL gradients applied via the design tab; photos
  // are anything else (uploaded jpg/png as base64 data URL, or file URL).
  // (legacy) 과거 .rc-runner 노출 조건에 사용. 이제 캐릭터 자동 렌더 안 하므로 미사용.
  // 만약 다시 조건부로 캐릭터를 보여줘야 한다면 이 헬퍼를 다시 활용.
  // const isTheme = !!bg && bg.startsWith("data:image/svg+xml");
  const rotate = useAppStore((s) => s.studioRotate);
  const flipH = useAppStore((s) => s.studioFlipH);
  const flipV = useAppStore((s) => s.studioFlipV);
  const crop = useAppStore((s) => s.studioCrop);
  const ratio = useAppStore((s) => s.studioRatio);
  const card = useAppStore((s) => s.studioCardData);
  const setCard = useAppStore((s) => s.setStudioCardData);
  const cardTextColors = useAppStore((s) => s.studioCardTextColors);
  const bubblePos = useAppStore((s) => s.studioBubblePos);
  const setBubblePos = useAppStore((s) => s.setStudioBubblePos);
  const setDraggingContent = useAppStore((s) => s.setStudioDraggingContent);
  const setDraggingOverTrash = useAppStore((s) => s.setStudioDraggingOverTrash);

  /* ─────────────────────────────────────────────────
   * 말풍선+마스코트 묶음 드래그 — placedSticker 패턴과 동일.
   * pointerdown 시 draggingContent({kind:"bubble"}) 설정 → TrashZone 등장.
   * pointermove 시 위치 갱신 + trash hit-test.
   * pointerup 시 휴지통 위면 setCard({bubble:""})로 비움(=숨김).
   * ─────────────────────────────────────────────────── */
  const bubbleDragRef = useRef<{
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    captured: boolean;
    pushed: boolean;
  }>({
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startX: 0,
    startY: 0,
    captured: false,
    pushed: false,
  });
  const BUBBLE_DRAG_THRESHOLD = 4;
  const getTrashRect = (): DOMRect | null => {
    if (typeof document === "undefined") return null;
    const el = document.querySelector<HTMLElement>(".studio-trash-zone");
    return el ? el.getBoundingClientRect() : null;
  };
  const isOverTrash = (x: number, y: number): boolean => {
    const r = getTrashRect();
    if (!r) return false;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  const onBubblePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (small || cardLocked) return;
    // contentEditable 텍스트 클릭은 편집 모드여서 드래그 시작 안 함.
    const target = e.target as HTMLElement | null;
    if (target && target.closest("[contenteditable]")) return;
    e.stopPropagation();
    // 현재 위치 — 사용자 지정이 있으면 그것, 없으면 CSS 기본을 측정해서 사용
    const wrapEl = e.currentTarget;
    const cardEl = cardRef.current;
    let startX = bubblePos?.x ?? 0;
    let startY = bubblePos?.y ?? 0;
    if (!bubblePos && cardEl) {
      const wRect = wrapEl.getBoundingClientRect();
      const cRect = cardEl.getBoundingClientRect();
      // 좌상단 anchor 기준 — 카드 내부 % 좌표로 환산
      startX = ((wRect.left - cRect.left) / cRect.width) * 100;
      startY = ((wRect.top - cRect.top) / cRect.height) * 100;
    }
    bubbleDragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX,
      startY,
      captured: false,
      pushed: false,
    };
    try {
      wrapEl.setPointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    setDraggingContent({ kind: "bubble" });
  };
  const onBubblePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = bubbleDragRef.current;
    if (d.pointerId !== e.pointerId) return;
    const dxPx = e.clientX - d.startClientX;
    const dyPx = e.clientY - d.startClientY;
    if (
      !d.captured &&
      Math.abs(dxPx) < BUBBLE_DRAG_THRESHOLD &&
      Math.abs(dyPx) < BUBBLE_DRAG_THRESHOLD
    ) {
      return;
    }
    if (!d.captured) {
      d.captured = true;
      if (!d.pushed) {
        pushHistory();
        d.pushed = true;
      }
    }
    const cardEl = cardRef.current;
    if (!cardEl) return;
    const r = cardEl.getBoundingClientRect();
    const x = d.startX + (dxPx / r.width) * 100;
    const y = d.startY + (dyPx / r.height) * 100;
    setBubblePos({
      x: Math.max(0, Math.min(95, x)),
      y: Math.max(0, Math.min(95, y)),
    });
    setDraggingOverTrash(isOverTrash(e.clientX, e.clientY));
  };
  const onBubblePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = bubbleDragRef.current;
    if (d.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    const droppedOnTrash = d.captured && isOverTrash(e.clientX, e.clientY);
    bubbleDragRef.current = {
      pointerId: null,
      startClientX: 0,
      startClientY: 0,
      startX: 0,
      startY: 0,
      captured: false,
      pushed: false,
    };
    if (droppedOnTrash) {
      // bubble 비우면 자동으로 wrap 자체가 렌더 안됨 (rc-bubble-wrap visibility 조건)
      setCard({ bubble: "" });
      setBubblePos(null);
    }
    setDraggingContent(null);
    setDraggingOverTrash(false);
  };
  const statsOffset = useAppStore((s) => s.studioStatsOffset);
  const setStatsOffset = useAppStore((s) => s.setStudioStatsOffset);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startOffX: number;
    startOffY: number;
    captured: boolean;
    pushed: boolean;
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startOffX: 0,
    startOffY: 0,
    captured: false,
    pushed: false,
  });
  const DRAG_THRESHOLD = 4;

  const transforms: string[] = [];
  if (rotate) transforms.push(`rotate(${rotate}deg)`);
  if (flipH) transforms.push("scaleX(-1)");
  if (flipV) transforms.push("scaleY(-1)");
  if (crop && crop !== 1) transforms.push(`scale(${crop})`);
  const transform = transforms.length > 0 ? transforms.join(" ") : undefined;

  const photoStyle = bg
    ? {
        backgroundImage: `url("${bg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transform,
        transformOrigin: "center",
        transition: "transform 0.18s ease",
        opacity: bgOpacity,
      }
    : transform || bgOpacity !== 1
    ? {
        transform,
        transformOrigin: "center",
        transition: "transform 0.18s ease",
        opacity: bgOpacity,
      }
    : undefined;

  void ratio;

  const onStatsPointerDown = (e: React.PointerEvent) => {
    if (small) return;
    // Card layer locked: block the drag entirely.
    if (cardLocked) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffX: statsOffset.x,
      startOffY: statsOffset.y,
      captured: false,
      pushed: false,
    };
  };

  const onStatsPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d.pointerId !== e.pointerId) return;
    const dxPx = e.clientX - d.startX;
    const dyPx = e.clientY - d.startY;

    if (!d.captured) {
      if (Math.abs(dxPx) < DRAG_THRESHOLD && Math.abs(dyPx) < DRAG_THRESHOLD) {
        return;
      }
      d.captured = true;
      try {
        (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
      const ae = document.activeElement;
      if (ae instanceof HTMLElement && ae.isContentEditable) ae.blur();
      window.getSelection?.()?.removeAllRanges?.();
      pushHistory();
      d.pushed = true;
      d.startX = e.clientX;
      d.startY = e.clientY;
      return;
    }

    setStatsOffset(d.startOffX + dxPx, d.startOffY + dyPx);
  };

  const onStatsPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d.pointerId !== e.pointerId) return;
    if (d.captured) {
      try {
        (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        /* noop */
      }
    }
    d.pointerId = null;
    d.captured = false;
  };

  return (
    <div
      ref={cardRef}
      className={`running-card${small ? " small" : ""} layout-${layoutId || "default"}`}
    >
      {!bgHidden && <div className="rc-photo" style={photoStyle} />}
      {!bgHidden && <div className="rc-grad" />}
      {/* 기본 러너 캐릭터(.rc-runner) 는 더 이상 자동 노출하지 않음.
       *  - 사진 배경 위에 캐릭터가 겹쳐 보이는 게 부담스럽다는 사용자 피드백.
       *  - 캐릭터가 필요하면 다음 중 하나로 명시적으로 추가:
       *    · 스티커 탭 → 마스코트 12종 중 선택
       *    · 디자인 → 테마 → "마스코트" / "하트 코너" 오버레이
       *    · AI 오늘의 러닝일지 마치면 자동 등장하는 우측 하단 말풍선+마스코트 */}
      {/* 테마 오버레이 — 배경 위, 스티커/텍스트/통계 아래.
          투명 영역을 포함한 SVG라 배경을 가리지 않고 장식만 얹힘. */}
      {themeOverlay && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={themeOverlay}
          alt=""
          className="rc-theme-overlay"
          aria-hidden="true"
        />
      )}

      {!cardHidden && (
        <div
          className="rc-stats-group"
          style={
            small
              ? undefined
              : {
                  transform: `translate(${statsOffset.x}px, ${statsOffset.y}px)`,
                  cursor: cardLocked ? "default" : undefined,
                  opacity: cardOpacity,
                }
          }
          onPointerDown={onStatsPointerDown}
          onPointerMove={onStatsPointerMove}
          onPointerUp={onStatsPointerUp}
          onPointerCancel={onStatsPointerUp}
        >
          {/* 레이아웃 ID 에 따라 stats-group 의 내용이 완전히 달라짐. */}
          {renderLayoutContent({
            layoutId,
            small,
            cardLocked,
            card,
            setCard,
            colors: cardTextColors,
          })}
        </div>
      )}

      {/* 말풍선 + 마스코트 묶음 — bubble 텍스트가 있을 때만 렌더.
          초기 상태에서는 bubble="" 이라 숨겨져 있다가, AI 오늘의 러닝일지
          요약이 완료되면 setStudioCardData({ bubble: 요약 }) 가 호출되어
          자동으로 카드에 등장한다.
          드래그로 위치 이동 가능 (studioBubblePos), 휴지통으로 끌어 떨어뜨리면 삭제. */}
      {!cardHidden && card.bubble.trim() !== "" && (
        <div
          className={`rc-bubble-wrap${bubblePos ? " positioned" : ""}`}
          style={
            !small && bubblePos
              ? {
                  left: `${bubblePos.x}%`,
                  top: `${bubblePos.y}%`,
                  right: "auto",
                  bottom: "auto",
                  cursor: cardLocked ? "default" : "grab",
                }
              : !small
                ? { cursor: cardLocked ? "default" : "grab" }
                : undefined
          }
          onPointerDown={onBubblePointerDown}
          onPointerMove={onBubblePointerMove}
          onPointerUp={onBubblePointerUp}
          onPointerCancel={onBubblePointerUp}
        >
          <div
            className="rc-bubble"
            style={cardTextColors.bubble ? { color: cardTextColors.bubble } : undefined}
          >
            <EditableText
              small={small}
              locked={cardLocked}
              multiline
              value={card.bubble}
              onChange={(v) => setCard({ bubble: v })}
              field="bubble"
              color={cardTextColors.bubble}
            />
          </div>
          <div className="rc-mascot">
            {/* 카드 우측 하단 — 메인 캐릭터(main-character.png, 보라 러닝 마스코트). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/main-character.png" alt="" draggable={false} />
          </div>
        </div>
      )}
    </div>
  );
}
