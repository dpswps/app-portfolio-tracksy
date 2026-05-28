"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";
import { signUpWithPassword, signInWithPassword, upsertProfile } from "@/lib/supabase/auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

function SignupContent() {
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useAppStore((s) => s.setUser);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const showToast = useAppStore((s) => s.showToast);

  /** ?social=1 로 들어왔으면 OAuth 콜백 후 정보 입력 모드.
   *  이메일·비밀번호 필드 숨김 (이미 OAuth 로 인증돼있음). */
  const isSocial = params?.get("social") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [style, setStyle] = useState("산책/러닝");
  const [busy, setBusy] = useState(false);

  // 소셜 로그인 사용자의 이름·이메일을 OAuth metadata 에서 미리 채워줌.
  useEffect(() => {
    if (!isSocial) return;
    const sb = getSupabaseBrowser();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const meta = user.user_metadata ?? {};
      const candidate =
        (typeof meta.name === "string" && meta.name) ||
        (typeof meta.full_name === "string" && meta.full_name) ||
        (typeof meta.preferred_username === "string" && meta.preferred_username) ||
        "";
      if (candidate && !name) setName(candidate);
      if (user.email && !email) setEmail(user.email);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSocial]);

  const submit = async () => {
    if (busy) return;
    if (!isSocial) {
      if (!email || !password) {
        showToast("이메일과 비밀번호를 입력해주세요");
        return;
      }
      if (password.length < 6) {
        showToast("비밀번호는 6자 이상이어야 해요");
        return;
      }
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
    const birthIso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    try {
      if (!isSocial) {
        // 1) 이메일+비밀번호 신규 가입.
        await signUpWithPassword({ email, password });
        const sb = getSupabaseBrowser();
        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
          await signInWithPassword({ email, password });
        }
      }

      // 소셜이든 일반 가입이든 profile 정보는 동일하게 업서트.
      await upsertProfile({
        name,
        birth: birthIso,
        // 소셜 사용자의 이메일은 OAuth 로 받은 값을 그대로 사용 (수정 안 받음).
        ...(isSocial ? {} : { email }),
        style,
        has_onboarded: true,
      });

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
        <h2>{isSocial ? "프로필 정보 입력" : "정보 입력"}</h2>
        <p className="sub">
          {isSocial
            ? "마지막 한 단계 — 추가 정보를 입력해주세요"
            : "트랙시에 등록할 내 정보를 입력하세요"}
        </p>

        {!isSocial && (
          <>
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
          </>
        )}

        {isSocial && email && (
          <div className="field">
            <label>이메일 (소셜 계정)</label>
            <input type="email" value={email} readOnly style={{ background: "#f5f5f5", color: "#888" }} />
          </div>
        )}

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
          {busy ? "생성 중…" : isSocial ? "시작하기" : "계정 만들기"}
        </button>
      </section>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<section className="signup-screen" />}>
      <SignupContent />
    </Suspense>
  );
}
