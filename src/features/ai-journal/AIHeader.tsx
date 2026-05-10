"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

export default function AIHeader() {
  const router = useRouter();
  const resetAI = useAppStore((s) => s.resetAI);

  const onClose = () => {
    // store 상태 먼저 깨끗이 정리해서 다음 진입 시 stale 화면(skip/loading/result)이 안 뜨게 함
    resetAI();
    // back 대신 명시적으로 보관함으로 보내서 history depth에 따라 동작이 달라지지 않게 함
    router.push("/archive");
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
