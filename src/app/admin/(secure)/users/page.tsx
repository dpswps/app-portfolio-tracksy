import { getSupabaseAdmin } from "@/lib/supabase/server";
import UsersTable from "./UsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const sb = getSupabaseAdmin();

  let query = sb
    .from("admin_users_view")
    .select("*")
    .order("auth_created_at", { ascending: false })
    .limit(200);

  if (q && q.trim()) {
    // email 또는 name 매칭
    query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
  }

  const { data, error } = await query;
  const users = (data ?? []) as Array<{
    id: string;
    name: string | null;
    email: string | null;
    auth_email: string | null;
    is_admin: boolean;
    has_onboarded: boolean;
    auth_created_at: string | null;
    last_sign_in_at: string | null;
    banned_until: string | null;
  }>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>사용자 관리</h1>
          <p style={{ color: "#666", fontSize: 13, margin: 0 }}>
            총 {users.length}명 표시 · 이메일·이름으로 검색
          </p>
        </div>
        <form method="get" action="/admin/users" style={{ display: "flex", gap: 8 }}>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="이메일 또는 이름 검색"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 13,
              width: 240,
            }}
          />
          <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, background: "#1a1a2e", color: "#fff", border: 0, fontSize: 13, cursor: "pointer" }}>
            검색
          </button>
        </form>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          조회 실패: {error.message}
        </div>
      )}

      <UsersTable users={users} />
    </div>
  );
}
