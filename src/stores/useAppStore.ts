"use client";

import { create } from "zustand";
import type { ArchiveRecords, Inquiry, RunningRecord } from "@/types";
import type { AIMessage, AIStep } from "@/types";

type Modal = "gallerySheet" | "monthPicker" | null;
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

const DEFAULT_AI_MESSAGES: AIMessage[] = [
  { from: "bot", text: "오늘 5km 뛰었네! 꽤 괜찮은데 ✨" },
  { from: "bot", text: "뛸 때 컨디션은 어땠어?" },
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
  user: { name: string; birth: string; email: string; style: string };

  modal: Modal;
  toast: string | null;

  studioTab: "edit" | "text" | "sticker" | "design";
  studioBackground: string | null;
  studioRotate: number; // 0, 90, 180, 270
  studioFlipH: boolean;
  studioFlipV: boolean;
  studioCrop: number; // 1, 1.25, 1.5, 1.75 (legacy zoom — kept for reset only)
  studioCropMode: boolean;
  studioRatio: string; // "9/16" | "4/5" | "1/1" | "5/4"
  studioTexts: Array<{
    id: number;
    text: string;
    x: number; // percent 0-100
    y: number; // percent 0-100
    size: number; // px
    font: string; // CSS font-family
    fontWeight?: number | string;
    fontStyle?: string;
    color: string; // hex
  }>;
  studioActiveTextId: number | null;
  studioTextSubmenu: "none" | "font" | "size" | "color";
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

  communityTab: "hot" | "new";

  aiStep: AIStep;
  aiMessages: AIMessage[];
  aiSummary: string | null;

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
  setGalleryFilter: (p: Partial<State["galleryFilter"]>) => void;
  setGallerySheet: (s: GallerySheetKind) => void;
  setStyleSubTab: (t: State["styleSubTab"]) => void;
  setCommunityTab: (t: State["communityTab"]) => void;
  setAIStep: (s: AIStep) => void;
  pushAIMessage: (m: AIMessage) => void;
  setAISummary: (s: string | null) => void;
  resetAI: () => void;
  prependInquiry: (i: Inquiry) => void;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useAppStore = create<State>((set, get) => ({
  user: { name: "김러너", birth: "2000.01.01", email: "tracksy1@gmail.com", style: "산책/러닝" },

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

  communityTab: "hot",

  aiStep: "intro",
  aiMessages: DEFAULT_AI_MESSAGES,
  aiSummary: null,

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
      const steps = ["9/16", "4/5", "1/1", "5/4"];
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
      return { studioTexts: [...s.studioTexts, t], studioActiveTextId: id };
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
    }));
  },
  setActiveStudioText: (id) => set({ studioActiveTextId: id }),
  setStudioTextSubmenu: (m) => set({ studioTextSubmenu: m }),
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
      // Cap history at 50 to avoid unbounded memory.
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
    set((s) => ({ placedStickers: s.placedStickers.filter((p) => p.id !== id) }));
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
    set((s) => ({ archiveListExpanded: s.archiveListExpanded === k ? null : k })),
  bumpListCount: () => set((s) => ({ archiveListCount: s.archiveListCount + 4 })),
  resetListCount: () => set({ archiveListCount: 4, archiveListExpanded: null }),
  addRecord: (key, rec) =>
    set((s) => ({ userRecords: { ...s.userRecords, [key]: rec } })),
  setGalleryFilter: (p) => set((s) => ({ galleryFilter: { ...s.galleryFilter, ...p } })),
  setGallerySheet: (kind) =>
    set({ gallerySheet: kind, modal: kind ? "gallerySheet" : null }),
  setStyleSubTab: (t) => set({ styleSubTab: t }),
  setCommunityTab: (t) => set({ communityTab: t }),
  setAIStep: (s) => set({ aiStep: s }),
  pushAIMessage: (m) => set((s) => ({ aiMessages: [...s.aiMessages, m] })),
  setAISummary: (s) => set({ aiSummary: s }),
  resetAI: () => set({ aiStep: "intro", aiMessages: DEFAULT_AI_MESSAGES, aiSummary: null }),
  prependInquiry: (i) => set((s) => ({ inquiries: [i, ...s.inquiries] })),
}));
