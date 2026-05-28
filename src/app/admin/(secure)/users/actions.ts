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
  return { ok: true as const, userId: user.id };
}

export async function toggleAdminAction(targetUserId: string, value: boolean) {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("profiles").update({ is_admin: value }).eq("id", targetUserId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(targetUserId: string) {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };
  // 자기 자신은 삭제 금지 (실수 방지).
  if (auth.userId === targetUserId) {
    return { ok: false, error: "자기 자신은 삭제할 수 없습니다" };
  }
  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
