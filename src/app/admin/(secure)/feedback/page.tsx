import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const sb = getSupabaseAdmin();
  let query = sb.from("feedback").select("*").order("created_at", { ascending: false }).limit(200);
  if (category && ["bug", "feature", "etc"].includes(category)) {
    query = query.eq("category", category);
  }
  const { data, error } = await query;
  const items = (data ?? []) as Array<{
    id: string;
    user_id: string | null;
    email: string | null;
    category: string;
    body: string;
    user_agent: string | null;
    created_at: string;
  }>;

  // 작성자 이름 매핑
  let profileMap: Record<string, string | null> = {};
  if (items.length > 0) {
    const ids = Array.from(new Set(items.map((i) => i.user_id).filter(Boolean) as string[]));
    if (ids.length > 0) {
      const { data: profiles } = await sb.from("profiles").select("id, name").in("id", ids);
      if (profiles) profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.name]));
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>피드백</h1>
        <p style={{ color: "#666", fontSize: 13, margin: 0 }}>
          사용자 의견과 회원 탈퇴 사유 ([withdraw]로 시작) 를 확인합니다.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <FilterTab href="/admin/feedback" label="전체" active={!category} />
        <FilterTab href="/admin/feedback?category=bug" label="버그" active={category === "bug"} />
        <FilterTab href="/admin/feedback?category=feature" label="기능 제안" active={category === "feature"} />
        <FilterTab href="/admin/feedback?category=etc" label="기타·탈퇴" active={category === "etc"} />
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          조회 실패: {error.message}
          {error.message.includes("relation") && (
            <div style={{ marginTop: 6, fontSize: 12 }}>
              ⚠️ feedback 테이블이 아직 없습니다. 0007 마이그레이션 SQL을 실행하세요.
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ background: "#fff", padding: 40, borderRadius: 12, textAlign: "center", color: "#999" }}>
          피드백이 없습니다.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {items.map((i) => {
            const isWithdraw = i.body.startsWith("[withdraw]");
            const authorName = i.user_id ? profileMap[i.user_id] : null;
            return (
              <div key={i.id} style={{ background: "#fff", borderRadius: 10, padding: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: isWithdraw ? "3px solid #d33" : "3px solid transparent" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, background: catColor(i.category), color: "#fff", padding: "2px 8px", borderRadius: 4 }}>
                    {catLabel(i.category)}
                  </span>
                  {isWithdraw && (
                    <span style={{ fontSize: 10, background: "#d33", color: "#fff", padding: "2px 8px", borderRadius: 4 }}>
                      회원탈퇴
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "#999" }}>{new Date(i.created_at).toLocaleString("ko-KR")}</span>
                </div>
                <div style={{ fontSize: 13, color: "#222", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {isWithdraw ? i.body.replace(/^\[withdraw\]\s*/, "") : i.body}
                </div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
                  {authorName || "(이름없음)"} · {i.email || "비로그인"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function catLabel(c: string): string {
  if (c === "bug") return "버그";
  if (c === "feature") return "기능";
  return "기타";
}
function catColor(c: string): string {
  if (c === "bug") return "#dc2626";
  if (c === "feature") return "#7C5CFF";
  return "#6b7280";
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
