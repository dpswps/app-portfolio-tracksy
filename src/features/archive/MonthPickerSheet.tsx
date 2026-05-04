"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { pad2 } from "@/lib/date";

const YEAR_RANGE = 8;

export default function MonthPickerSheet() {
  const archiveMonth = useAppStore((s) => s.archiveMonth);
  const setArchiveMonth = useAppStore((s) => s.setArchiveMonth);
  const setModal = useAppStore((s) => s.setModal);

  const [draftY, setDraftY] = useState(archiveMonth.y);
  const [draftM, setDraftM] = useState(archiveMonth.m);

  const yearListRef = useRef<HTMLDivElement | null>(null);
  const monthListRef = useRef<HTMLDivElement | null>(null);

  const today = new Date();
  const baseY = today.getFullYear();
  const years: number[] = [];
  for (let i = baseY + YEAR_RANGE; i >= baseY - YEAR_RANGE; i--) years.push(i);
  const months: number[] = [];
  for (let i = 1; i <= 12; i++) months.push(i);

  const close = () => setModal(null);
  const confirm = () => {
    setArchiveMonth(draftY, draftM);
    close();
  };

  useEffect(() => {
    yearListRef.current
      ?.querySelector(".mp-item.active")
      ?.scrollIntoView({ block: "center" });
    monthListRef.current
      ?.querySelector(".mp-item.active")
      ?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <>
      <div className="gf-overlay" onClick={close} />
      <div className="gf-sheet mp-sheet" role="dialog" aria-label="년월 선택">
        <div className="gf-sheet-handle" />
        <div className="gf-sheet-title">년 / 월 선택</div>

        <div className="mp-cols">
          <div className="mp-col">
            <div className="mp-col-label">년</div>
            <div className="mp-list" ref={yearListRef}>
              {years.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`mp-item${v === draftY ? " active" : ""}`}
                  onClick={() => setDraftY(v)}
                >
                  {v}년
                </button>
              ))}
            </div>
          </div>

          <div className="mp-col">
            <div className="mp-col-label">월</div>
            <div className="mp-list" ref={monthListRef}>
              {months.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`mp-item${v === draftM ? " active" : ""}`}
                  onClick={() => setDraftM(v)}
                >
                  {pad2(v)}월
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="primary-btn gf-confirm" onClick={confirm}>
          선택완료
        </button>
      </div>
    </>
  );
}
