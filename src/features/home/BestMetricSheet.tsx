"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

const OPTIONS: { value: "dist" | "time" | "pace"; label: string; desc: string }[] = [
  { value: "dist", label: "거리", desc: "가장 멀리 뛴 기록" },
  { value: "time", label: "시간", desc: "가장 오래 뛴 기록" },
  { value: "pace", label: "페이스", desc: "가장 빠른 페이스" },
];

export default function BestMetricSheet() {
  const current = useAppStore((s) => s.bestMetric);
  const setBestMetric = useAppStore((s) => s.setBestMetric);
  const setModal = useAppStore((s) => s.setModal);

  const [draft, setDraft] = useState<"dist" | "time" | "pace">(current);

  // Sync draft with the current value when the sheet (re)opens
  useEffect(() => {
    setDraft(current);
  }, [current]);

  const close = () => setModal(null);
  const apply = () => {
    setBestMetric(draft);
    close();
  };

  return (
    <>
      <div className="gf-overlay" onClick={close} />
      <div className="gf-sheet bm-sheet" role="dialog" aria-label="최고 기록 기준 선택">
        <div className="gf-sheet-handle" />
        <div className="bm-title">최고 기록 기준</div>
        <div className="bm-list">
          {OPTIONS.map((opt) => {
            const active = draft === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`bm-item${active ? " active" : ""}`}
                onClick={() => setDraft(opt.value)}
                aria-pressed={active}
              >
                <div className="bm-item-text">
                  <span className="bm-item-label">{opt.label}</span>
                  <span className="bm-item-desc">{opt.desc}</span>
                </div>
                <span className={`bm-radio${active ? " active" : ""}`} aria-hidden />
              </button>
            );
          })}
        </div>
        <button className="primary-btn bm-apply" onClick={apply}>
          적용하기
        </button>
      </div>
    </>
  );
}
