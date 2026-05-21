"use client";

import { getSupabaseBrowser } from "@/lib/supabase/client";

/** VAPID public 키 — Vercel/로컬에 NEXT_PUBLIC_VAPID_PUBLIC_KEY 로 설정 후 사용. */
function getVapidKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/** 사용자에게 알림 권한을 묻고 서비스 워커로 푸시 구독 → Supabase 에 저장. */
export async function subscribePush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;
  if (!("PushManager" in window)) return false;
  const key = getVapidKey();
  if (!key) {
    console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub = existing ?? (await reg.pushManager.subscribe({
    userVisibleOnly: true,
    // BufferSource 호환 — Uint8Array 의 underlying buffer 를 명시적으로 ArrayBuffer 로 캐스트.
    applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
  }));

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

  const sb = getSupabaseBrowser();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return false;
  const { error } = await sb.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    console.warn("[push] upsert failed", error);
    return false;
  }
  return true;
}

export async function unsubscribePush(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  const sb = getSupabaseBrowser();
  await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
