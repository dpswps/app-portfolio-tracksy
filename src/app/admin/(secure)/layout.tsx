import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import AdminLogoutButton from "./AdminLogoutButton";

export const metadata = {
  title: "Tracksy 관리자",
  robots: { index: false, follow: false },
};

/**
 * 관리자 레이아웃 — 좌측 사이드바 + 우측 메인.
 * 모든 /admin/* 페이지에 자동 적용.
 * 단 /admin/login 은 별도 layout 없이 자체 화면 사용 (이 layout 이 require 하면 무한 리디렉션).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-noto-kr), system-ui, sans-serif" }}>
      <aside
        style={{
          width: 220,
          background: "#1a1a2e",
          color: "#e5e7eb",
          padding: "20px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ padding: "8px 12px 18px", borderBottom: "1px solid #2d2d44" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>곽범석 관리자</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{profile.email}</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 12 }}>
          <NavLink href="/admin" label="대시보드" icon="📊" />
          <NavLink href="/admin/users" label="사용자" icon="👥" />
          <NavLink href="/admin/posts" label="커뮤니티 글" icon="💬" />
          <NavLink href="/admin/inquiries" label="문의" icon="📨" />
          <NavLink href="/admin/feedback" label="피드백" icon="📝" />
        </nav>
        <div style={{ marginTop: "auto", borderTop: "1px solid #2d2d44", paddingTop: 12 }}>
          <Link
            href="/home"
            style={{
              display: "block",
              padding: "10px 12px",
              color: "#9ca3af",
              textDecoration: "none",
              fontSize: 13,
              borderRadius: 8,
            }}
          >
            ← 일반 앱으로
          </Link>
          <AdminLogoutButton />
        </div>
      </aside>
      <main style={{ flex: 1, background: "#f7f7fb", padding: "28px 36px", overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        color: "#e5e7eb",
        textDecoration: "none",
        fontSize: 14,
        borderRadius: 8,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
