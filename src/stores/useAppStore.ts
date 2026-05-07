"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ArchiveRecords, Inquiry, RunningRecord } from "@/types";
import type { AIMessage, AIStep } from "@/types";

type Modal = "gallerySheet" | "monthPicker" | null;
type GallerySheetKind = "year" | "month" | null;

export type AIJournal = {
  id: number;
  /** YYYY-MM-DD */
  date: string;
  /** ISO timestamp */
  savedAt: string;
  /** Plain text (no HTML) one-line summary */
  summary: string;
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
  studioPanelOpen: boolean;
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

  /** Style cards that the user removed from "저장한 스타일" tab via bookmark click */
  removedSavedStyleIds: string[];

  communityTab: "hot" | "new";

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
  setStudioPanelOpen: (open: boolean) => void;
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
  removeSavedStyle: (id: string) => void;
  restoreSavedStyle: (id: string) => void;
  setCommunityTab: (t: State["communityTab"]) => void;
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
    (set) => ({
      user: {
        name: "김러너",
        birth: "2000.01.01",
        email: "tracksy1@gmail.com",
        style: "산책/러닝",
      },

      modal: null,
      toast: null,

      studioTab: "edit",
      studioPanelOpen: true,
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

      removedSavedStyleIds: [],

      communityTab: "hot",

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

      setStudioTab: (t) => set({ studioTab: t, studioPanelOpen: true }),
      setStudioPanelOpen: (open) => set({ studioPanelOpen: open }),
      setBgPickerTab: (t) => set({ bgPickerTab: t }),

      addSticker: (emoji) =>
        set((s) => {
          const x = 15 + Math.random() * 60;
          const y = 15 + Math.random() * 50;
          return {
            placedStickers: [
              ...s.placedStickers,
              { id: Date.now() + Math.floor(Math.random() * 1000), emoji, x, y },
            ],
          };
        }),

      removeSticker: (id) =>
        set((s) => ({
          placedStickers: s.placedStickers.filter((p) => p.id !== id),
        })),

      setArchiveMainTab: (t) =>
        set({ archiveMainTab: t, gallerySheet: null, modal: null }),

      setArchiveView: (v) =>
        set({
          archiveView: v,
          archiveCalExpanded: false,
          archiveListExpanded: null,
        }),

      toggleCalExpanded: () =>
        set((s) => ({ archiveCalExpanded: !s.archiveCalExpanded })),

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

      setCommunityTab: (t) => set({ communityTab: t }),

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
      }),
    },
  ),
);
