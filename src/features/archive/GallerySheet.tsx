"use client";

import { useAppStore } from "@/stores/useAppStore";
import { pad2 } from "@/lib/date";

export default function GallerySheet() {
  const kind = useAppStore((s) => s.gallerySheet);
  const filter = useAppStore((s) => s.galleryFilter);
  const setSheet = useAppStore((s) => s.setGallerySheet);
  const setFilter = useAppStore((s) => s.setGalleryFilter);

  const close = () => setSheet(null);

  let title: string;
  let items: number[];
  let current: number;

  if (kind === "year") {
    title = "연 단위 선택";
    items = [2026, 2025, 2024, 2023, 2022];
    current = filter.y;
  } else {
    title = "월 단위 선택";
    items = [7, 6, 5, 4, 3];
    current = filter.m;
  }

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
        <div className="gf-list">
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
