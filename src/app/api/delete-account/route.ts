import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * 회원 탈퇴 — auth.users 행 삭제.
 * CASCADE 로 profiles · running_records · gallery_cards · community_posts 등
 * user_id 참조 행도 자동 삭제. Storage 객체는 별도 정리 필요할 수 있음
 * (지금은 dataURL 시절 잔존 데이터가 적어서 생략).
 *
 * 흐름:
 *   1) 현재 세션의 user id 확인 (anon 키)
 *   2) feedback 테이블에 탈퇴 사유 기록 (선택)
 *   3) service role 로 auth.admin.deleteUser
 *   4) 클라이언트는 signOut 후 /login 으로 라우팅
 */
export async function POST(req: Request) {
  try {
    const sb = await getSupabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    // 탈퇴 사유 로그 — feedback 테이블이 아직 없을 수도 있어서 best-effort.
    if (reason) {
      const { error: fbErr } = await sb.from("feedback").insert({
        user_id: user.id,
        email: user.email ?? null,
        category: "etc",
        body: `[withdraw] ${reason}`,
      });
      if (fbErr && process.env.NODE_ENV !== "production") {
        console.warn("[delete-account] feedback insert failed:", fbErr.message);
      }
    }

    // service role 로 auth.users 삭제. CASCADE 로 관련 데이터 자동 정리.
    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
