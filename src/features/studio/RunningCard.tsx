"use client";

import { useEffect, useRef } from "react";
import Mascot from "@/components/ui/Mascot";
import { useAppStore } from "@/stores/useAppStore";

// Uncontrolled contentEditable: sets initial text via ref on mount, then
// emits onChange without React re-rendering its children (preserves caret).
function EditableText({
  value,
  onChange,
  className,
  multiline = false,
  small,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
  small?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const editedRef = useRef(false);
  const pushHistory = useAppStore((s) => s.pushStudioHistory);
  const Tag = (multiline ? "div" : "span") as "div" | "span";

  // Initial mount only — render the value via DOM, never via React children.
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the value was changed externally (e.g. via "load record" or undo),
  // sync the DOM only when the element is not currently being edited.
  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  if (small) {
    // small preview shouldn't be editable
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      ref={ref as React.RefObject<HTMLSpanElement & HTMLDivElement>}
      className={className}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onPointerDown={(e) => e.stopPropagation()}
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
  const rotate = useAppStore((s) => s.studioRotate);
  const flipH = useAppStore((s) => s.studioFlipH);
  const flipV = useAppStore((s) => s.studioFlipV);
  const crop = useAppStore((s) => s.studioCrop);
  const ratio = useAppStore((s) => s.studioRatio);
  const card = useAppStore((s) => s.studioCardData);
  const setCard = useAppStore((s) => s.setStudioCardData);

  const transforms: string[] = [];
  if (rotate) transforms.push(`rotate(${rotate}deg)`);
  if (flipH) transforms.push("scaleX(-1)");
  if (flipV) transforms.push("scaleY(-1)");
  if (crop && crop !== 1) transforms.push(`scale(${crop})`);
  const transform = transforms.length > 0 ? transforms.join(" ") : undefined;

  const photoStyle = bg
    ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transform,
        transformOrigin: "center",
        transition: "transform 0.18s ease",
      }
    : transform
    ? { transform, transformOrigin: "center", transition: "transform 0.18s ease" }
    : undefined;

  // ratio is consumed by card-stage in studio/page.tsx; reference it here so
  // the component re-renders when ratio changes (no-op on small preview).
  void ratio;

  return (
    <div className={`running-card${small ? " small" : ""}`}>
      <div className="rc-photo" style={photoStyle} />
      <div className="rc-grad" />
      {!bg && <div className="rc-runner" />}

      <div className="rc-week">
        <EditableText
          small={small}
          value={card.weekTitle}
          onChange={(v) => setCard({ weekTitle: v })}
        />{" "}
        <span>🏃</span>
      </div>
      <div className="rc-distance">
        <EditableText
          small={small}
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
              value={card.calories}
              onChange={(v) => setCard({ calories: v })}
            />
          </b>
          <i>kcal</i>
        </div>
      </div>

      <div className="rc-bubble-wrap">
        <div className="rc-bubble">
          <EditableText
            small={small}
            multiline
            value={card.bubble}
            onChange={(v) => setCard({ bubble: v })}
          />{" "}
          <span>💜</span>
        </div>
        <div className="rc-mascot">
          <Mascot />
        </div>
      </div>
    </div>
  );
}
