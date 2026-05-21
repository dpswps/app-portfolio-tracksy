import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Supabase OAuth 콜백 — provider(카카오/구글 등) 인증 완료 후 돌아오는 경로.
 *
 * 흐름:
 *   1) 사용자가 /login → 카카오 OAuth 버튼 클릭
 *   2) Supabase Auth 가 카카오 로그인 페이지로 보냄
 *   3) 카카오에서 동의 → Supabase 가 우리 도메인의 /auth/callback?code=... 로 리디렉션
 *   4) 여기서 exchangeCodeForSession 으로 세션 쿠키 굽고 /home 으로 보냄
 *
 * 신규 가입자(처음 로그인하는 카카오 사용자) 는 handle_new_user 트리거가
 * profiles 행을 자동 생성. has_onboarded=false 이므로 스플래시가 /signup 으로
 * 보내야 정상인데, 카카오/구글 로그인은 이미 이름·이메일을 받았으므로
 * 자동으로 has_onboarded=true 로 설정하고 /home 으로 보내도 OK.
 * 정책에 따라 신규는 /signup 으로 보내는 게 더 안전하므로 이쪽을 기본값으로.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/home";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const sb = await getSupabaseServer();
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  // 신규/기존 분기. profile.has_onboarded 가 false 면 정보 입력으로.
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const { data: profile } = await sb
      .from("profiles")
      .select("has_onboarded")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.has_onboarded) {
      return NextResponse.redirect(new URL("/signup?social=1", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
