"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import RunningCard from "@/features/studio/RunningCard";
import StudioPanel from "@/features/studio/StudioPanel";
import CropOverlay from "@/features/studio/CropOverlay";
import TextOverlay from "@/features/studio/TextOverlay";
import TextSubmenu from "@/features/studio/TextSubmenu";
import EyedropperLoupe from "@/features/studio/EyedropperLoupe";
import RecordPicker from "@/features/studio/RecordPicker";
import StylePicker from "@/features/studio/StylePicker";
import PlacedStickers from "@/features/studio/PlacedStickers";
import TrashZone from "@/features/studio/TrashZone";
import LayerPanel from "@/features/studio/LayerPanel";
import DesignSubmenu from "@/features/studio/DesignSubmenu";
import { useAppStore } from "@/stores/useAppStore";

export default function StudioPage() {
  const router = useRouter();
  const tab = useAppStore((s) => s.studioTab);
  const setTab = useAppStore((s) => s.setStudioTab);
  const setBackground = useAppStore((s) => s.setStudioBackground);
  const showToast = useAppStore((s) => s.showToast);
  const cropMode = useAppStore((s) => s.studioCropMode);
  const ratio = useAppStore((s) => s.studioRatio);
  const undo = useAppStore((s) => s.studioUndo);
  const redo = useAppStore((s) => s.studioRedo);
  const canUndo = useAppStore((s) => s.studioHistory.length > 0);
  const canRedo = useAppStore((s) => s.studioFuture.length > 0);
  const setRecordPickerOpen = useAppStore((s) => s.setStudioRecordPickerOpen);
  const layerPanelOpen = useAppStore((s) => s.studioLayerPanelOpen);
  const toggleLayerPanel = useAppStore((s) => s.toggleStudioLayerPanel);
  const resetAI = useAppStore((s) => s.resetAI);
  // 저장 기능에 필요한 store 데이터 — 스냅샷에 포함되는 모든 시각 상태.
  const studioCardData = useAppStore((s) => s.studioCardData);
  const studioBackground = useAppStore((s) => s.studioBackground);
  const studioLayoutId = useAppStore((s) => s.studioLayoutId);
  const studioThemeOverlay = useAppStore((s) => s.studioThemeOverlay);
  const studioRotate = useAppStore((s) => s.studioRotate);
  const studioFlipH = useAppStore((s) => s.studioFlipH);
  const studioFlipV = useAppStore((s) => s.studioFlipV);
  const studioCrop = useAppStore((s) => s.studioCrop);
  const studioRatio = useAppStore((s) => s.studioRatio);
  const studioTexts = useAppStore((s) => s.studioTexts);
  const placedStickers = useAppStore((s) => s.placedStickers);
  const studioLayerOrder = useAppStore((s) => s.studioLayerOrder);
  const studioLayerOpacities = useAppStore((s) => s.studioLayerOpacities);
  const studioHiddenLayers = useAppStore((s) => s.studioHiddenLayers);
  const studioCardTextColors = useAppStore((s) => s.studioCardTextColors);
  const studioBubblePos = useAppStore((s) => s.studioBubblePos);
  const studioStatsOffset = useAppStore((s) => s.studioStatsOffset);
  const addUserGalleryCard = useAppStore((s) => s.addUserGalleryCard);
  const setGalleryFilter = useAppStore((s) => s.setGalleryFilter);
  const setArchiveMainTab = useAppStore((s) => s.setArchiveMainTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onLoadRecord = () => {
    setRecordPickerOpen(true);
  };

  /**
   * 스튜디오의 현재 카드 상태를 GalleryCard 로 캡쳐해서 갤러리 보관소(userGalleryCards)에 저장.
   *
   * - id: 현재 시각(ms) — 충돌 방지를 위해 Date.now() 사용.
   * - y/m/date: 오늘 날짜로 채워서 그 월 필터에 자동 노출.
   * - title/dist/pace/time/kcal: studioCardData 에서 그대로 가져옴.
   *   사용자가 EditableText 로 카드에 직접 입력한 값이 반영됨.
   * - bg: 현재 배경 (사진 dataURL 또는 기본 그라데이션 CSS).
   *   배경이 없으면 카드의 기본 그라데이션을 사용.
   * - 저장 후 갤러리 필터를 오늘 월로 점프시켜서 사용자가 보관함→갤러리 진입 시
   *   바로 자기 카드를 볼 수 있게 함.
   */
  const onSaveCard = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const dows = ["일", "월", "화", "수", "목", "금", "토"];
    const dateStr = `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${dows[now.getDay()]})`;

    // calories 는 숫자 — studioCardData.calories 는 문자열이라 parseInt
    const kcalNum = parseInt(studioCardData.calories.replace(/\D/g, ""), 10);

    // 갤러리 그리드에서 미리보기로 쓰일 단순 bg — 사진/그라데이션 둘 다 호환되는 CSS.
    const cardBg = studioBackground
      ? `url("${studioBackground}") center / cover no-repeat`
      : "linear-gradient(180deg,#FFC18D 0%,#DDA9C9 25%,#A989B8 50%,#4D3F62 80%,#2A2536 100%)";

    // 전체 시각 상태 스냅샷 — 갤러리 상세에서 편집한 모습 그대로 재현하는 데 사용.
    const snapshot = {
      bg: studioBackground,
      themeOverlay: studioThemeOverlay,
      layoutId: studioLayoutId,
      ratio: studioRatio,
      rotate: studioRotate,
      flipH: studioFlipH,
      flipV: studioFlipV,
      crop: studioCrop,
      cardData: { ...studioCardData },
      cardTextColors: { ...studioCardTextColors },
      bubblePos: studioBubblePos,
      statsOffset: studioStatsOffset,
      // 깊은 복사 — 향후 store 가 mutate 되어도 스냅샷은 그대로 유지.
      texts: studioTexts.map((t) => ({ ...t })),
      stickers: placedStickers.map((p) => ({ ...p })),
      layerOrder: [...studioLayerOrder],
      layerOpacities: { ...studioLayerOpacities },
      hiddenLayers: { ...studioHiddenLayers },
    };

    addUserGalleryCard({
      id: Date.now(),
      y,
      m,
      date: dateStr,
      title: studioCardData.weekTitle?.trim() || "내 러닝 카드",
      dist: studioCardData.distance || "0.00",
      pace: studioCardData.pace || "—",
      time: studioCardData.time || "—",
      kcal: isFinite(kcalNum) ? kcalNum : 0,
      elev: "—",
      bpm: 0,
      cadence: 0,
      likes: 0,
      comments: 0,
      bg: cardBg,
      snapshot,
    });

    // 갤러리 보관소 필터를 오늘 월로 맞춰서 보관함 진입 시 즉시 노출
    setGalleryFilter({ y, m });
    setArchiveMainTab("gallery");
    showToast("갤러리 보관소에 저장되었습니다");
    // 저장 후 공유/저장 옵션 화면으로 이동 (사용자가 그리워한 popup 화면).
    router.push("/studio/export");
  };

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  };

  const onPickPhoto = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일을 선택해주세요");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      if (url) {
        setBackground(url);
        showToast("배경이 적용되었어요");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <section className="studio-screen">
      <div className="studio-toolbar">
        <button className="st-icon" onClick={back} aria-label="뒤로">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button className="st-icon" aria-label="실행취소" onClick={undo} disabled={!canUndo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14L4 9l5-5" />
            <path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-4" />
          </svg>
        </button>
        <button className="st-icon" aria-label="다시실행" onClick={redo} disabled={!canRedo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14l5-5-5-5" />
            <path d="M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h4" />
          </svg>
        </button>
        <button
          className={`st-icon${layerPanelOpen ? " active" : ""}`}
          aria-label="레이어"
          aria-pressed={layerPanelOpen}
          onClick={toggleLayerPanel}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
            <polyline points="2 15.5 12 22 22 15.5" />
          </svg>
        </button>
        <span style={{ flex: 1 }} />
        {/* 저장하기 — 현재 카드를 GalleryCard 로 변환해 갤러리 보관소에 저장.
            오늘 날짜로 저장되며, 보관함 → 갤러리 보관소에서 오늘 월에 자동 노출됨. */}
        <button type="button" className="st-export" onClick={onSaveCard}>
          저장하기
        </button>
      </div>

      <div className="studio-canvas">
        <div className="studio-card-wrap">
          {(() => {
            // 비율 문자열 "w/h" 를 파싱해서 두 가지를 inline style 로 전달:
            //   1) aspect-ratio: "w / h"  → 카드 비율 (height 자동 계산)
            //   2) --card-ratio: w/h 의 숫자 (예: 9/16 = 0.5625) → CSS 의 width
            //      max 계산식이 이 값을 사용해서 세로 가용 공간에 맞게 카드 폭을
            //      자동 조정. 부정 입력 시 0.5625(=9/16) 폴백.
            const parts = ratio.split("/").map(Number);
            const rx = parts[0];
            const ry = parts[1];
            const ratioNum =
              rx && ry && isFinite(rx / ry) ? rx / ry : 0.5625;
            return (
              <div
                className="card-stage"
                style={{
                  aspectRatio: ratio.replace("/", " / "),
                  ["--card-ratio" as keyof React.CSSProperties]:
                    ratioNum.toString(),
                } as React.CSSProperties}
              >
                <RunningCard />
                <TextOverlay />
                <PlacedStickers />
                {cropMode && <CropOverlay />}
                {tab === "text" && <TextSubmenu />}
                {tab === "design" && <DesignSubmenu />}
                <EyedropperLoupe />
              </div>
            );
          })()}
        </div>
        {/* 통합 휴지통 — 텍스트/스티커를 드래그할 때만 나타남. 위로 끌어 떨어뜨리면 삭제. */}
        <TrashZone />
        <div className="st-fab-stack">
          {/* AI 오늘의 러닝일지 — 같은 /archive/ai 로 가지만 ?from=studio 쿼리로
              "스튜디오에서 진입했다" 는 컨텍스트를 전달한다.
              이 컨텍스트가 있으면 intro 의 주 버튼이 "대화 시작 하기" 대신
              "저장된 러닝일지 불러오기" 로 바뀌어서 /archive/journals?from=studio
              로 이동, 사용자가 거기서 일지를 골라 스튜디오 카드 말풍선에 즉시
              적용할 수 있다. (보관함에서 진입할 땐 쿼리가 없어 기존 흐름 유지.) */}
          <Link
            href="/archive/ai?from=studio"
            className="st-fab st-fab-mascot"
            aria-label="AI 오늘의 러닝일지"
            onClick={resetAI}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tracksy-chatbot.png"
              alt=""
              className="st-fab-mascot-img"
              draggable={false}
            />
          </Link>
          <button className="st-fab st-fab-image" aria-label="배경 사진 추가" onClick={onPickPhoto}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="8.5" cy="10" r="1.4" fill="currentColor" />
              <path d="M21 16l-5-5-9 9" />
            </svg>
            <span className="st-fab-plus" aria-hidden>+</span>
          </button>
          <button className="st-fab st-fab-record" aria-label="기록 불러오기" onClick={onLoadRecord}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/run.png"
              alt=""
              className="st-fab-record-img"
              draggable={false}
            />
            <span className="st-fab-plus" aria-hidden>+</span>
          </button>
          {/* 스타일 불러오기는 Design > 스타일 탭으로 이동했으므로 FAB은 제거. */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
        </div>
      </div>

      <RecordPicker />
      <StylePicker />
      <LayerPanel />

      <div className="studio-panel">
        <StudioPanel tab={tab} />
      </div>

      <div className="studio-tabs">
        <button className={`st-tab${tab === "edit" ? " active" : ""}`} onClick={() => setTab("edit")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 2v16a2 2 0 0 0 2 2h14" />
            <path d="M2 6h16a2 2 0 0 1 2 2v14" />
          </svg>
          <span>편집</span>
        </button>
        <button className={`st-tab${tab === "text" ? " active" : ""}`} onClick={() => setTab("text")}>
          <span className="tab-tr">Tr</span>
          <span>텍스트</span>
        </button>
        <button className={`st-tab${tab === "sticker" ? " active" : ""}`} onClick={() => setTab("sticker")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <circle cx="9" cy="10" r="0.9" fill="currentColor" />
            <circle cx="15" cy="10" r="0.9" fill="currentColor" />
            <path d="M8 14c1.2 1.5 2.5 2.2 4 2.2s2.8-.7 4-2.2" />
          </svg>
          <span>스티커</span>
        </button>
        <button className={`st-tab${tab === "design" ? " active" : ""}`} onClick={() => setTab("design")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3a9 9 0 0 0 0 18c1.7 0 3-1.3 3-3a2 2 0 0 1 2-2h2a4 4 0 0 0 4-4 9 9 0 0 0-9-9z" />
            <circle cx="7.5" cy="11" r="1.2" fill="currentColor" />
            <circle cx="11" cy="7" r="1.2" fill="currentColor" />
            <circle cx="16" cy="8" r="1.2" fill="currentColor" />
            <circle cx="18" cy="13" r="1.2" fill="currentColor" />
          </svg>
          <span>디자인</span>
        </button>
      </div>
    </section>
  );
}
