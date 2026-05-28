import { getSupabaseAdmin } from "@/lib/supabase/server";
import InquiriesList from "./InquiriesList";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const sb = getSupabaseAdmin();

  let query = sb
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status === "wait" || status === "done") {
    query = query.eq("status", status);
  }
  const { data, error } = await query;

  // 작성자 이름 조회
  const items = (data ?? []) as Array<{
    id: string;
    user_id: string | null;
    type: string;
    title: string;
    body: string;
    reply: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }>;

  let profileMap: Record<string, { name: string | null; email: string | null }> = {};
  if (items.length > 0) {
    const ids = Array.from(new Set(items.map((i) => i.user_id).filter(Boolean) as string[]));
    if (ids.length > 0) {
      const { data: profiles } = await sb.from("profiles").select("id, name, email").in("id", ids);
      if (profiles) profileMap = Object.fromEntries(profiles.map((p) => [p.id, { name: p.name, email: p.email }]));
    }
  }

  const enriched = items.map((i) => ({
    ...i,
    authorName: i.user_id ? profileMap[i.user_id]?.name ?? null : null,
    authorEmail: i.user_id ? profileMap[i.user_id]?.email ?? null : null,
  }));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>문의 관리</h1>
        <p style={{ color: "#666", fontSize: 13, margin: 0 }}>사용자 문의를 확인하고 답변을 작성합니다.</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <FilterTab href="/admin/inquiries" label="전체" active={!status} />
        <FilterTab href="/admin/inquiries?status=wait" label="미답변" active={status === "wait"} />
        <FilterTab href="/admin/inquiries?status=done" label="처리완료" active={status === "done"} />
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          조회 실패: {error.message}
          {error.message.includes("relation") && (
            <div style={{ marginTop: 6, fontSize: 12 }}>
              ⚠️ inquiries 테이블이 아직 없습니다. 0007 마이그레이션 SQL을 실행하세요.
            </div>
          )}
        </div>
      )}

      <InquiriesList items={enriched} />
    </div>
  );
}

function FilterTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        background: active ? "#1a1a2e" : "#fff",
        color: active ? "#fff" : "#666",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 600,
        border: active ? 0 : "1px solid #e5e5e5",
      }}
    >
      {label}
    </a>
  );
}
