// Tracksy 서비스 워커 — 최소형
// PWA 설치 가능하게 하는 정도. 캐싱은 향후 강화.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // 기본 네트워크 통과 — 오프라인 캐싱은 추후.
});

// 푸시 알림 수신
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = { title: "Tracksy", body: "" };
  try {
    payload = event.data.json();
  } catch {
    payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Tracksy", {
      body: payload.body || "",
      icon: "/start_cha.png",
      badge: "/start_cha.png",
      data: payload.url ? { url: payload.url } : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
