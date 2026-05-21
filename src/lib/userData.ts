"use client";

import type { GalleryCard, StyleCard } from "@/types";
import type { AIJournal } from "@/stores/useAppStore";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import type { Json } from "@/lib/supabase/types";

// ─────────────────────────────────────────────────────────────
// Gallery cards
// ─────────────────────────────────────────────────────────────

type GalleryRow = {
  id: string;
  user_id: string;
  year: number;
  month: number;
  date_label: string;
  title: string | null;
  dist: string | null;
  pace: string | null;
  time: string | null;
  kcal: number | null;
  elev: string | null;
  bpm: number | null;
  cadence: number | null;
  likes: number;
  comments: number;
  bg: string;
  snapshot: unknown;
  created_at: string;
};

function galleryRowToCard(row: GalleryRow): GalleryCard {
  return {
    id: hashToNumber(row.id),
    y: row.year,
    m: row.month,
    date: row.date_label,
    title: row.title ?? "",
    dist: row.dist ?? "",
    pace: row.pace ?? "",
    time: row.time ?? "",
    kcal: row.kcal ?? 0,
    elev: row.elev ?? "",
    bpm: row.bpm ?? 0,
    cadence: row.cadence ?? 0,
    likes: row.likes ?? 0,
    comments: row.comments ?? 0,
    bg: row.bg,
    snapshot: (row.snapshot as GalleryCard["snapshot"]) ?? undefined,
  };
}

// UUID 를 클라이언트 numeric id 로 매핑 (Zustand 가 number id 사용)
const idMap = new Map<number, string>();
function hashToNumber(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) >>> 0;
  idMap.set(h, uuid);
  return h;
}
export function getUuidFromNumberId(n: number): string | undefined {
  return idMap.get(n);
}

export async function fetchGalleryCards(): Promise<GalleryCard[]> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from("gallery_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as GalleryRow[]).map(galleryRowToCard);
}

export async function insertGalleryCard(card: GalleryCard): Promise<string> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  // snapshot 안에 dataURL bg/themeOverlay 가 있으면 Storage 로 옮김.
  let snapshot = card.snapshot;
  if (snapshot) {
    snapshot = await persistSnapshotImages(snapshot);
  }

  const { data, error } = await sb
    .from("gallery_cards")
    .insert({
      user_id: user.id,
      year: card.y,
      month: card.m,
      date_label: card.date,
      title: card.title || null,
      dist: card.dist || null,
      pace: card.pace || null,
      time: card.time || null,
      kcal: card.kcal || null,
      elev: card.elev || null,
      bpm: card.bpm || null,
      cadence: card.cadence || null,
      likes: card.likes ?? 0,
      comments: card.comments ?? 0,
      bg: card.bg,
      snapshot: (snapshot as unknown as Json) ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function deleteGalleryCard(numericId: number): Promise<void> {
  const sb = getSupabaseBrowser();
  const uuid = idMap.get(numericId);
  if (!uuid) return; // not from server
  const { error } = await sb.from("gallery_cards").delete().eq("id", uuid);
  if (error) throw error;
}

async function persistSnapshotImages(snap: GalleryCard["snapshot"]): Promise<GalleryCard["snapshot"]> {
  if (!snap) return snap;
  const next: NonNullable<GalleryCard["snapshot"]> = { ...snap };
  if (next.bg && next.bg.startsWith("data:")) {
    try {
      next.bg = await uploadImage("gallery-cards", next.bg, { prefix: "bg" });
    } catch (err) {
      console.warn("[gallery] bg upload failed", err);
    }
  }
  if (next.themeOverlay && next.themeOverlay.startsWith("data:")) {
    try {
      next.themeOverlay = await uploadImage("gallery-cards", next.themeOverlay, { prefix: "overlay" });
    } catch (err) {
      console.warn("[gallery] overlay upload failed", err);
    }
  }
  return next;
}

// ─────────────────────────────────────────────────────────────
// Saved styles
// ─────────────────────────────────────────────────────────────

type StyleRow = {
  id: string;
  user_id: string;
  kind: "saved" | "mine";
  source_id: string | null;
  payload: StyleCard;
  created_at: string;
};

export async function fetchStyles(): Promise<{ saved: StyleCard[]; mine: StyleCard[] }> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { saved: [], mine: [] };
  const { data, error } = await sb
    .from("saved_styles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as StyleRow[];
  return {
    saved: rows.filter((r) => r.kind === "saved").map((r) => r.payload),
    mine: rows.filter((r) => r.kind === "mine").map((r) => r.payload),
  };
}

export async function insertStyle(kind: "saved" | "mine", style: StyleCard, sourceId?: string) {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");
  const { error } = await sb.from("saved_styles").insert({
    user_id: user.id,
    kind,
    source_id: sourceId ?? null,
    payload: style as unknown as Json,
  });
  if (error) throw error;
}

export async function deleteStyleByPayloadId(id: string) {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  // payload->>'id' 비교
  const { error } = await sb
    .from("saved_styles")
    .delete()
    .eq("user_id", user.id)
    .filter("payload->>id", "eq", id);
  if (error) console.warn("[styles] delete failed", error);
}

// ─────────────────────────────────────────────────────────────
// AI journals
// ─────────────────────────────────────────────────────────────

type JournalRow = {
  id: string;
  user_id: string;
  date: string;
  saved_at: string;
  summary: string;
};

const journalIdMap = new Map<number, string>();
function journalHashToNumber(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) >>> 0;
  journalIdMap.set(h, uuid);
  return h;
}

export async function fetchJournals(): Promise<AIJournal[]> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];
  const { data, error } = await sb
    .from("ai_journals")
    .select("*")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });
  if (error) throw error;
  return (data as JournalRow[]).map((r) => ({
    id: journalHashToNumber(r.id),
    date: r.date,
    savedAt: r.saved_at,
    summary: r.summary,
  }));
}

export async function insertJournal(j: Omit<AIJournal, "id">): Promise<void> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");
  const { error } = await sb.from("ai_journals").insert({
    user_id: user.id,
    date: j.date,
    saved_at: j.savedAt,
    summary: j.summary,
  });
  if (error) throw error;
}

export async function deleteJournalByNumericId(numericId: number): Promise<void> {
  const sb = getSupabaseBrowser();
  const uuid = journalIdMap.get(numericId);
  if (!uuid) return;
  const { error } = await sb.from("ai_journals").delete().eq("id", uuid);
  if (error) throw error;
}
