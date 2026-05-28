"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePostAction } from "./actions";

type Post = {
  id: string;
  author_id: string;
  type: string;
  caption: string | null;
  tags: string | null;
  image_url: string | null;
  bg: string;
  likes: number;
  comments: number;
  created_at: string;
  dist: string | null;
  authorName: string | null;
  authorEmail: string | null;
};

function formatDate(s: string): string {
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function PostsTable({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const onDelete = (p: Post) => {
    if (!confirm(`이 글을 삭제할까요?\n\n"${(p.caption || "(이미지)").slice(0, 50)}"`)) return;
    setBusyId(p.id);
    startTransition(async () => {
      const res = await deletePostAction(p.id);
      setBusyId(null);
      if (!res.ok) alert(`실패: ${res.error}`);
      else router.refresh();
    });
  };

  if (posts.length === 0) {
    return <div style={{ background: "#fff", padding: 40, borderRadius: 12, textAlign: "center", color: "#999" }}>글이 없습니다.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {posts.map((p) => (
        <div
          key={p.id}
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            gap: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 8,
              flexShrink: 0,
              background: p.image_url ? `url(${p.image_url}) center/cover` : p.bg,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
              {p.authorName || "(이름없음)"} · {p.authorEmail} · {formatDate(p.created_at)} · {p.type}
            </div>
            <div style={{ fontSize: 14, color: "#222", marginBottom: 4, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {p.caption || <span style={{ color: "#bbb" }}>(캡션 없음)</span>}
            </div>
            {p.tags && (
              <div style={{ fontSize: 12, color: "#7C5CFF" }}>{p.tags}</div>
            )}
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 6, display: "flex", gap: 14 }}>
              {p.dist && <span>📍 {p.dist}km</span>}
              <span>♥ {p.likes}</span>
              <span>💬 {p.comments}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={() => onDelete(p)}
              disabled={pending && busyId === p.id}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                borderRadius: 6,
                border: 0,
                background: "#fee2e2",
                color: "#b91c1c",
                cursor: "pointer",
              }}
            >
              {pending && busyId === p.id ? "삭제 중…" : "삭제"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
