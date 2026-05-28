"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";

async function assertAdmin() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false as const, error: "로그인이 필요합니다" };
  const { data: profile } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) return { ok: false as const, error: "관리자 권한이 없습니다" };
  return { ok: true as const };
}

export async function deletePostAction(postId: string) {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("community_posts").delete().eq("id", postId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/posts");
  return { ok: true };
}
