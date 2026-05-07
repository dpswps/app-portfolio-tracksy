"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { pad2 } from "@/lib/date";

const YEAR_BACK = 16; // how many years back from current year (no future years)

export default function GallerySheet() {
  const kind = useAppStore((s) => s.gallerySheet);
  const filter = useAppStore((s) => s.galleryFilter);
  const setSheet = useAppStore((s) => s.setGallerySheet);
  const setFilter = useAppStore((s) => s.setGalleryFilter);
  const listRef = useRef<HTMLDivElement | null>(null);

  const close = () => setSheet(null);

  let title: string;
  let items: number[];
  let current: number;

  if (kind === "year") {
    title = "연 단위 선택";
    const baseY = new Date().getFullYear();
    items = [];
    for (let i = baseY; i >= baseY - YEAR_BACK; i--) items.push(i);
    current = filter.y;
  } else {
    title = "월 단위 선택";
    items = [];
    for (let i = 1; i <= 12; i++) items.push(i);
    current = filter.m;
  }

  useEffect(() => {
    listRef.current
      ?.querySelector(".gf-item.active")
      ?.scrollIntoView({ block: "center" });
  }, [kind]);

  const select = (v: number) => {
    if (kind === "year") setFilter({ y: v });
    else setFilter({ m: v });
  };

  return (
    <>
      <div className="gf-overlay" onClick={close} />
      <div className="gf-sheet">
        <div className="gf-sheet-handle" />
        <div className="gf-sheet-title">{title}</div>
        <div className="gf-list gf-list-scroll" ref={listRef}>
          {items.map((v) => (
            <button
              key={v}
              className={`gf-item${v === current ? " active" : ""}`}
              onClick={() => select(v)}
            >
              {kind === "year" ? `${v}년` : `${pad2(v)}월`}
            </button>
          ))}
        </div>
        <button className="primary-btn gf-confirm" onClick={close}>
          선택완료
        </button>
      </div>
    </>
  );
}
