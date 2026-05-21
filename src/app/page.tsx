"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * 접속(스플래시) 페이지.
 *
 * 동작:
 *   - 약 3초 뒤 자동 라우팅. 그 사이 Supabase 세션을 확인.
 *   - 세션 있음 + profile.has_onboarded=true → /home
 *   - 세션 있음 + has_onboarded=false → /signup (정보 입력 미완료)
 *   - 세션 없음 → /login
 *   - Supabase 미설정 / 오류 → Zustand 의 hasOnboarded 기반 fallback
 */
export default function SplashPage() {
  const router = useRouter();
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  useEffect(() => {
    let cancelled = false;
    let target: string | null = null;

    async function decide() {
      try {
        const sb = getSupabaseBrowser();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return "/login";
        const { data: profile } = await sb
          .from("profiles")
          .select("has_onboarded")
          .eq("id", user.id)
          .maybeSingle();
        return profile?.has_onboarded ? "/home" : "/signup";
      } catch {
        return hasOnboarded ? "/home" : "/login";
      }
    }

    decide().then((to) => {
      if (!cancelled) target = to;
    });

    const tid = window.setTimeout(() => {
      router.replace(target ?? (hasOnboarded ? "/home" : "/login"));
    }, 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
    };
  }, [router, hasOnboarded]);

  return (
    <section className="splash">
      <div className="splash-character">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/start_cha_big.png"
          alt="TRACKSY 캐릭터"
          className="splash-character-img"
          draggable={false}
        />
      </div>
      <h1 className="splash-title">TRACKSY</h1>
      <p className="splash-sub">오늘의 러닝을, 나만의 이야기로</p>
    </section>
  );
}
