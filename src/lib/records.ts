"use client";

import type { RunningRecord, RunningSplit } from "@/types";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";

/** DB row → 클라이언트 RunningRecord */
type DbRecord = {
  id: string;
  user_id: string;
  date: string;
  dist: string | null;
  pace: string | null;
  bpm: number | null;
  time: string | null;
  note: string | null;
  elev: string | null;
  cadence: number | null;
  kcal: number | null;
  screenshot_url: string | null;
};

type DbSplit = {
  id: string;
  record_id: string;
  idx: number;
  km: number | string | null;
  time: string | null;
  pace: string | null;
  bpm: number | null;
};

function rowToRecord(row: DbRecord, splits: RunningSplit[] = []): RunningRecord {
  const rec: RunningRecord = {
    dist: row.dist ?? "",
    pace: row.pace ?? "",
  };
  if (row.bpm != null) rec.bpm = row.bpm;
  if (row.time) rec.time = row.time;
  if (row.note) rec.note = row.note;
  if (row.elev) rec.elev = row.elev;
  if (row.cadence != null) rec.cadence = row.cadence;
  if (row.kcal != null) rec.kcal = row.kcal;
  if (row.screenshot_url) rec.screenshot = row.screenshot_url;
  if (splits.length) rec.splits = splits;
  return rec;
}

function splitsByRecord(rows: DbSplit[]): Record<string, RunningSplit[]> {
  const out: Record<string, RunningSplit[]> = {};
  for (const s of rows) {
    if (!out[s.record_id]) out[s.record_id] = [];
    out[s.record_id].push({
      km: typeof s.km === "string" ? parseFloat(s.km) : (s.km ?? 0),
      time: s.time ?? undefined,
      pace: s.pace ?? undefined,
      bpm: s.bpm ?? undefined,
    });
  }
  // idx 보존 — 입력 순서대로 정렬
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => {
      // idx 정보 없으니 입력 순서 유지 (Supabase order로 보장)
      return 0;
    });
  }
  return out;
}

/** 현재 로그인 사용자의 모든 러닝 기록을 Map<dateKey, RunningRecord> 로 가져옴. */
export async function fetchAllRecords(): Promise<Record<string, RunningRecord>> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return {};

  const { data: records, error } = await sb
    .from("running_records")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });
  if (error) throw error;
  if (!records || records.length === 0) return {};

  const ids = records.map((r) => r.id);
  const { data: splits } = await sb
    .from("running_splits")
    .select("*")
    .in("record_id", ids)
    .order("idx", { ascending: true });

  const sMap = splitsByRecord((splits ?? []) as DbSplit[]);
  const out: Record<string, RunningRecord> = {};
  for (const r of records as DbRecord[]) {
    out[r.date] = rowToRecord(r, sMap[r.id] ?? []);
  }
  return out;
}

/**
 * 기록 1개를 upsert. (user_id, date) unique 라서 같은 날짜 두번 저장 시 update.
 * splits 가 있으면 기존 splits 삭제 후 재삽입.
 * 반환: 저장된 record id (caller 가 splits 등 후속 작업 시 사용).
 */
export async function upsertRecord(
  dateKey: string,
  rec: RunningRecord,
): Promise<string> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  // 스크린샷이 dataURL 이면 Storage 에 업로드 → 공개 URL 로 치환.
  let screenshotUrl: string | null = null;
  if (rec.screenshot) {
    if (rec.screenshot.startsWith("data:")) {
      try {
        screenshotUrl = await uploadImage("screenshots", rec.screenshot, {
          prefix: dateKey,
        });
      } catch (err) {
        console.warn("[records] screenshot upload failed, skipping image:", err);
        screenshotUrl = null;
      }
    } else {
      screenshotUrl = rec.screenshot;
    }
  }

  const payload = {
    user_id: user.id,
    date: dateKey,
    dist: rec.dist ?? null,
    pace: rec.pace ?? null,
    bpm: rec.bpm ?? null,
    time: rec.time ?? null,
    note: rec.note ?? null,
    elev: rec.elev ?? null,
    cadence: rec.cadence ?? null,
    kcal: rec.kcal ?? null,
    screenshot_url: screenshotUrl,
  };

  const { data, error } = await sb
    .from("running_records")
    .upsert(payload, { onConflict: "user_id,date" })
    .select("id")
    .single();
  if (error) throw error;

  const recordId = (data as { id: string }).id;

  // splits 동기화 — 기존 다 지우고 새로 삽입.
  if (rec.splits && rec.splits.length > 0) {
    await sb.from("running_splits").delete().eq("record_id", recordId);
    const splitRows = rec.splits.map((s, i) => ({
      record_id: recordId,
      idx: i,
      km: s.km,
      time: s.time ?? null,
      pace: s.pace ?? null,
      bpm: s.bpm ?? null,
    }));
    const { error: sErr } = await sb.from("running_splits").insert(splitRows);
    if (sErr) throw sErr;
  }

  return recordId;
}

/** dateKey 로 기록 삭제. cascade로 splits 도 같이 삭제됨. */
export async function deleteRecordByDate(dateKey: string): Promise<void> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");
  const { error } = await sb
    .from("running_records")
    .delete()
    .eq("user_id", user.id)
    .eq("date", dateKey);
  if (error) throw error;
}

/**
 * localStorage 의 기존 userRecords 를 Supabase 로 마이그레이션.
 * 한 번만 실행 → migrated 마커 저장.
 */
export async function migrateLocalRecordsToSupabase(
  localRecords: Record<string, RunningRecord>,
): Promise<number> {
  if (typeof window !== "undefined" && localStorage.getItem("tracksy-records-migrated") === "1") {
    return 0;
  }
  const entries = Object.entries(localRecords);
  let count = 0;
  for (const [key, rec] of entries) {
    try {
      await upsertRecord(key, rec);
      count++;
    } catch (err) {
      console.warn("[migrate] record skip", key, err);
    }
  }
  if (typeof window !== "undefined") {
    localStorage.setItem("tracksy-records-migrated", "1");
  }
  return count;
}
