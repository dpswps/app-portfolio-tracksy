"use client";

import { useAppStore } from "@/stores/useAppStore";
import GallerySheet from "@/features/archive/GallerySheet";

export default function ModalPortal() {
  const modal = useAppStore((s) => s.modal);

  return (
    <div id="modalLayer" style={{ display: modal ? "block" : "none" }}>
      {modal === "gallerySheet" && <GallerySheet />}
    </div>
  );
}
