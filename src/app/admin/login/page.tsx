"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signInWithPassword } from "@/lib/supabase/auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

function AdminLoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const errorParam = params?.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === "not_admin" ? "관리자 권한이 없는 계정입니다." : null,
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signInWithPassword({ email, password });
      // is_admin 검증
      const sb = getSupabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setError("로그인에 실패했어요");
        setBusy(false);
        return;
      }
      const { data: profile } = await sb
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.is_admin) {
        setError("관리자 권한이 없는 계정입니다.");
        // 일반 사용자가 잘못 들어온 거니까 세션은 유지 (그냥 일반 앱으로 보낼지는 정책).
        setBusy(false);
        return;
      }
      router.replace("/admin");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        msg.includes("Invalid login credentials")
          ? "이메일 또는 비밀번호가 올바르지 않아요"
          : msg,
      );
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d4a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "var(--font-noto-kr), system-ui, sans-serif",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Tracksy 관리자</h1>
        <p style={{ marginTop: 6, color: "#666", fontSize: 13 }}>운영자 로그인</p>

        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={busy}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #e5e5e5",
              fontSize: 15,
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={busy}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #e5e5e5",
              fontSize: 15,
              outline: "none",
            }}
          />
          {error && (
            <div
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "12px",
              borderRadius: 10,
              background: "#1a1a2e",
              color: "#fff",
              border: 0,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "로그인 중…" : "관리자 로그인"}
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: "#888", textAlign: "center" }}>
          일반 사용자는 <a href="/login" style={{ color: "#7C5CFF" }}>여기</a>로
        </p>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#1a1a2e" }} />}>
      <AdminLoginContent />
    </Suspense>
  );
}
