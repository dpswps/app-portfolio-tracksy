"use client";

import { useAppStore } from "@/stores/useAppStore";

export default function ToastHost() {
  const toast = useAppStore((s) => s.toast);
  return <div className={`toast${toast ? " show" : ""}`}>{toast}</div>;
}
