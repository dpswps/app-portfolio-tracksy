"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";

export type BucketId =
  | "avatars"
  | "covers"
  | "screenshots"
  | "post-images"
  | "gallery-cards";

/** dataURL("data:image/jpeg;base64,...") → Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:([^;]+);base64/.exec(meta)?.[1] ?? "image/png";
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "png";
}

/**
 * dataURL/Blob/File 을 버킷의 본인 폴더에 업로드 → 공개 URL 반환.
 * 경로 규약: `<userId>/<prefix?-><random>.<ext>`
 */
export async function uploadImage(
  bucket: BucketId,
  data: string | Blob | File,
  opts: { prefix?: string; cacheControl?: string } = {},
): Promise<string> {
  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  let blob: Blob;
  if (typeof data === "string") {
    if (!data.startsWith("data:")) {
      // 이미 URL 이면 그대로 통과
      return data;
    }
    blob = dataUrlToBlob(data);
  } else {
    blob = data;
  }

  const ext = extFromMime(blob.type);
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now();
  const prefix = opts.prefix ? `${opts.prefix}-` : "";
  const path = `${user.id}/${prefix}${ts}-${rand}.${ext}`;

  const { error } = await sb.storage.from(bucket).upload(path, blob, {
    cacheControl: opts.cacheControl ?? "31536000",
    upsert: false,
    contentType: blob.type,
  });
  if (error) throw error;

  const { data: pub } = sb.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}

/** 공개 URL 에서 객체 path 추출 후 삭제 (본인 폴더만 가능). */
export async function deleteImage(
  bucket: BucketId,
  publicUrlOrPath: string,
): Promise<void> {
  const sb = getSupabaseBrowser();
  let path = publicUrlOrPath;
  // 풀 URL 이면 buckets/<bucket>/ 뒤 부분만 추출
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrlOrPath.indexOf(marker);
  if (idx >= 0) path = publicUrlOrPath.slice(idx + marker.length);
  const { error } = await sb.storage.from(bucket).remove([path]);
  if (error) throw error;
}
