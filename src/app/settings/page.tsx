"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";
import { signOut } from "@/lib/supabase/auth";

export default function SettingsPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setUser = useAppStore((s) => s.setUser);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      // 무시 — 로컬 상태는 어차피 비우니까
    }
    setUser({ name: "", birth: "", email: "", style: "" });
    setOnboarded(false);
    showToast("로그아웃 되었어요");
    router.replace("/login");
  };

  const handleWithdraw = async () => {
    if (withdrawBusy) return;
    setWithdrawBusy(true);
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: withdrawReason }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(`탈퇴 실패: ${json.error ?? "잠시 후 다시 시도해주세요"}`);
        setWithdrawBusy(false);
        return;
      }
      // 서버에서 사용자 삭제 완료 — 클라이언트 세션도 정리.
      try {
        await signOut();
      } catch {}
      setUser({ name: "", birth: "", email: "", style: "" });
      setOnboarded(false);
      showToast("탈퇴가 완료되었어요. 그동안 이용해주셔서 감사합니다.");
      setTimeout(() => router.replace("/login"), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`오류: ${msg}`);
      setWithdrawBusy(false);
    }
  };

  return (
    <>
      <AppHeader title="설정" fallback="/home" />
      <section className="settings-screen">
        <div className="settings-section">
          <h3>파트너 앱</h3>
          <Link href="/partners" className="partner-cta" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            파트너 APP 기록 가져오기
          </Link>
        </div>
        <div className="settings-section">
          <h3>고객 문의</h3>
          <Link href="/inquiry" className="list-item" style={{ textDecoration: "none", color: "inherit" }}>
            <span>이용 문의하기</span>
            <span className="arrow">›</span>
          </Link>
          <Link href="/inquiry/list" className="list-item" style={{ textDecoration: "none", color: "inherit" }}>
            <span>나의 문의내역</span>
            <span className="arrow">›</span>
          </Link>
          <Link href="/feedback" className="list-item" style={{ textDecoration: "none", color: "inherit" }}>
            <span>개선사항 보내기</span>
            <span className="arrow">›</span>
          </Link>
        </div>
        <div className="settings-section">
          <h3>약관</h3>
          <Link href="/terms" className="list-item" style={{ textDecoration: "none", color: "inherit" }}>
            <span>이용약관</span>
            <span className="arrow">›</span>
          </Link>
          <Link href="/privacy" className="list-item" style={{ textDecoration: "none", color: "inherit" }}>
            <span>개인정보처리방침</span>
            <span className="arrow">›</span>
          </Link>
        </div>
        <div className="settings-section">
          <h3>계정</h3>
          <button
            type="button"
            onClick={handleLogout}
            className="list-item"
            style={{
              width: "100%",
              textAlign: "left",
              background: "none",
              border: 0,
              padding: "14px 16px",
              fontSize: 15,
              color: "#d33",
              cursor: "pointer",
            }}
          >
            <span>로그아웃</span>
            <span className="arrow">›</span>
          </button>
          <button
            type="button"
            onClick={() => setWithdrawOpen(true)}
            className="list-item"
            style={{
              width: "100%",
              textAlign: "left",
              background: "none",
              border: 0,
              padding: "14px 16px",
              fontSize: 15,
              color: "#999",
              cursor: "pointer",
            }}
          >
            <span>회원 탈퇴</span>
            <span className="arrow">›</span>
          </button>
        </div>
      </section>

      {withdrawOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 20,
          }}
          onClick={() => !withdrawBusy && setWithdrawOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>회원 탈퇴</h3>
            <p style={{ margin: "10px 0 16px", fontSize: 13, color: "#666", lineHeight: 1.5 }}>
              탈퇴하면 러닝 기록·갤러리 카드·AI 일지 등 모든 데이터가{" "}
              <strong style={{ color: "#d33" }}>영구적으로 삭제</strong>되며 복구할 수 없습니다.
            </p>
            <label style={{ display: "block", fontSize: 13, color: "#444", marginBottom: 6 }}>
              탈퇴 사유 (선택, 서비스 개선에 도움 됩니다)
            </label>
            <textarea
              value={withdrawReason}
              onChange={(e) => setWithdrawReason(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="어떤 점이 아쉬우셨나요?"
              disabled={withdrawBusy}
              style={{
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 10,
                fontSize: 14,
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setWithdrawOpen(false)}
                disabled={withdrawBusy}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={withdrawBusy}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: 0,
                  background: "#d33",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  opacity: withdrawBusy ? 0.6 : 1,
                }}
              >
                {withdrawBusy ? "처리 중…" : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
