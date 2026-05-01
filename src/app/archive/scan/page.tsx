"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

export default function ArchiveScanPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/archive");
  };

  return (
    <div className="archive-modal">
      <div className="am-head">
        <div>
          <div className="am-title">캡쳐사진 스캔하기</div>
          <div className="am-sub">러닝 기록 캡쳐 사진을 업로드해주세요.</div>
        </div>
        <button className="am-close" onClick={back} aria-label="닫기">
          ×
        </button>
      </div>

      <div className="scan-examples">
        <div className="se-title">지원 예시</div>
        <div className="se-grid">
          <div className="se-tile" style={{ background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)" }}>
            <div className="se-mock se-mock-map" />
          </div>
          <div className="se-tile" style={{ background: "linear-gradient(135deg,#1F2937,#111827)" }}>
            <div className="se-mock se-mock-stats" />
          </div>
          <div className="se-tile" style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)" }}>
            <div className="se-mock se-mock-summary" />
          </div>
        </div>
      </div>

      <div className="scan-drop" onClick={() => showToast("사진을 선택해주세요")}>
        <div className="sd-cloud">
          <svg viewBox="0 0 60 60" fill="none" stroke="#8B5CF6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 38 a10 10 0 1 1 4 -19 a14 14 0 0 1 26 6 a8 8 0 0 1 0 16 H22 a4 4 0 0 1 -4 -3" />
            <path d="M30 26 v14 M24 32 l6 -6 6 6" />
          </svg>
        </div>
        <div className="sd-label">캡쳐 사진 업로드</div>
      </div>

      <div className="scan-tip">
        <div className="st-title">TIP</div>
        <p>
          기록이 잘 보이도록 캡쳐해주세요.
          <br />
          거리, 시간, 페이스가 보이면 인식이 더 잘 돼요.
        </p>
      </div>
    </div>
  );
}
