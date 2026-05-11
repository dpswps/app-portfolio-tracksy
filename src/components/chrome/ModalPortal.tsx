"use client";

import { useAppStore } from "@/stores/useAppStore";
import GallerySheet from "@/features/archive/GallerySheet";
import MonthPickerSheet from "@/features/archive/MonthPickerSheet";
import BestMetricSheet from "@/features/home/BestMetricSheet";

export default function ModalPortal() {
  const modal = useAppStore((s) => s.modal);

  return (
    <div id="modalLayer" style={{ display: modal ? "block" : "none" }}>
      {modal === "gallerySheet" && <GallerySheet />}
      {modal === "monthPicker" && <MonthPickerSheet />}
      {modal === "bestPicker" && <BestMetricSheet />}
    </div>
  );
}
