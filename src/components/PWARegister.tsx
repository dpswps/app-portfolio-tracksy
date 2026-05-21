"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // dev 모드에서도 등록되지만, hot reload 와 충돌하면 unregister.
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[pwa] sw register failed", err);
      }
    });
  }, []);
  return null;
}
