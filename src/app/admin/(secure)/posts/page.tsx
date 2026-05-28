import { getSupabaseAdmin } from "@/lib/supabase/server";
import PostsTable from "./PostsTable";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const sb = getSupabaseAdmin();

  // 작성자 이름 조인 — community_posts.author_id ↔ profiles.id
  let query = sb
    .from("community_posts")
    .select("id, author_id, type, caption, tags, image_url, bg, likes, comments, created_at, dist, time, pace")
    .order("created_at", { ascending: false })
    .limit(200);
  if (q && q.trim()) {
    query = query.or(`caption.ilike.%${q}%,tags.ilike.%${q}%`);
  }
  const { data: posts, error } = await query;

  // 작성자 이름 별도 조회 (RLS service_role 사용)
  let profileMap: Record<string, { name: string | null; email: string | null }> = {};
  if (posts && posts.length > 0) {
    const ids = Array.from(new Set(posts.map((p) => p.author_id)));
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, name, email")
      .in("id", ids);
    if (profiles) {
      profileMap = Object.fromEntries(profiles.map((p) => [p.id, { name: p.name, email: p.email }]));
    }
  }

  const enriched = (posts ?? []).map((p) => ({
    ...p,
    authorName: profileMap[p.author_id]?.name ?? null,
    authorEmail: profileMap[p.author_id]?.email ?? null,
  }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>커뮤니티 글</h1>
          <p style={{ color: "#666", fontSize: 13, margin: 0 }}>최신 {enriched.length}개 표시 · 캡션·태그로 검색</p>
        </div>
        <form method="get" action="/admin/posts" style={{ display: "flex", gap: 8 }}>
          <input name="q" defaultValue={q ?? ""} placeholder="캡션·태그 검색" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, width: 240 }} />
          <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, background: "#1a1a2e", color: "#fff", border: 0, fontSize: 13, cursor: "pointer" }}>검색</button>
        </form>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#b91c1c", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          조회 실패: {error.message}
        </div>
      )}

      <PostsTable posts={enriched} />
    </div>
  );
}
