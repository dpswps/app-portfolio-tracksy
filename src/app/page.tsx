"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

/**
 * 접속(스플래시) 페이지.
 *
 * 동작:
 *   - 페이지 진입 후 약 3초 뒤 자동 라우팅.
 *   - hasOnboarded === true → /home (이미 signup 완료한 사용자)
 *   - 그 외(처음 켜는 사용자) → /login
 *
 * UI:
 *   - 전체 배경: public/bg_cover.png (cover 로 모바일 화면 가득)
 *   - 중앙 캐릭터: public/start_cha.png (약 117×149px)
 *   - 캐릭터 아래: "TRACKSY" (Pretendard 900, #000, 20pt) + 서브카피
 *   - 하단 "시작하기" 버튼 제거됨 — 자동 라우팅으로 대체.
 *
 * 기존 페이지 전환 로직(/login → /signup → /home) 자체는 그대로 유지.
 * 스플래시가 어디로 보낼지만 hasOnboarded 로 분기.
 */
export default function SplashPage() {
  const router = useRouter();
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  useEffect(() => {
    // 약 3초 뒤 라우팅. router.replace 로 스플래시가 뒤로가기 스택에 남지 않게.
    const tid = window.setTimeout(() => {
      router.replace(hasOnboarded ? "/home" : "/login");
    }, 3000);
    return () => window.clearTimeout(tid);
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
