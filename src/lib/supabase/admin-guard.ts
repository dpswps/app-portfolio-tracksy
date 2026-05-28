import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Server Component / Route Handler 에서 호출.
 * 현재 사용자가 admin 이 아니면 /admin/login 으로 강제 리디렉션.
 * Admin 이면 user 객체 반환.
 */
export async function requireAdmin() {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    redirect("/admin/login");
  }
  const { data: profile, error } = await sb
    .from("profiles")
    .select("id, name, email, is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !profile?.is_admin) {
    redirect("/admin/login?error=not_admin");
  }
  return { user, profile };
}

/**
 * 현재 사용자가 admin 인지 체크 (boolean 반환, redirect 없음).
 * 클라이언트 컴포넌트에서 메뉴 표시 여부 결정용.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const sb = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { data: profile } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return !!profile?.is_admin;
}
