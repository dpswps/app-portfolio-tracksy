"use client";

import { getSupabaseBrowser } from "./client";

export type ProfileRow = {
  id: string;
  name: string | null;
  birth: string | null;
  email: string | null;
  style: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  has_onboarded: boolean;
};

/** 이메일+비밀번호 회원가입. Supabase 의 auth.users 행 생성 → 트리거가 public.profiles 행도 생성. */
export async function signUpWithPassword(args: { email: string; password: string }) {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.auth.signUp({
    email: args.email,
    password: args.password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithPassword(args: { email: string; password: string }) {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb.auth.signInWithPassword({
    email: args.email,
    password: args.password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const sb = getSupabaseBrowser();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

/** OAuth 시작 — Supabase 가 provider 페이지로 리디렉션, 콜백은 /auth/callback. */
export async function signInWithOAuth(provider: "google" | "kakao") {
  const sb = getSupabaseBrowser();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : undefined;
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) throw error;
}

/** 현재 로그인 사용자의 profile 행을 가져옴. 없으면 null. */
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

/** profile 행 부분 업데이트. signup 정보 입력 화면에서 사용. */
export async function upsertProfile(patch: Partial<Omit<ProfileRow, "id">>) {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");
  const { data, error } = await sb
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data as ProfileRow;
}
