"use client";

import { useEffect, useRef } from "react";
import Mascot from "@/components/ui/Mascot";
import { useAppStore } from "@/stores/useAppStore";

function EditableText({
  value,
  onChange,
  className,
  multiline = false,
  small,
  locked = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
  small?: boolean;
  locked?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const editedRef = useRef(false);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const Tag = (multiline ? "div" : "span") as "div" | "span";

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
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLSpanElement & HTMLDivElement>}
      className={className}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
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
  const hidden = useAppStore((s) => s.studioHiddenLayers);
  const locked = useAppStore((s) => s.studioLockedLayers);
  const bgHidden = !small && !!hidden["bg"];
  const cardHidden = !small && !!hidden["card"];
  const cardLocked = !small && !!locked["card"];
  // Themes are SVG-data-URL gradients applied via the design tab; photos
  // are anything else (uploaded jpg/png as base64 data URL, or file URL).
  const isTheme = !!bg && bg.startsWith("data:image/svg+xml");
  const rotate = useAppStore((s) => s.studioRotate);
  const flipH = useAppStore((s) => s.studioFlipH);
  const flipV = useAppStore((s) => s.studioFlipV);
  const crop = useAppStore((s) => s.studioCrop);
  const ratio = useAppStore((s) => s.studioRatio);
  const card = useAppStore((s) => s.studioCardData);
  const setCard = useAppStore((s) => s.setStudioCardData);
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
      }
    : transform
    ? { transform, transformOrigin: "center", transition: "transform 0.18s ease" }
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
    <div ref={cardRef} className={`running-card${small ? " small" : ""}`}>
      {!bgHidden && <div className="rc-photo" style={photoStyle} />}
      {!bgHidden && <div className="rc-grad" />}
      {!bgHidden && (!bg || isTheme) && <div className="rc-runner" />}

      {!cardHidden && (
        <div
          className="rc-stats-group"
          style={
            small
              ? undefined
              : {
                  transform: `translate(${statsOffset.x}px, ${statsOffset.y}px)`,
                  cursor: cardLocked ? "default" : undefined,
                }
          }
          onPointerDown={onStatsPointerDown}
          onPointerMove={onStatsPointerMove}
          onPointerUp={onStatsPointerUp}
          onPointerCancel={onStatsPointerUp}
        >
          <div className="rc-week">
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.weekTitle}
              onChange={(v) => setCard({ weekTitle: v })}
            />{" "}
            <span>🏃</span>
          </div>
          <div className="rc-distance">
            <EditableText
              small={small}
              locked={cardLocked}
              value={card.distance}
              onChange={(v) => setCard({ distance: v })}
            />
            <small>km</small>
          </div>

          <div className="rc-stats">
            <div className="rc-stat">
              <span className="rc-ic">⏱</span>
              <b>
                <EditableText
                  small={small}
                  locked={cardLocked}
                  value={card.time}
                  onChange={(v) => setCard({ time: v })}
                />
              </b>
              <i>운동 시간</i>
            </div>
            <div className="rc-stat">
              <span className="rc-ic">⚡</span>
              <b>
                <EditableText
                  small={small}
                  locked={cardLocked}
                  value={card.pace}
                  onChange={(v) => setCard({ pace: v })}
                />
              </b>
              <i>평균 페이스</i>
            </div>
            <div className="rc-stat">
              <span className="rc-ic">🔥</span>
              <b>
                <EditableText
                  small={small}
                  locked={cardLocked}
                  value={card.calories}
                  onChange={(v) => setCard({ calories: v })}
                />
              </b>
              <i>kcal</i>
            </div>
          </div>
        </div>
      )}

      {!cardHidden && (
        <div className="rc-bubble-wrap">
          <div className="rc-bubble">
            <EditableText
              small={small}
              locked={cardLocked}
              multiline
              value={card.bubble}
              onChange={(v) => setCard({ bubble: v })}
            />
          </div>
          <div className="rc-mascot">
            <Mascot />
          </div>
        </div>
      )}
    </div>
  );
}
