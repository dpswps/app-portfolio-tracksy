"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

const OPTIONS: { value: "dist" | "time" | "pace"; label: string }[] = [
  { value: "dist", label: "거리" },
  { value: "time", label: "시간" },
  { value: "pace", label: "페이스" },
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
        <div className="bm-list">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`bm-item${draft === opt.value ? " active" : ""}`}
              onClick={() => setDraft(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button className="primary-btn bm-apply" onClick={apply}>
          적용하기
        </button>
      </div>
    </>
  );
}
