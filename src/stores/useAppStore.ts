"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ArchiveRecords, Inquiry, RunningRecord, ScanResult, StyleCard } from "@/types";
import type { AIMessage, AIStep } from "@/types";
import { archiveRecords } from "@/data/archiveRecords";

type Modal = "gallerySheet" | "monthPicker" | "bestPicker" | null;
type GallerySheetKind = "year" | "month" | null;

type StudioSnapshot = {
  studioBackground: string | null;
  studioRotate: number;
  studioFlipH: boolean;
  studioFlipV: boolean;
  studioCrop: number;
  studioRatio: string;
  studioTexts: Array<{
    id: number;
    text: string;
    x: number;
    y: number;
    size: number;
    font: string;
    fontWeight?: number | string;
    fontStyle?: string;
    color: string;
  }>;
  placedStickers: Array<{ id: number; emoji: string; x: number; y: number }>;
};

export type AIJournal = {
  id: number;
  date: string;
  savedAt: string;
  summary: string;
};

const DEFAULT_AI_MESSAGES: AIMessage[] = [
  { from: "bot", text: "오늘 러닝 어땠어? 컨디션 좀 얘기해줘 🏃‍♀️" },
];

const DEFAULT_INQUIRIES: Inquiry[] = [
  {
    id: 1,
    type: "서비스 이용",
    title: "기록이 저장되지 않아요.",
    date: "2026.01.01 14:30",
    body: "가민에서 기록 떠서 왔는데, 저장이 안되어 있어서 문의합니다.",
    reply:
      "안녕하세요. 트랙시 고객 센터 입니다.\n\n기록이 저장되지 않는 현상은 앱의 캐시 데이터가 영향을 주는 경우로 아래 방법에 따라 확인 부탁드립니다.",
    status: "wait",
  },
  {
    id: 2,
    type: "계정/로그인",
    title: "기록이 저장되지 않아요.",
    body: "가민에서 기록 떠서 왔는데, 저장이 안되어 있어서 문의합니다.",
    status: "wait",
  },
  {
    id: 3,
    type: "기타",
    title: "기록이 저장되지 않아요.",
    body: "가민에서 기록 떠서 왔는데, 저장이 안되어 있어서 문의합니다.",
    status: "wait",
  },
  {
    id: 4,
    type: "서비스 이용",
    title: "기록이 저장되지 않아요.",
    body: "가민에서 기록 떠서 왔는데, 저장이 안되어 있어서 문의합니다.",
    status: "done",
  },
];

type State = {
  user: { name: string; birth: string; email: string; style: string; avatarUrl?: string | null; coverUrl?: string | null };

  modal: Modal;
  toast: string | null;

  studioTab: "edit" | "text" | "sticker" | "design";
  studioBackground: string | null;
  studioRotate: number;
  studioFlipH: boolean;
  studioFlipV: boolean;
  studioCrop: number;
  studioCropMode: boolean;
  studioRatio: string;
  studioTexts: Array<{
    id: number;
    text: string;
    x: number;
    y: number;
    size: number;
    font: string;
    fontWeight?: number | string;
    fontStyle?: string;
    color: string;
  }>;
  studioActiveTextId: number | null;
  studioTextSubmenu: "none" | "font" | "size" | "color";
  studioEyedropperActive: boolean;
  studioLayerPanelOpen: boolean;
  studioHiddenLayers: Record<string, boolean>;
  studioLockedLayers: Record<string, boolean>;
  studioLayerNames: Record<string, string>;
  /** 각 레이어 key의 불투명도 (0~100). 누락 시 100으로 간주. */
  studioLayerOpacities: Record<string, number>;
  /**
   * 사용자 레이어(텍스트 + 스티커) 통합 순서.
   * 배열의 *마지막* 원소가 z-index 최상위(가장 앞)에 있는 레이어.
   * key 형식: "text-${id}" | "sticker-${id}".
   * 텍스트/스티커를 자유롭게 inter-mingle 할 수 있게 해주는 단일 source of truth.
   */
  studioLayerOrder: string[];
  studioSelectedLayerKey: string | null;
  studioDesignSubmenu: "none" | "theme" | "style";
  /** 현재 적용된 카드 레이아웃 id — Design > 스타일 탭의 그리드에서 선택 */
  studioLayoutId: string;
  /** 배경 위에 얹는 테마 오버레이 (data URL, 보통 투명 영역 포함 SVG).
   *  배경(studioBackground)을 대체하지 않고 그 위에 추가로 렌더링됨. */
  studioThemeOverlay: string | null;
  studioCardData: {
    weekTitle: string;
    distance: string;
    time: string;
    pace: string;
    calories: string;
    bubble: string;
  };
  studioRecordIdx: number;
  studioRecordPickerOpen: boolean;
  /** 스튜디오에서 "스타일 불러오기" 시트 열림 여부. */
  studioStylePickerOpen: boolean;
  studioStatsOffset: { x: number; y: number };
  studioHistory: StudioSnapshot[];
  studioFuture: StudioSnapshot[];
  bgPickerTab: "mine" | "ai";
  placedStickers: Array<{ id: number; emoji: string; x: number; y: number }>;

  archiveMainTab: "records" | "gallery" | "style";
  archiveView: "calendar" | "list";
  archiveCalExpanded: boolean;
  archiveMonth: { y: number; m: number };
  archiveSelected: string | null;
  archiveListExpanded: string | null;
  archiveListCount: number;
  galleryFilter: { y: number; m: number };
  gallerySheet: GallerySheetKind;
  styleSubTab: "saved" | "mine";

  userRecords: ArchiveRecords;
  connectedPartners: string[];
  bestMetric: "dist" | "time" | "pace";

  pendingScanData: ScanResult | null;

  removedSavedStyleIds: string[];
  userSavedStyles: StyleCard[];

  communityTab: "hot" | "new";
  savedPosts: Record<string, boolean>;
  composeSelectedCardId: string | null;

  aiStep: AIStep;
  aiMessages: AIMessage[];
  aiSummary: string | null;
  aiJournals: AIJournal[];

  inquiries: Inquiry[];

  setUser: (p: Partial<State["user"]>) => void;
  setModal: (m: Modal) => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
  setStudioTab: (t: State["studioTab"]) => void;
  setStudioBackground: (url: string | null) => void;
  rotateBackground: () => void;
  toggleFlipH: () => void;
  toggleFlipV: () => void;
  cycleCrop: () => void;
  setStudioCropMode: (on: boolean) => void;
  cycleRatio: () => void;
  addStudioText: () => void;
  updateStudioText: (id: number, patch: Partial<State["studioTexts"][number]>) => void;
  removeStudioText: (id: number) => void;
  setActiveStudioText: (id: number | null) => void;
  setStudioTextSubmenu: (s: State["studioTextSubmenu"]) => void;
  setStudioEyedropperActive: (on: boolean) => void;
  setStudioLayerPanelOpen: (open: boolean) => void;
  toggleStudioLayerPanel: () => void;
  toggleLayerVisibility: (key: string) => void;
  toggleLayerLock: (key: string) => void;
  setLayerName: (key: string, name: string) => void;
  setStudioSelectedLayer: (key: string | null) => void;
  reorderStudioText: (id: number, dir: "up" | "down") => void;
  reorderSticker: (id: number, dir: "up" | "down") => void;
  /** 텍스트 레이어를 특정 array index로 이동 (drag reorder 용). */
  moveStudioTextTo: (id: number, toIndex: number) => void;
  /** 스티커 레이어를 특정 array index로 이동 (drag reorder 용). */
  movePlacedStickerTo: (id: number, toIndex: number) => void;
  /** 레이어 불투명도 설정 (0~100). */
  setLayerOpacity: (key: string, value: number) => void;
  setStudioDesignSubmenu: (m: State["studioDesignSubmenu"]) => void;
  /** 카드 레이아웃 id 설정. */
  setStudioLayoutId: (id: string) => void;
  applyStudioTheme: (bg: string) => void;
  /** 테마 오버레이를 설정 (배경 위에 얹힘). null이면 해제. */
  setStudioThemeOverlay: (overlay: string | null) => void;
  setStudioCardData: (patch: Partial<State["studioCardData"]>) => void;
  loadNextStudioRecord: () => string | null;
  loadStudioRecord: (date: string) => void;
  setStudioRecordPickerOpen: (open: boolean) => void;
  /** 스타일 picker 열기/닫기. */
  setStudioStylePickerOpen: (open: boolean) => void;
  /** 보관함의 저장된 StyleCard를 스튜디오 카드에 적용. 배경·제목·거리·통계 모두 반영. */
  applyStudioStyle: (style: StyleCard) => void;
  updatePlacedSticker: (id: number, patch: { x?: number; y?: number }) => void;
  setStudioStatsOffset: (x: number, y: number) => void;
  pushStudioHistory: () => void;
  studioUndo: () => void;
  studioRedo: () => void;
  setBgPickerTab: (t: State["bgPickerTab"]) => void;
  addSticker: (emoji: string) => void;
  removeSticker: (id: number) => void;
  setArchiveMainTab: (t: State["archiveMainTab"]) => void;
  setArchiveView: (v: State["archiveView"]) => void;
  toggleCalExpanded: () => void;
  setCalExpanded: (v: boolean) => void;
  setArchiveMonth: (y: number, m: number) => void;
  pickDate: (k: string) => void;
  toggleListExpanded: (k: string) => void;
  bumpListCount: () => void;
  resetListCount: () => void;
  addRecord: (key: string, rec: RunningRecord) => void;
  deleteUserRecord: (key: string) => void;
  mergeRecords: (records: ArchiveRecords) => void;
  setPendingScanData: (d: ScanResult | null) => void;
  consumePendingScanData: () => ScanResult | null;
  setGalleryFilter: (p: Partial<State["galleryFilter"]>) => void;
  setGallerySheet: (s: GallerySheetKind) => void;
  setStyleSubTab: (t: State["styleSubTab"]) => void;
  removeSavedStyle: (id: string) => void;
  restoreSavedStyle: (id: string) => void;
  addUserSavedStyle: (style: StyleCard) => void;
  setCommunityTab: (t: State["communityTab"]) => void;
  connectPartner: (id: string) => void;
  togglePostSaved: (id: string | number) => boolean;
  setComposeSelectedCardId: (id: string | null) => void;
  setBestMetric: (m: State["bestMetric"]) => void;
  setAIStep: (s: AIStep) => void;
  pushAIMessage: (m: AIMessage) => void;
  setAISummary: (s: string | null) => void;
  resetAI: () => void;
  addAIJournal: (summary: string) => void;
  removeAIJournal: (id: number) => void;
  prependInquiry: (i: Inquiry) => void;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function stripHtml(s: string): string {
  return s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").trim();
}

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      user: {
        name: "김러너",
        birth: "2000.01.01",
        email: "tracksy1@gmail.com",
        style: "산책/러닝",
      },

      modal: null,
      toast: null,

      studioTab: "edit",
      studioBackground: null,
      studioRotate: 0,
      studioFlipH: false,
      studioFlipV: false,
      studioCrop: 1,
      studioCropMode: false,
      studioRatio: "9/16",
      studioTexts: [],
      studioActiveTextId: null,
      studioTextSubmenu: "none",
      studioEyedropperActive: false,
      studioLayerPanelOpen: false,
      studioHiddenLayers: {},
      studioLockedLayers: { bg: true },
      studioLayerNames: {},
      studioLayerOpacities: {},
      studioLayerOrder: [],
      studioSelectedLayerKey: null,
      studioDesignSubmenu: "none",
      studioThemeOverlay: null,
      studioLayoutId: "default",
      studioCardData: {
        weekTitle: "이번주 러닝 기록",
        distance: "5.21",
        time: "00:32:45",
        pace: "6'12\"",
        calories: "368",
        bubble: "처음 발걸음이\n큰 변화를 만들어요! 💜",
      },
      studioRecordIdx: -1,
      studioRecordPickerOpen: false,
      studioStylePickerOpen: false,
      studioStatsOffset: { x: 0, y: 0 },
      studioHistory: [],
      studioFuture: [],
      bgPickerTab: "mine",
      placedStickers: [],

      archiveMainTab: "records",
      archiveView: "calendar",
      archiveCalExpanded: false,
      archiveMonth: { y: 2026, m: 4 },
      archiveSelected: null,
      archiveListExpanded: null,
      archiveListCount: 4,
      galleryFilter: { y: 2024, m: 5 },
      gallerySheet: null,
      styleSubTab: "saved",

      userRecords: {},
      pendingScanData: null,
      connectedPartners: [],
      bestMetric: "dist",

      removedSavedStyleIds: [],
      userSavedStyles: [],

      communityTab: "hot",
      savedPosts: {},
      composeSelectedCardId: null,

      aiStep: "intro",
      aiMessages: DEFAULT_AI_MESSAGES,
      aiSummary: null,
      aiJournals: [],

      inquiries: DEFAULT_INQUIRIES,

      setUser: (p) => set((s) => ({ user: { ...s.user, ...p } })),
      setModal: (m) => set({ modal: m }),
      showToast: (msg) => {
        set({ toast: msg });
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => set({ toast: null }), 1800);
      },
      hideToast: () => set({ toast: null }),
      setStudioTab: (t) => set({ studioTab: t }),
      setStudioBackground: (url) => {
        get().pushStudioHistory();
        set({
          studioBackground: url,
          studioRotate: 0,
          studioFlipH: false,
          studioFlipV: false,
          studioCrop: 1,
          studioCropMode: false,
        });
      },
      setStudioCropMode: (on) => set({ studioCropMode: on }),
      rotateBackground: () => {
        get().pushStudioHistory();
        set((s) => ({ studioRotate: (s.studioRotate + 90) % 360 }));
      },
      toggleFlipH: () => {
        get().pushStudioHistory();
        set((s) => ({ studioFlipH: !s.studioFlipH }));
      },
      toggleFlipV: () => {
        get().pushStudioHistory();
        set((s) => ({ studioFlipV: !s.studioFlipV }));
      },
      cycleCrop: () => {
        get().pushStudioHistory();
        set((s) => {
          const steps = [1, 1.25, 1.5, 1.75];
          const idx = steps.indexOf(s.studioCrop);
          const next = steps[(idx + 1) % steps.length] ?? 1;
          return { studioCrop: next };
        });
      },
      cycleRatio: () => {
        get().pushStudioHistory();
        set((s) => {
          const steps = ["9/16", "4/5", "1/1", "5/4", "4/3"];
          const idx = steps.indexOf(s.studioRatio);
          const next = steps[(idx + 1) % steps.length] ?? "9/16";
          return { studioRatio: next };
        });
      },
      addStudioText: () => {
        get().pushStudioHistory();
        set((s) => {
          const id = Date.now();
          const t = {
            id,
            text: "텍스트 입력",
            x: 50,
            y: 50,
            size: 28,
            font: "var(--font-noto-kr), 'Noto Sans KR', system-ui, sans-serif",
            color: "#FFFFFF",
          };
          return {
            studioTexts: [...s.studioTexts, t],
            studioActiveTextId: id,
            studioSelectedLayerKey: `text-${id}`,
          };
        });
      },
      updateStudioText: (id, patch) =>
        set((s) => ({
          studioTexts: s.studioTexts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeStudioText: (id) => {
        get().pushStudioHistory();
        set((s) => ({
          studioTexts: s.studioTexts.filter((t) => t.id !== id),
          studioActiveTextId: s.studioActiveTextId === id ? null : s.studioActiveTextId,
          studioSelectedLayerKey:
            s.studioSelectedLayerKey === `text-${id}` ? null : s.studioSelectedLayerKey,
        }));
      },
      setActiveStudioText: (id) =>
        set({
          studioActiveTextId: id,
          studioSelectedLayerKey: id != null ? `text-${id}` : null,
        }),
      setStudioSelectedLayer: (key) =>
        set(() => {
          if (key === null) return { studioSelectedLayerKey: null, studioActiveTextId: null };
          if (key.startsWith("text-")) {
            const id = Number(key.slice(5));
            return { studioSelectedLayerKey: key, studioActiveTextId: id };
          }
          return { studioSelectedLayerKey: key, studioActiveTextId: null };
        }),
      setStudioTextSubmenu: (m) => set({ studioTextSubmenu: m }),
      setStudioEyedropperActive: (on) => set({ studioEyedropperActive: on }),
      setStudioLayerPanelOpen: (open) => set({ studioLayerPanelOpen: open }),
      toggleStudioLayerPanel: () =>
        set((s) => ({ studioLayerPanelOpen: !s.studioLayerPanelOpen })),
      toggleLayerVisibility: (key) =>
        set((s) => {
          const next = { ...s.studioHiddenLayers };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { studioHiddenLayers: next };
        }),
      toggleLayerLock: (key) =>
        set((s) => {
          const next = { ...s.studioLockedLayers };
          if (next[key]) delete next[key];
          else next[key] = true;
          return { studioLockedLayers: next };
        }),
      setLayerName: (key, name) =>
        set((s) => {
          const next = { ...s.studioLayerNames };
          if (name.trim() === "") delete next[key];
          else next[key] = name;
          return { studioLayerNames: next };
        }),
      reorderStudioText: (id, dir) => {
        get().pushStudioHistory();
        set((s) => {
          const arr = [...s.studioTexts];
          const idx = arr.findIndex((t) => t.id === id);
          if (idx === -1) return s;
          const target = dir === "up" ? idx + 1 : idx - 1;
          if (target < 0 || target >= arr.length) return s;
          const tmp = arr[idx]!;
          arr[idx] = arr[target]!;
          arr[target] = tmp;
          return { studioTexts: arr };
        });
      },
      reorderSticker: (id, dir) => {
        get().pushStudioHistory();
        set((s) => {
          const arr = [...s.placedStickers];
          const idx = arr.findIndex((p) => p.id === id);
          if (idx === -1) return s;
          const target = dir === "up" ? idx + 1 : idx - 1;
          if (target < 0 || target >= arr.length) return s;
          const tmp = arr[idx]!;
          arr[idx] = arr[target]!;
          arr[target] = tmp;
          return { placedStickers: arr };
        });
      },
      moveStudioTextTo: (id, toIndex) => {
        get().pushStudioHistory();
        set((s) => {
          const arr = [...s.studioTexts];
          const fromIdx = arr.findIndex((t) => t.id === id);
          if (fromIdx === -1) return s;
          const target = Math.max(0, Math.min(arr.length - 1, toIndex));
          if (target === fromIdx) return s;
          const [item] = arr.splice(fromIdx, 1);
          arr.splice(target, 0, item!);
          return { studioTexts: arr };
        });
      },
      movePlacedStickerTo: (id, toIndex) => {
        get().pushStudioHistory();
        set((s) => {
          const arr = [...s.placedStickers];
          const fromIdx = arr.findIndex((p) => p.id === id);
          if (fromIdx === -1) return s;
          const target = Math.max(0, Math.min(arr.length - 1, toIndex));
          if (target === fromIdx) return s;
          const [item] = arr.splice(fromIdx, 1);
          arr.splice(target, 0, item!);
          return { placedStickers: arr };
        });
      },
      setLayerOpacity: (key, value) =>
        set((s) => {
          const v = Math.max(0, Math.min(100, Math.round(value)));
          return { studioLayerOpacities: { ...s.studioLayerOpacities, [key]: v } };
        }),
      setStudioDesignSubmenu: (m) => set({ studioDesignSubmenu: m }),
      setStudioLayoutId: (id) => {
        get().pushStudioHistory();
        set({ studioLayoutId: id });
      },
      applyStudioTheme: (bg) => {
        // 레거시 — 일부 호출부가 여전히 배경 교체 방식의 테마를 사용할 수 있음.
        // 새 기능은 setStudioThemeOverlay를 사용해서 배경을 보존한 채 위에 얹을 것.
        get().pushStudioHistory();
        set({
          studioBackground: bg,
          studioRotate: 0,
          studioFlipH: false,
          studioFlipV: false,
          studioCrop: 1,
          studioCropMode: false,
        });
      },
      setStudioThemeOverlay: (overlay) => {
        get().pushStudioHistory();
        set({ studioThemeOverlay: overlay });
      },
      setStudioCardData: (patch) =>
        set((s) => ({ studioCardData: { ...s.studioCardData, ...patch } })),
      loadNextStudioRecord: () => {
        // userRecords + archiveRecords 머지본 사용 — 사용자가 직접입력/타사앱연동/
        // 캡쳐스캔으로 저장한 기록도 스튜디오에서 동등하게 불러올 수 있도록 함.
        // userRecords가 우선 (같은 날짜면 사용자 기록을 사용).
        const merged = { ...archiveRecords, ...get().userRecords };
        const entries = Object.entries(merged).sort(([a], [b]) => (a < b ? 1 : -1));
        if (entries.length === 0) return null;
        get().pushStudioHistory();
        const cur = get().studioRecordIdx;
        const next = (cur + 1) % entries.length;
        const [date, rec] = entries[next]!;
        set((s) => ({
          studioRecordIdx: next,
          studioCardData: {
            ...s.studioCardData,
            distance: rec.dist,
            pace: rec.pace,
          },
        }));
        return date;
      },
      loadStudioRecord: (date) => {
        // userRecords 우선 → archiveRecords fallback.
        // 같은 날짜에 둘 다 있으면 사용자가 직접 저장한 기록을 사용.
        const userRec = get().userRecords[date];
        const rec = userRec || archiveRecords[date];
        if (!rec) return;
        get().pushStudioHistory();
        set((s) => ({
          studioCardData: {
            ...s.studioCardData,
            distance: rec.dist,
            pace: rec.pace,
          },
        }));
      },
      setStudioRecordPickerOpen: (open) => set({ studioRecordPickerOpen: open }),
      setStudioStylePickerOpen: (open) => set({ studioStylePickerOpen: open }),
      applyStudioStyle: (style) => {
        // 스타일의 모든 정보(배경·제목·거리·통계)를 스튜디오 카드에 한 번에 적용.
        // 적용 후 사용자는 텍스트를 클릭해서 그대로 수정할 수 있음 (기존 EditableText 동작).
        get().pushStudioHistory();
        const stats = style.stats || [];
        // StyleCard의 stats는 자유 형식. 표준 매핑:
        //   0 → time, 1 → pace, 2 → calories
        // 나머지는 무시 (스튜디오 카드는 4개 필드만 노출 — bubble은 별도).
        const get0 = (i: number) => (stats[i]?.v ?? "").toString();
        set((s) => ({
          studioBackground: style.bg || s.studioBackground,
          studioRotate: 0,
          studioFlipH: false,
          studioFlipV: false,
          studioCrop: 1,
          studioCropMode: false,
          studioCardData: {
            ...s.studioCardData,
            weekTitle: style.title || s.studioCardData.weekTitle,
            distance: style.dist || s.studioCardData.distance,
            time: get0(0) || s.studioCardData.time,
            pace: get0(1) || s.studioCardData.pace,
            calories: get0(2) || s.studioCardData.calories,
          },
        }));
      },
      updatePlacedSticker: (id, patch) =>
        set((s) => ({
          placedStickers: s.placedStickers.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        })),
      setStudioStatsOffset: (x, y) => set({ studioStatsOffset: { x, y } }),
      pushStudioHistory: () =>
        set((s) => {
          const snap: StudioSnapshot = {
            studioBackground: s.studioBackground,
            studioRotate: s.studioRotate,
            studioFlipH: s.studioFlipH,
            studioFlipV: s.studioFlipV,
            studioCrop: s.studioCrop,
            studioRatio: s.studioRatio,
            studioTexts: s.studioTexts.map((t) => ({ ...t })),
            placedStickers: s.placedStickers.map((p) => ({ ...p })),
          };
          const next = [...s.studioHistory, snap];
          if (next.length > 50) next.shift();
          return { studioHistory: next, studioFuture: [] };
        }),
      studioUndo: () =>
        set((s) => {
          if (s.studioHistory.length === 0) return s;
          const past = s.studioHistory.slice(0, -1);
          const target = s.studioHistory[s.studioHistory.length - 1]!;
          const current: StudioSnapshot = {
            studioBackground: s.studioBackground,
            studioRotate: s.studioRotate,
            studioFlipH: s.studioFlipH,
            studioFlipV: s.studioFlipV,
            studioCrop: s.studioCrop,
            studioRatio: s.studioRatio,
            studioTexts: s.studioTexts.map((t) => ({ ...t })),
            placedStickers: s.placedStickers.map((p) => ({ ...p })),
          };
          return {
            ...target,
            studioHistory: past,
            studioFuture: [...s.studioFuture, current],
          };
        }),
      studioRedo: () =>
        set((s) => {
          if (s.studioFuture.length === 0) return s;
          const future = s.studioFuture.slice(0, -1);
          const target = s.studioFuture[s.studioFuture.length - 1]!;
          const current: StudioSnapshot = {
            studioBackground: s.studioBackground,
            studioRotate: s.studioRotate,
            studioFlipH: s.studioFlipH,
            studioFlipV: s.studioFlipV,
            studioCrop: s.studioCrop,
            studioRatio: s.studioRatio,
            studioTexts: s.studioTexts.map((t) => ({ ...t })),
            placedStickers: s.placedStickers.map((p) => ({ ...p })),
          };
          return {
            ...target,
            studioHistory: [...s.studioHistory, current],
            studioFuture: future,
          };
        }),
      setBgPickerTab: (t) => set({ bgPickerTab: t }),
      addSticker: (emoji) => {
        get().pushStudioHistory();
        set((s) => {
          const x = 15 + Math.random() * 60;
          const y = 15 + Math.random() * 50;
          return {
            placedStickers: [
              ...s.placedStickers,
              { id: Date.now() + Math.floor(Math.random() * 1000), emoji, x, y },
            ],
          };
        });
      },
      removeSticker: (id) => {
        get().pushStudioHistory();
        set((s) => ({
          placedStickers: s.placedStickers.filter((p) => p.id !== id),
          studioSelectedLayerKey:
            s.studioSelectedLayerKey === `sticker-${id}` ? null : s.studioSelectedLayerKey,
        }));
      },
      setArchiveMainTab: (t) => set({ archiveMainTab: t, gallerySheet: null, modal: null }),
      setArchiveView: (v) =>
        set({ archiveView: v, archiveCalExpanded: false, archiveListExpanded: null }),
      toggleCalExpanded: () => set((s) => ({ archiveCalExpanded: !s.archiveCalExpanded })),
      setCalExpanded: (v) => set({ archiveCalExpanded: v }),
      setArchiveMonth: (y, m) =>
        set({
          archiveMonth: { y, m },
          archiveSelected: null,
          archiveListExpanded: null,
          archiveListCount: 4,
        }),
      pickDate: (k) =>
        set((s) => {
          const [yStr, mStr] = k.split("-");
          const y = Number(yStr);
          const m = Number(mStr);
          const sameMonth = s.archiveMonth.y === y && s.archiveMonth.m === m;
          return {
            archiveMonth: sameMonth ? s.archiveMonth : { y, m },
            archiveSelected: s.archiveSelected === k ? null : k,
          };
        }),
      toggleListExpanded: (k) =>
        set((s) => ({
          archiveListExpanded: s.archiveListExpanded === k ? null : k,
        })),
      bumpListCount: () =>
        set((s) => ({ archiveListCount: s.archiveListCount + 4 })),
      resetListCount: () =>
        set({ archiveListCount: 4, archiveListExpanded: null }),
      addRecord: (key, rec) =>
        set((s) => ({
          userRecords: { ...s.userRecords, [key]: rec },
        })),
      deleteUserRecord: (key) =>
        set((s) => {
          if (!(key in s.userRecords)) return s;
          const next = { ...s.userRecords };
          delete next[key];
          return { userRecords: next };
        }),
      mergeRecords: (records) =>
        set((s) => ({
          userRecords: { ...s.userRecords, ...records },
        })),
      setPendingScanData: (d) => set({ pendingScanData: d }),
      consumePendingScanData: () => {
        const cur = get().pendingScanData;
        if (cur) set({ pendingScanData: null });
        return cur;
      },
      setGalleryFilter: (p) =>
        set((s) => ({
          galleryFilter: { ...s.galleryFilter, ...p },
        })),
      setGallerySheet: (s) =>
        set({ gallerySheet: s, modal: s ? "gallerySheet" : null }),
      setStyleSubTab: (t) => set({ styleSubTab: t }),
      removeSavedStyle: (id) =>
        set((s) =>
          s.removedSavedStyleIds.includes(id)
            ? s
            : { removedSavedStyleIds: [...s.removedSavedStyleIds, id] },
        ),
      restoreSavedStyle: (id) =>
        set((s) => ({
          removedSavedStyleIds: s.removedSavedStyleIds.filter((x) => x !== id),
        })),
      addUserSavedStyle: (style) =>
        set((s) => {
          const exists = s.userSavedStyles.some((x) => x.id === style.id);
          const nextStyles = exists
            ? s.userSavedStyles.map((x) => (x.id === style.id ? style : x))
            : [style, ...s.userSavedStyles];
          return {
            userSavedStyles: nextStyles,
            removedSavedStyleIds: s.removedSavedStyleIds.filter((x) => x !== style.id),
          };
        }),
      setCommunityTab: (t) => set({ communityTab: t }),
      connectPartner: (id) =>
        set((s) => ({
          connectedPartners: s.connectedPartners.includes(id)
            ? s.connectedPartners
            : [...s.connectedPartners, id],
        })),
      togglePostSaved: (id) => {
        const key = String(id);
        const next = !get().savedPosts[key];
        set((s) => ({ savedPosts: { ...s.savedPosts, [key]: next } }));
        return next;
      },
      setComposeSelectedCardId: (id) => set({ composeSelectedCardId: id }),
      setBestMetric: (m) => set({ bestMetric: m }),
      setAIStep: (s) => set({ aiStep: s }),
      pushAIMessage: (m) =>
        set((s) => ({ aiMessages: [...s.aiMessages, m] })),
      setAISummary: (s) => set({ aiSummary: s }),
      resetAI: () =>
        set({
          aiStep: "intro",
          aiMessages: DEFAULT_AI_MESSAGES,
          aiSummary: null,
        }),
      addAIJournal: (summary) =>
        set((s) => {
          const now = new Date();
          const entry: AIJournal = {
            id: now.getTime() + Math.floor(Math.random() * 1000),
            date: todayKey(),
            savedAt: now.toISOString(),
            summary: stripHtml(summary),
          };
          return { aiJournals: [entry, ...s.aiJournals] };
        }),
      removeAIJournal: (id) =>
        set((s) => ({
          aiJournals: s.aiJournals.filter((j) => j.id !== id),
        })),
      prependInquiry: (i) =>
        set((s) => ({ inquiries: [i, ...s.inquiries] })),
    }),
    {
      name: "tracksy-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        aiJournals: s.aiJournals,
        userRecords: s.userRecords,
        removedSavedStyleIds: s.removedSavedStyleIds,
        userSavedStyles: s.userSavedStyles,
      }),
    },
  ),
);
