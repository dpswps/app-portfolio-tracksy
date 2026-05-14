"use client";

import Link from "next/link";
import Mascot from "@/components/ui/Mascot";
import { useAppStore } from "@/stores/useAppStore";

/**
 * 보관함의 "AI 오늘의 러닝일지" 카드.
 *
 * 진입 직전 resetAI()를 호출해서 이전 세션의 stale 상태(끊긴 chat 메시지,
 * loading/result 잔재 등)를 정리한다. 스튜디오의 동일 버튼(/studio FAB)도
 * 같은 패턴을 써서 두 진입점이 똑같이 "처음부터 새로" 시작되도록 통일.
 */
export default function AICard() {
  const resetAI = useAppStore((s) => s.resetAI);

  return (
    <div className="ai-card-group">
      <Link
        href="/archive/ai"
        className="ai-journal-card"
        style={{ display: "flex", textDecoration: "none", color: "inherit" }}
        onClick={resetAI}
      >
        <div className="ajc-mascot">
          <Mascot />
        </div>
        <div className="ajc-text">
          <b>AI 오늘의 러닝일지</b>
          <p>대화로 러닝 기록을 정리해보세요</p>
        </div>
        <span className="ajc-arrow">›</span>
      </Link>
      <Link
        href="/archive/journals"
        className="ai-journals-link"
        style={{ display: "flex", textDecoration: "none", color: "inherit" }}
      >
        <span className="ajl-icon">📒</span>
        <span className="ajl-text">저장된 러닝 일지 모아보기</span>
        <span className="ajl-arrow">›</span>
      </Link>
    </div>
  );
}
