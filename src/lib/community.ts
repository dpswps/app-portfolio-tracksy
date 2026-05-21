"use client";

import type { CommunityPost } from "@/types";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";

type PostRow = {
  id: string;
  author_id: string;
  type: "photo" | "stats";
  dist: string | null;
  time: string | null;
  pace: string | null;
  cal: string | null;
  extra: string | null;
  brand: string | null;
  bg: string;
  image_url: string | null;
  tall: boolean;
  avatar_bg: string | null;
  caption: string | null;
  tags: string | null;
  likes: number;
  comments: number;
  date: string | null;
  created_at: string;
};

// UUID ↔ numeric id 매핑 (Zustand CommunityPost.id 가 number)
const idMap = new Map<number, string>();
function uuidToNumber(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) h = (h * 31 + uuid.charCodeAt(i)) >>> 0;
  idMap.set(h, uuid);
  return h;
}
export function getPostUuid(numericId: number): string | undefined {
  return idMap.get(numericId);
}

function rowToPost(row: PostRow): CommunityPost {
  const p: CommunityPost = {
    id: uuidToNumber(row.id),
    type: row.type,
    bg: row.bg,
    likes: row.likes,
  };
  if (row.dist) p.dist = row.dist;
  if (row.time) p.time = row.time;
  if (row.pace) p.pace = row.pace;
  if (row.cal) p.cal = row.cal;
  if (row.extra) p.extra = row.extra;
  if (row.brand) p.brand = row.brand;
  if (row.image_url) p.image = row.image_url;
  if (row.tall) p.tall = row.tall;
  if (row.avatar_bg) p.avatarBg = row.avatar_bg;
  if (row.caption) p.caption = row.caption;
  if (row.tags) p.tags = row.tags;
  if (row.date) p.date = row.date;
  return p;
}

export async function fetchCommunityFeed(limit = 50): Promise<CommunityPost[]> {
  const sb = getSupabaseBrowser();
  const { data, error } = await sb
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as PostRow[]).map(rowToPost);
}

export async function createPost(
  post: Omit<CommunityPost, "id">,
): Promise<CommunityPost> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  // image 가 dataURL 이면 Storage 에 업로드
  let imageUrl: string | null = null;
  if (post.image) {
    if (post.image.startsWith("data:") || post.image.startsWith("blob:")) {
      try {
        // blob URL 이면 fetch 해서 blob 으로 받기
        let blobOrUrl: string | Blob = post.image;
        if (post.image.startsWith("blob:")) {
          blobOrUrl = await fetch(post.image).then((r) => r.blob());
        }
        imageUrl = await uploadImage("post-images", blobOrUrl, { prefix: "post" });
      } catch (err) {
        console.warn("[community] post image upload failed", err);
      }
    } else {
      imageUrl = post.image;
    }
  }

  const { data, error } = await sb
    .from("community_posts")
    .insert({
      author_id: user.id,
      type: post.type,
      dist: post.dist ?? null,
      time: post.time ?? null,
      pace: post.pace ?? null,
      cal: post.cal ?? null,
      extra: post.extra ?? null,
      brand: post.brand ?? null,
      bg: post.bg,
      image_url: imageUrl,
      tall: !!post.tall,
      avatar_bg: post.avatarBg ?? null,
      caption: post.caption ?? null,
      tags: post.tags ?? null,
      likes: 0,
      comments: 0,
      date: post.date ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return rowToPost(data as PostRow);
}

export async function deletePost(numericId: number): Promise<void> {
  const sb = getSupabaseBrowser();
  const uuid = idMap.get(numericId);
  if (!uuid) throw new Error("UUID 매핑이 없습니다 (앱 재시작 후 다시 시도)");
  const { error } = await sb.from("community_posts").delete().eq("id", uuid);
  if (error) throw error;
}

// 좋아요 토글 (자기 행 insert/delete)
export async function toggleLike(numericId: number, on: boolean): Promise<void> {
  const sb = getSupabaseBrowser();
  const uuid = idMap.get(numericId);
  if (!uuid) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");
  if (on) {
    const { error } = await sb
      .from("post_likes")
      .insert({ post_id: uuid, user_id: user.id });
    if (error && !String(error.message).includes("duplicate")) throw error;
  } else {
    const { error } = await sb
      .from("post_likes")
      .delete()
      .eq("post_id", uuid)
      .eq("user_id", user.id);
    if (error) throw error;
  }
}

// 북마크(저장) 토글
export async function toggleSave(numericId: number, on: boolean): Promise<void> {
  const sb = getSupabaseBrowser();
  const uuid = idMap.get(numericId);
  if (!uuid) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");
  if (on) {
    const { error } = await sb
      .from("post_saves")
      .insert({ post_id: uuid, user_id: user.id });
    if (error && !String(error.message).includes("duplicate")) throw error;
  } else {
    const { error } = await sb
      .from("post_saves")
      .delete()
      .eq("post_id", uuid)
      .eq("user_id", user.id);
    if (error) throw error;
  }
}

// 댓글
export async function addComment(numericPostId: number, body: string): Promise<void> {
  const sb = getSupabaseBrowser();
  const uuid = idMap.get(numericPostId);
  if (!uuid) throw new Error("UUID 매핑이 없습니다");
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");
  const { error } = await sb
    .from("post_comments")
    .insert({ post_id: uuid, author_id: user.id, body });
  if (error) throw error;
}

export async function fetchComments(numericPostId: number) {
  const sb = getSupabaseBrowser();
  const uuid = idMap.get(numericPostId);
  if (!uuid) return [];
  const { data, error } = await sb
    .from("post_comments")
    .select("*")
    .eq("post_id", uuid)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
