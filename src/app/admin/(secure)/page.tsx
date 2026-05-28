import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * 운영자 대시보드 — 요약 통계.
 * service_role 클라이언트로 모든 데이터 카운트 (RLS 우회).
 */
export default async function AdminDashboard() {
  const sb = getSupabaseAdmin();

  // 병렬 카운트
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    usersTotal,
    usersThisWeek,
    recordsTotal,
    postsTotal,
    inquiriesWait,
    inquiriesDone,
    feedbackTotal,
  ] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    sb.from("running_records").select("*", { count: "exact", head: true }),
    sb.from("community_posts").select("*", { count: "exact", head: true }),
    sb.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "wait"),
    sb.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "done"),
    sb.from("feedback").select("*", { count: "exact", head: true }),
  ]);

  void monthAgo;

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>대시보드</h1>
      <p style={{ color: "#666", fontSize: 13, margin: 0 }}>전체 서비스 현황을 한눈에 확인하세요.</p>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <Stat label="총 사용자" value={usersTotal.count ?? 0} sub="누적 가입자" />
        <Stat label="이번주 신규" value={usersThisWeek.count ?? 0} sub="최근 7일 가입" accent />
        <Stat label="러닝 기록" value={recordsTotal.count ?? 0} sub="누적 기록 수" />
        <Stat label="커뮤니티 글" value={postsTotal.count ?? 0} sub="누적 게시글" />
        <Stat
          label="미답변 문의"
          value={inquiriesWait.count ?? 0}
          sub={`처리완료 ${inquiriesDone.count ?? 0}건`}
          warn={(inquiriesWait.count ?? 0) > 0}
        />
        <Stat label="피드백" value={feedbackTotal.count ?? 0} sub="개선사항·탈퇴 사유 등" />
      </div>

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>빠른 작업</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <QuickLink href="/admin/users" label="사용자 관리" />
          <QuickLink href="/admin/posts" label="커뮤니티 검토" />
          <QuickLink
            href="/admin/inquiries"
            label={`문의 ${inquiriesWait.count ?? 0}건 답변하기`}
            highlight={(inquiriesWait.count ?? 0) > 0}
          />
          <QuickLink href="/admin/feedback" label="피드백 보기" />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
  warn,
}: {
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        borderTop: warn ? "3px solid #f59e0b" : accent ? "3px solid #7C5CFF" : "3px solid transparent",
      }}
    >
      <div style={{ fontSize: 12, color: "#888" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: warn ? "#f59e0b" : "#111" }}>
        {value.toLocaleString()}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function QuickLink({ href, label, highlight }: { href: string; label: string; highlight?: boolean }) {
  return (
    <a
      href={href}
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        background: highlight ? "#f59e0b" : "#fff",
        color: highlight ? "#fff" : "#333",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 600,
        border: highlight ? 0 : "1px solid #e5e5e5",
      }}
    >
      {label} →
    </a>
  );
}
