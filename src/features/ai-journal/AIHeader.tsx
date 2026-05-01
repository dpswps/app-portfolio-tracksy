"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

export default function AIHeader() {
  const router = useRouter();
  const resetAI = useAppStore((s) => s.resetAI);

  const onClose = () => {
    resetAI();
    if (window.history.length > 1) router.back();
    else router.push("/archive");
  };

  return (
    <div className="aij-header">
      <div className="aij-title">AI 오늘의 러닝일지</div>
      <button className="aij-close" onClick={onClose} aria-label="닫기">
        ×
      </button>
    </div>
  );
}
