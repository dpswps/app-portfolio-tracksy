"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";
import { signUpWithPassword, signInWithPassword, upsertProfile } from "@/lib/supabase/auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const showToast = useAppStore((s) => s.showToast);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [style, setStyle] = useState("산책/러닝");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!email || !password) {
      showToast("이메일과 비밀번호를 입력해주세요");
      return;
    }
    if (password.length < 6) {
      showToast("비밀번호는 6자 이상이어야 해요");
      return;
    }
    if (!name) {
      showToast("이름을 입력해주세요");
      return;
    }
    if (!year || !month || !day) {
      showToast("생년월일을 입력해주세요");
      return;
    }

    setBusy(true);
    const birth = `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`;
    // profiles.birth 는 date 타입이라 YYYY-MM-DD 포맷으로 변환
    const birthIso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    try {
      // 1) auth 계정 생성. 이메일 확인 OFF 라서 곧바로 세션 발급됨.
      await signUpWithPassword({ email, password });

      // 2) 세션이 즉시 활성화되지 않으면 보강 로그인.
      const sb = getSupabaseBrowser();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        await signInWithPassword({ email, password });
      }

      // 3) profiles 행 업데이트 (트리거가 만든 빈 행에 정보 채움).
      await upsertProfile({
        name,
        birth: birthIso,
        email,
        style,
        has_onboarded: true,
      });

      // 4) Zustand 동기화 — SessionProvider 가 곧 따라잡겠지만 즉시 반영.
      setUser({ name, birth, email, style });
      setOnboarded(true);
      showToast("계정이 만들어졌어요!");
      setTimeout(() => router.replace("/home"), 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already registered") || msg.includes("already exists")) {
        showToast("이미 가입된 이메일이에요. 로그인 화면에서 로그인해주세요.");
      } else {
        showToast(`가입 실패: ${msg}`);
      }
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader fallback="/login" />
      <section className="signup-screen">
        <h2>정보 입력</h2>
        <p className="sub">트랙시에 등록할 내 정보를 입력하세요</p>

        <div className="field">
          <label>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label>이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </div>

        <div className="field">
          <label>생년월일</label>
          <div className="date-row">
            <input type="text" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="년*" maxLength={4} />
            <input type="text" inputMode="numeric" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="월*" maxLength={2} />
            <input type="text" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value)} placeholder="일*" maxLength={2} />
          </div>
        </div>

        <div className="field">
          <label>선호하는 러닝 스타일</label>
          <div className="radio-row">
            <label>
              <input type="radio" name="style" value="산책/러닝" checked={style === "산책/러닝"} onChange={(e) => setStyle(e.target.value)} /> 산책/러닝
            </label>
            <label>
              <input type="radio" name="style" value="10k 미만 러닝" checked={style === "10k 미만 러닝"} onChange={(e) => setStyle(e.target.value)} /> 10k 미만 러닝
            </label>
            <label>
              <input type="radio" name="style" value="마라톤" checked={style === "마라톤"} onChange={(e) => setStyle(e.target.value)} /> 마라톤
            </label>
          </div>
        </div>

        <button className="primary-btn" onClick={submit} disabled={busy}>
          {busy ? "생성 중…" : "계정 만들기"}
        </button>
      </section>
    </>
  );
}
