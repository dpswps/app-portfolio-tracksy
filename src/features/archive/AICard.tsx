import Link from "next/link";
import Mascot from "@/components/ui/Mascot";

export default function AICard() {
  return (
    <div className="ai-card-group">
      <Link
        href="/archive/ai"
        className="ai-journal-card"
        style={{ display: "flex", textDecoration: "none", color: "inherit" }}
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
