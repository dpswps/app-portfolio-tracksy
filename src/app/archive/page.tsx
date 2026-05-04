"use client";

import { useAppStore } from "@/stores/useAppStore";
import RecordsBody from "@/features/archive/RecordsBody";
import GalleryBody from "@/features/archive/GalleryBody";
import StyleBody from "@/features/archive/StyleBody";

export default function ArchivePage() {
  const tab = useAppStore((s) => s.archiveMainTab);
  const setTab = useAppStore((s) => s.setArchiveMainTab);

  return (
    <section className="archive-screen">
      <header className="archive-head">
        <h1>보관함</h1>
        <p className="archive-sub">내 기록, 갤러리, 스타일을 한 곳에서 확인하세요.</p>
      </header>

      <div className="archive-main-tabs">
        <button
          className={`amt-tab${tab === "records" ? " active" : ""}`}
          onClick={() => setTab("records")}
        >
          내 기록 보관소
        </button>
        <button
          className={`amt-tab${tab === "gallery" ? " active" : ""}`}
          onClick={() => setTab("gallery")}
        >
          갤러리 보관소
        </button>
        <button
          className={`amt-tab${tab === "style" ? " active" : ""}`}
          onClick={() => setTab("style")}
        >
          스타일 보관소
        </button>
      </div>

      {tab === "records" && <RecordsBody />}
      {tab === "gallery" && <GalleryBody />}
      {tab === "style" && <StyleBody />}
    </section>
  );
}
