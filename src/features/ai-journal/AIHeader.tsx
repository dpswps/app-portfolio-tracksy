"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

export default function AIHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetAI = useAppStore((s) => s.resetAI);
  // 진입 컨텍스트 — /archive/ai?from=studio 일 때 X 누르면 /studio 로 복귀.
  // 보관함에서 진입했을 땐 기존대로 /archive 로 돌려보낸다.
  const fromStudio = searchParams?.get("from") === "studio";

  const onClose = () => {
    // resetAI 로 stale 화면 정리
    resetAI();
    // 진입 경로에 맞게 라우팅
    router.push(fromStudio ? "/studio" : "/archive");
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
