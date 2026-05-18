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
  hiddenFields,
}: {
  layoutId: string;
  small: boolean;
  cardLocked: boolean;
  card: CardData;
  setCard: (patch: Partial<CardData>) => void;
  /** studioCardTextColors — 필드별 색상 lookup. 없으면 기본 색. */
  colors: Record<string, string>;
  /** studioHiddenCardFields — true 인 필드는 row 전체를 렌더하지 않음. */
  hiddenFields: Record<string, boolean>;
}): React.ReactNode {
  /**
   * 필드가 숨김 처리됐는지 확인하는 헬퍼.
   * small preview(갤러리 보관소 미리보기 등) 에서는 숨김을 무시 — 사용자가
   * 스튜디오에서 삭제했더라도 갤러리 보관소의 카드 자체는 원본 그대로 보여줘야
   * 의미가 통하기 때문. (스튜디오 작업물의 진짜 모습은 갤러리 보관소 저장 시
   * 별도 snapshot 으로 박제되어 그쪽에서 사용됨.)
   */
  const isHidden = (field: string) => !small && hiddenFields[field] === true;
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

    /* 기본(default) — 기존 풀 레이아웃 (주제목 + 거리 + 통계 3개)
     *
     * 각 텍스트/라벨/단위/아이콘을 모두 DeletableSlot 으로 감싸서 개별 drag-to-trash
     * 가 가능하도록 한다. 다음 필드 키들이 각각 독립적으로 삭제됨:
     *   weekTitle, weekTitleIcon (🏃)
     *   distance, distanceUnit (km)
     *   timeIcon (⏱), time, timeLabel (운동 시간)
     *   paceIcon (⚡), pace, paceLabel (평균 페이스)
     *   caloriesIcon (🔥), calories, caloriesLabel (kcal)
     *
     * 부모 row 는 그 row 안의 모든 요소가 숨겨졌을 때만 렌더하지 않는다 →
     * 일부만 지우면 row 는 유지되고 남은 요소만 표시됨.
     */
    default: {
      const showWT = !isHidden("weekTitle");
      const showWTIcon = !isHidden("weekTitleIcon");
      const showWeek = showWT || showWTIcon;

      const showDist = !isHidden("distance");
      const showDistU = !isHidden("distanceUnit");
      const showDistance = showDist || showDistU;

      const showTimeIcon = !isHidden("timeIcon");
      const showTime = !isHidden("time");
      const showTimeLbl = !isHidden("timeLabel");
      const showTimeRow = showTimeIcon || showTime || showTimeLbl;

      const showPaceIcon = !isHidden("paceIcon");
      const showPace = !isHidden("pace");
      const showPaceLbl = !isHidden("paceLabel");
      const showPaceRow = showPaceIcon || showPace || showPaceLbl;

      const showCalIcon = !isHidden("caloriesIcon");
      const showCal = !isHidden("calories");
      const showCalLbl = !isHidden("caloriesLabel");
      const showCalRow = showCalIcon || showCal || showCalLbl;

      const anyStat = showTimeRow || showPaceRow || showCalRow;

      // small preview(보관함 카드) 에서는 DeletableSlot 의 drag 오버헤드 없이
      // 단순 렌더. 스튜디오에서만 drag 활성화.
      const wrap = (field: string, node: React.ReactNode) =>
        small ? (
          node
        ) : (
          <DeletableSlot field={field} locked={cardLocked}>
            {node}
          </DeletableSlot>
        );

      return (
        <>
          {showWeek && (
            <div className="rc-week" style={cWeek ? { color: cWeek } : undefined}>
              {showWT &&
                wrap(
                  "weekTitle",
                  <EditableText
                    small={small}
                    locked={cardLocked}
                    value={card.weekTitle}
                    onChange={(v) => setCard({ weekTitle: v })}
                    field="weekTitle"
                    color={cWeek}
                  />,
                )}
              {showWT && showWTIcon && " "}
              {showWTIcon && wrap("weekTitleIcon", <span>🏃</span>)}
            </div>
          )}
          {showDistance && (
            <div className="rc-distance" style={cDist ? { color: cDist } : undefined}>
              {showDist &&
                wrap(
                  "distance",
                  <EditableText
                    small={small}
                    locked={cardLocked}
                    value={card.distance}
                    onChange={(v) => setCard({ distance: v })}
                    field="distance"
                    color={cDist}
                  />,
                )}
              {showDistU && wrap("distanceUnit", <small>km</small>)}
            </div>
          )}
          {anyStat && (
            <div className="rc-stats">
              {showTimeRow && (
                <div className="rc-stat" style={cTime ? { color: cTime } : undefined}>
                  {showTimeIcon &&
                    wrap("timeIcon", <span className="rc-ic">⏱</span>)}
                  {showTime &&
                    wrap(
                      "time",
                      <b>
                        <EditableText
                          small={small}
                          locked={cardLocked}
                          value={card.time}
                          onChange={(v) => setCard({ time: v })}
                          field="time"
                          color={cTime}
                        />
                      </b>,
                    )}
                  {showTimeLbl && wrap("timeLabel", <i>운동 시간</i>)}
                </div>
              )}
              {showPaceRow && (
                <div className="rc-stat" style={cPace ? { color: cPace } : undefined}>
                  {showPaceIcon &&
                    wrap("paceIcon", <span className="rc-ic">⚡</span>)}
                  {showPace &&
                    wrap(
                      "pace",
                      <b>
                        <EditableText
                          small={small}
                          locked={cardLocked}
                          value={card.pace}
                          onChange={(v) => setCard({ pace: v })}
                          field="pace"
                          color={cPace}
                        />
                      </b>,
                    )}
                  {showPaceLbl && wrap("paceLabel", <i>평균 페이스</i>)}
                </div>
              )}
              {showCalRow && (
                <div className="rc-stat" style={cCal ? { color: cCal } : undefined}>
                  {showCalIcon &&
                    wrap("caloriesIcon", <span className="rc-ic">🔥</span>)}
                  {showCal &&
                    wrap(
                      "calories",
                      <b>
                        <EditableText
                          small={small}
                          locked={cardLocked}
                          value={card.calories}
                          onChange={(v) => setCard({ calories: v })}
                          field="calories"
                          color={cCal}
                        />
                      </b>,
                    )}
                  {showCalLbl && wrap("caloriesLabel", <i>kcal</i>)}
                </div>
              )}
            </div>
          )}
        </>
      );
    }
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
   *  텍스트 탭의 색상/폰트/사이즈 picker 가 이 필드에 적용된다. */
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
  // 필드별 폰트(family/weight/style) / 사이즈 lookup — 텍스트 탭에서 변경 시 적용.
  // field 없는 EditableText(예: 동적 값 없음) 는 lookup 도 건너뛴다.
  const cardTextFonts = useAppStore((s) => s.studioCardTextFonts);
  const cardTextSizes = useAppStore((s) => s.studioCardTextSizes);
  const fieldFont = field ? cardTextFonts[field] : undefined;
  const fieldSize = field ? cardTextSizes[field] : undefined;
  const Tag = (multiline ? "div" : "span") as "div" | "span";
  const isActiveField = field != null && activeField === field;
  // drag-to-trash 는 외부 DeletableSlot 컴포넌트가 담당. EditableText 는 순수히
  // 인라인 텍스트 편집(클릭→focus→타이핑) 만 책임진다. 활성화는 onFocus 에서
  // 일어남.

  // color + font/size 를 모두 합친 인라인 스타일. 미지정 항목은 inherit 로 두어
  // CSS 기본을 유지. (예: 거리 텍스트의 큰 폰트 사이즈는 기본 CSS 가 정의하고,
  // 사용자가 size 슬라이더를 만지면 그 값으로 덮어쓴다.)
  const customStyle: React.CSSProperties = {};
  if (color) customStyle.color = color;
  if (fieldFont) {
    customStyle.fontFamily = fieldFont.family;
    if (fieldFont.weight != null) customStyle.fontWeight = fieldFont.weight;
    if (fieldFont.style) customStyle.fontStyle = fieldFont.style;
  }
  if (fieldSize != null) customStyle.fontSize = `${fieldSize}px`;

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
      <Tag
        className={className}
        style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
      >
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLSpanElement & HTMLDivElement>}
      className={`${className ?? ""}${isActiveField ? " card-text-active" : ""}`}
      style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
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

/**
 * 카드 빌트인 요소(값/라벨/단위)를 감싸 drag-to-trash 를 제공하는 wrapper.
 *
 * 텍스트 오버레이의 drag 패턴과 동일한 방식:
 *  - pointerdown 시 dragRef 셋업, 즉시 activate 하지 않음
 *  - pointermove 가 임계치(6px) 를 넘으면 capture + 휴지통 노출 + contentEditable
 *    blur (편집 모드와의 충돌 차단)
 *  - pointerup 시 trash 위면 setCardFieldHidden(field, true) → row/요소 사라짐
 *  - 드래그 없는 단순 탭은 그대로 통과 → 자식의 click/focus 가 자연스럽게 발동
 *
 * field 별로 독립적이라 km/운동 시간/평균 페이스/kcal 같은 라벨도 각각 삭제 가능.
 */
function DeletableSlot({
  field,
  locked,
  children,
  className,
  inline = true,
}: {
  field: string;
  locked: boolean;
  children: React.ReactNode;
  className?: string;
  /** inline-block 으로 폭 자동(텍스트 길이만큼), false 면 block. */
  inline?: boolean;
}) {
  const setDragging = useAppStore((s) => s.setStudioDraggingContent);
  const setOverTrash = useAppStore((s) => s.setStudioDraggingOverTrash);
  const setCardFieldHidden = useAppStore((s) => s.setCardFieldHidden);
  // 그룹 드래그(long-press) 에 필요한 store 액션 — rc-stats-group 의 위치 commit
  // 과 휴지통에 떨어졌을 때 card 레이어 통째 숨김 처리에 사용.
  const setStatsOffset = useAppStore((s) => s.setStudioStatsOffset);
  const setLayerHidden = useAppStore((s) => s.setLayerHidden);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const dragRef = useRef<{
    captured: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
  }>({ captured: false, pointerId: null, startX: 0, startY: 0 });
  // overTrash 캐시 — 같은 값을 연속 set 하지 않게 해서 TrashZone 재렌더 최소화.
  const lastOverRef = useRef(false);
  // 임계치를 3px 로 낮춰 즉각 반응. (너무 0 으로 두면 단순 탭이 드래그로 오인됨.)
  const DRAG_THRESHOLD = 3;
  // ──────────────────────────────────────────────────────────
  // Long-press → 그룹 드래그 모드
  //
  // 사용자가 카드 요소(예: "5.21", "km") 를 LONG_PRESS_MS 만큼 꾹 누르고
  // 있으면 그룹 모드로 전환 — DeletableSlot 자체를 옮기는 대신 부모
  // rc-stats-group 전체(러닝 기록 묶음) 가 손가락 따라 움직인다.
  // 짧게 잡고 곧장 드래그하면 기존처럼 그 요소만 휴지통으로 끌어 삭제.
  // ──────────────────────────────────────────────────────────
  const LONG_PRESS_MS = 450;
  const longPressTimerRef = useRef<number | null>(null);
  const groupModeRef = useRef(false);
  // 그룹 모드 진입 시점의 rc-stats-group 의 누적 offset — 이 위에 dxPx/dyPx 를 더해
  // 새 위치 계산.
  const groupStartOffsetRef = useRef({ x: 0, y: 0 });
  const statsGroupElRef = useRef<HTMLElement | null>(null);

  const getTrashRect = (): DOMRect | null => {
    if (typeof document === "undefined") return null;
    const el = document.querySelector<HTMLElement>(".studio-trash-zone");
    return el ? el.getBoundingClientRect() : null;
  };
  const isOverRect = (
    rect: DOMRect | null,
    x: number,
    y: number,
  ): boolean => {
    if (!rect) return false;
    return (
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );
  };

  // 잠긴 카드(layer locked)면 drag 자체를 비활성 — 자식 클릭/포커스만 통과.
  if (locked) {
    return (
      <span
        className={`deletable-slot${className ? " " + className : ""}`}
        style={{
          display: inline ? "inline-block" : "block",
        }}
      >
        {children}
      </span>
    );
  }

  const onPointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    // 부모 rc-stats-group 의 "전체 카드 드래그" 가 함께 켜지지 않도록 차단.
    // 개별 요소(예: km, 5.21) 드래그는 DeletableSlot 안에서 완결.
    e.stopPropagation();
    // pointer capture 를 pointerdown 시점에 즉시 — 손가락이 작은 라벨 영역을
    // 벗어나도 이후 pointermove 이벤트가 계속 이 wrapper 에 묶여서 발생.
    // (small 라벨일수록 손가락이 금방 영역을 벗어나므로 필수.)
    try {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    dragRef.current = {
      captured: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
    };
    // 부모 rc-stats-group 요소 캐시 — 그룹 모드 시 transform 직접 갱신용.
    statsGroupElRef.current =
      (wrapRef.current?.closest(".rc-stats-group") as HTMLElement | null) ??
      null;
    // Long-press 타이머 시작 — 시간 내 움직임이 없으면 그룹 모드로 전환.
    groupModeRef.current = false;
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      // 아직 드래그가 시작되지 않았고(captured == false), 그룹 모드도 아닐 때만
      // 진입 — 움직임이 먼저 감지되면 onPointerMove 에서 타이머를 취소함.
      if (dragRef.current.captured || groupModeRef.current) return;
      groupModeRef.current = true;
      // 현재 statsOffset 을 zustand 에서 직접 읽어와 기준점으로 저장.
      const cur = useAppStore.getState().studioStatsOffset;
      groupStartOffsetRef.current = { x: cur.x, y: cur.y };
      pushHistory();
      // 휴지통 노출 — 카드 통째 삭제 가능 (rc-stats-group 드래그와 동일 UX).
      setDragging({ kind: "cardLayer" });
      // 시각 어포던스 — rc-stats-group 에 'group-selected' 클래스 부여.
      if (statsGroupElRef.current) {
        statsGroupElRef.current.classList.add("group-selected");
      }
      // 안쪽 contentEditable focus 해제 (편집 모드와 충돌 방지).
      const active = document.activeElement as HTMLElement | null;
      if (active && wrapRef.current?.contains(active)) {
        active.blur();
      }
      window.getSelection?.()?.removeAllRanges?.();
      // 햅틱 피드백 — 가능한 환경에서.
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(12);
        } catch {
          /* noop */
        }
      }
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const d = dragRef.current;
    if (d.pointerId !== e.pointerId) return;
    e.stopPropagation();
    const rawDX = e.clientX - d.startX;
    const rawDY = e.clientY - d.startY;

    // ── 그룹 모드: rc-stats-group 전체를 손가락 따라 이동 ───────────
    if (groupModeRef.current) {
      const nextX = groupStartOffsetRef.current.x + rawDX;
      const nextY = groupStartOffsetRef.current.y + rawDY;
      if (statsGroupElRef.current) {
        statsGroupElRef.current.style.transform = `translate(${nextX}px, ${nextY}px)`;
      }
      const nowOver = isOverRect(getTrashRect(), e.clientX, e.clientY);
      if (nowOver !== lastOverRef.current) {
        lastOverRef.current = nowOver;
        setOverTrash(nowOver);
      }
      return;
    }

    // ── 개별 요소 드래그(기존 동작) ─────────────────────────────────
    if (!d.captured) {
      if (Math.abs(rawDX) < DRAG_THRESHOLD && Math.abs(rawDY) < DRAG_THRESHOLD)
        return;
      d.captured = true;
      // 움직임 감지 → long-press 타이머 취소 (그룹 모드 진입 X).
      if (longPressTimerRef.current != null) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      // (pointer capture 는 onPointerDown 에서 이미 잡혀 있음 — 여기서 다시
      // 부르지 않아도 모든 후속 이벤트가 이 wrapper 로 들어옴.)
      // 안쪽에 활성 contentEditable 이 있으면 blur + 선택 해제로 drag 와의
      // 충돌을 완전히 차단. 임계치를 넘은 직후에도 brief selection 잔상이
      // 남지 않도록 즉시 정리.
      const active = document.activeElement as HTMLElement | null;
      if (active && e.currentTarget.contains(active)) {
        active.blur();
      }
      window.getSelection?.()?.removeAllRanges?.();
      setDragging({ kind: "cardField", field });
      // 드래그 시작 시각 효과 — wrapper 에 .dragging 클래스 추가 (직접 DOM
      // 조작으로 React state 우회 → 추가 재렌더 없음).
      if (wrapRef.current) {
        wrapRef.current.classList.add("dragging");
      }
    }
    // 요소가 커서/손가락을 1:1 로 따라가도록 translate 만 적용.
    // (scale 을 함께 적용하면 요소가 줄어들면서 손가락 위치와 어긋나서
    // "잘 안 잡히는" 느낌이 됨. translate 단독으로 정확한 추적 보장.)
    if (wrapRef.current) {
      wrapRef.current.style.transform = `translate(${rawDX}px, ${rawDY}px)`;
    }
    // pointer 위치가 trash 위에 있는지 hit-test — 값이 변할 때만 store 갱신.
    const nowOver = isOverRect(getTrashRect(), e.clientX, e.clientY);
    if (nowOver !== lastOverRef.current) {
      lastOverRef.current = nowOver;
      setOverTrash(nowOver);
    }
  };

  /** 드래그 종료 시 공통 cleanup — 그룹 모드/개별 드래그 모두에서 호출. */
  const cleanupAfterDrag = () => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (statsGroupElRef.current) {
      statsGroupElRef.current.classList.remove("group-selected");
    }
    groupModeRef.current = false;
    statsGroupElRef.current = null;
    dragRef.current = {
      captured: false,
      pointerId: null,
      startX: 0,
      startY: 0,
    };
  };

  const onPointerUp = (e: React.PointerEvent<HTMLSpanElement>) => {
    const d = dragRef.current;
    if (d.pointerId !== e.pointerId) return;
    e.stopPropagation();
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }

    // ── 그룹 모드 종료 ──────────────────────────────────────────
    if (groupModeRef.current) {
      const droppedOnTrash = isOverRect(
        getTrashRect(),
        e.clientX,
        e.clientY,
      );
      if (droppedOnTrash) {
        // 휴지통에 떨어뜨림 → 카드 레이어 통째 숨김.
        setLayerHidden("card", true);
      } else {
        // 새 위치를 store 에 commit.
        const rawDX = e.clientX - d.startX;
        const rawDY = e.clientY - d.startY;
        setStatsOffset(
          groupStartOffsetRef.current.x + rawDX,
          groupStartOffsetRef.current.y + rawDY,
        );
      }
      setDragging(null);
      setOverTrash(false);
      lastOverRef.current = false;
      cleanupAfterDrag();
      return;
    }

    // ── 개별 요소 드래그 종료 ───────────────────────────────────
    if (d.captured) {
      const droppedOnTrash = isOverRect(
        getTrashRect(),
        e.clientX,
        e.clientY,
      );
      if (droppedOnTrash) {
        setCardFieldHidden(field, true);
      }
      setDragging(null);
      setOverTrash(false);
      lastOverRef.current = false;
      // 드래그 시각 효과 정리 — transform 인라인 스타일 제거 + 클래스 해제.
      if (wrapRef.current) {
        wrapRef.current.style.transform = "";
        wrapRef.current.classList.remove("dragging");
      }
    }
    // 드래그 안 한 경우엔 따로 처리 X — 브라우저가 자식 contentEditable 에
    // 자연스럽게 focus 를 줘서 편집 모드 진입.
    cleanupAfterDrag();
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLSpanElement>) => {
    const d = dragRef.current;
    if (d.pointerId !== e.pointerId) return;
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
    if (groupModeRef.current) {
      // 취소 — 위치 commit 없이 원위치 (rc-stats-group transform 은
      // statsOffset 기반 React 재렌더로 복원됨).
      if (statsGroupElRef.current) {
        const cur = useAppStore.getState().studioStatsOffset;
        statsGroupElRef.current.style.transform = `translate(${cur.x}px, ${cur.y}px)`;
      }
      setDragging(null);
      setOverTrash(false);
      lastOverRef.current = false;
    } else if (d.captured) {
      setDragging(null);
      setOverTrash(false);
      lastOverRef.current = false;
      if (wrapRef.current) {
        wrapRef.current.style.transform = "";
        wrapRef.current.classList.remove("dragging");
      }
    }
    cleanupAfterDrag();
  };

  return (
    <span
      ref={wrapRef}
      className={`deletable-slot${className ? " " + className : ""}`}
      style={{
        display: inline ? "inline-block" : "block",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {children}
    </span>
  );
}

export default function RunningCard({ small = false }: { small?: boolean }) {
  const bg = useAppStore((s) => s.studioBackground);
  const themeOverlay = useAppStore((s) => s.studioThemeOverlay);
  const layoutId = useAppStore((s) => s.studioLayoutId);
  const hidden = useAppStore((s) => s.studioHiddenLayers);
  const locked = useAppStore((s) => s.studioLockedLayers);
  const opacities = useAppStore((s) => s.studioLayerOpacities);
  const layerOrder = useAppStore((s) => s.studioLayerOrder);
  const bgHidden = !small && !!hidden["bg"];
  const cardHidden = !small && !!hidden["card"];
  const cardLocked = !small && !!locked["card"];
  // 레이어 패널의 불투명도 (0~1). small preview에서는 항상 1.
  const bgOpacity = small ? 1 : (opacities["bg"] != null ? opacities["bg"] / 100 : 1);
  const cardOpacity = small ? 1 : (opacities["card"] != null ? opacities["card"] / 100 : 1);
  // (cardZIndex 는 draggingContent 가 선언된 뒤에 계산 — 아래쪽에서.)
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
  const hiddenCardFields = useAppStore((s) => s.studioHiddenCardFields);
  const bubblePos = useAppStore((s) => s.studioBubblePos);
  const setBubblePos = useAppStore((s) => s.setStudioBubblePos);
  const setDraggingContent = useAppStore((s) => s.setStudioDraggingContent);
  const setDraggingOverTrash = useAppStore((s) => s.setStudioDraggingOverTrash);
  // 러닝 기록 전체 삭제 — rc-stats-group 을 휴지통에 떨어뜨리면 card 레이어를 숨김.
  const setLayerHidden = useAppStore((s) => s.setLayerHidden);
  // 드래그 중인지 여부 — 드래그 모드일 땐 running-card 의 overflow 를 풀어서
  // 카드 안의 요소가 휴지통 위치까지 시각적으로 이동할 수 있게 한다.
  // (small preview 에서는 드래그 자체가 없으므로 모드 적용 X.)
  const draggingContent = useAppStore((s) => s.studioDraggingContent);
  const isDragging = !small && draggingContent != null;
  // card 레이어의 동적 z-index — studioLayerOrder 에서 "card" 의 위치를 사용.
  // (텍스트/스티커는 각자 layerOrder.indexOf(key) + 1 을 z-index 로 사용하므로,
  // card 도 동일한 규칙을 따르면 reorder 결과가 시각적으로 즉시 반영됨.)
  //
  // 단, "카드 관련 드래그"(cardField/cardLayer) 가 진행 중일 땐 안쪽의 dragged
  // DeletableSlot 이 휴지통(z-index 30) 위로 보여야 하므로 임시로 50 까지 부스트.
  // 다른 종류의 드래그(text/sticker) 일 땐 부스트하지 않아 카드가 갑자기 텍스트/
  // 스티커 위로 뛰어오르지 않게 함.
  const isCardDrag =
    !small &&
    draggingContent != null &&
    (draggingContent.kind === "cardField" ||
      draggingContent.kind === "cardLayer");
  const cardZIndex = small
    ? undefined
    : isCardDrag
      ? 50
      : layerOrder.includes("card")
        ? layerOrder.indexOf("card") + 1
        : undefined;

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
  // rc-stats-group DOM 참조 — 드래그 중 React state 를 갱신하지 않고 직접
  // transform 만 업데이트해서 끊김 없는 60fps 이동을 보장.
  const statsGroupRef = useRef<HTMLDivElement>(null);
  // 드래그 도중의 실시간 좌표 — store 의 statsOffset 과 별개로 ref 에만 보관.
  // pointerup 시점에 setStatsOffset 으로 한 번에 commit.
  const liveOffsetRef = useRef({ x: 0, y: 0 });
  // overTrash 상태 변화만 store 에 반영하기 위한 캐시 — 같은 값을 연속 set
  // 하지 않도록 해서 TrashZone 의 불필요한 재렌더 방지.
  const lastOverTrashRef = useRef(false);
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
    // 개별 요소(km/5.21 등) 드래그는 DeletableSlot 이 stopPropagation 으로 차단.
    // 따라서 여기까지 올라오는 이벤트는 "stats-group 의 배경/컨테이너에서
    // 시작된" 케이스 — 러닝 기록 전체를 드래그/삭제하려는 의도로 본다.
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
      // liveOffsetRef 의 시작점은 captured 시점의 store offset.
      liveOffsetRef.current = { x: d.startOffX, y: d.startOffY };
      // 휴지통 표시 — 러닝 기록 전체를 드래그 중. 휴지통 위에 떨어뜨리면 card 레이어 숨김.
      setDraggingContent({ kind: "cardLayer" });
      return;
    }

    // 매 pointermove 마다 setState 를 부르면 RunningCard 가 통째로 재렌더되어
    // 60fps 가 깨진다(11개 DeletableSlot 모두 reconcile). 대신 DOM 의 transform 만
    // 직접 갱신해서 React 트리는 건드리지 않음 → 매끈한 이동.
    const nextX = d.startOffX + dxPx;
    const nextY = d.startOffY + dyPx;
    liveOffsetRef.current = { x: nextX, y: nextY };
    if (statsGroupRef.current) {
      statsGroupRef.current.style.transform = `translate(${nextX}px, ${nextY}px)`;
    }
    // trash hit-test — 값이 바뀐 경우에만 store 업데이트 (TrashZone 재렌더 최소화).
    const nowOver = isOverTrash(e.clientX, e.clientY);
    if (nowOver !== lastOverTrashRef.current) {
      lastOverTrashRef.current = nowOver;
      setDraggingOverTrash(nowOver);
    }
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
      // 휴지통 위에서 떼면 card 레이어 통째로 숨김 (러닝 기록 전체 삭제).
      // 휴지통 밖에서 떼면 ref 에 누적된 좌표를 store 에 한 번에 commit
      // (드래그 끝나는 시점에 한 번만 React 재렌더 발생).
      const droppedOnTrash = isOverTrash(e.clientX, e.clientY);
      if (droppedOnTrash) {
        setLayerHidden("card", true);
      } else {
        setStatsOffset(liveOffsetRef.current.x, liveOffsetRef.current.y);
      }
    }
    // 드래그 상태/하이라이트 cleanup.
    setDraggingContent(null);
    setDraggingOverTrash(false);
    lastOverTrashRef.current = false;
    d.pointerId = null;
    d.captured = false;
  };

  return (
    <div
      ref={cardRef}
      className={`running-card${small ? " small" : ""}${isDragging ? " dragging-mode" : ""} layout-${layoutId || "default"}`}
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
          ref={statsGroupRef}
          className="rc-stats-group"
          style={
            small
              ? undefined
              : {
                  transform: `translate(${statsOffset.x}px, ${statsOffset.y}px)`,
                  cursor: cardLocked ? "default" : undefined,
                  opacity: cardOpacity,
                  // layerOrder 기반 z-index — 텍스트/스티커와 동일한 규칙.
                  // 패널에서 카드 레이어를 위/아래로 옮기면 즉시 시각 반영.
                  ...(cardZIndex != null ? { zIndex: cardZIndex } : {}),
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
            hiddenFields: hiddenCardFields,
          })}
        </div>
      )}

      {/* 말풍선 + 마스코트 묶음 — bubble 텍스트가 있을 때만 렌더.
          초기 상태에서는 bubble="" 이라 숨겨져 있다가, AI 오늘의 러닝일지
          요약이 완료되면 setStudioCardData({ bubble: 요약 }) 가 호출되어
          자동으로 카드에 등장한다.
          드래그로 위치 이동 가능 (studioBubblePos), 휴지통으로 끌어 떨어뜨리면 삭제.
          텍스트 탭의 "삭제" 로 hiddenCardFields.bubble = true 면 강제 숨김. */}
      {!cardHidden && card.bubble.trim() !== "" && !hiddenCardFields.bubble && (
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
