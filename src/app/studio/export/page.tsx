"use client";

import { useRouter } from "next/navigation";
import RunningCard from "@/features/studio/RunningCard";
import { useAppStore } from "@/stores/useAppStore";

export default function StudioExportPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/studio");
  };

  return (
    <>
      <div className="app-header export-header">
        <button className="back-btn" onClick={back} style={{ color: "#fff" }}>
          ‹
        </button>
        <div className="title" style={{ color: "#fff" }}>
          갤러리 보관소에 저장 완료
        </div>
      </div>
      <section className="export-screen">
        <div className="export-preview">
          <RunningCard small />
        </div>
        <div className="export-section">
          <div className="export-label">공유 및 저장</div>
          <button className="export-insta" onClick={() => showToast("인스타그램으로 공유했어요")}>
            <span className="ig-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="white" />
              </svg>
            </span>
            <span className="ig-text">
              <b>인스타 공유</b>
              <em>인스타그램 스토리에 바로 공유해보세요</em>
            </span>
          </button>
          <button className="export-row" onClick={() => showToast("카카오톡으로 공유했어요")}>
            <span className="er-ic kk">K</span>
            <span>카카오톡 공유하기</span>
            <span className="er-arrow">›</span>
          </button>
          <button className="export-row" onClick={() => showToast("공유 링크가 복사되었어요")}>
            <span className="er-ic">🔗</span>
            <span>공유 링크 복사</span>
            <span className="er-arrow">›</span>
          </button>
          <button className="export-row" onClick={() => showToast("내 사진첩에 보관되었습니다")}>
            <span className="er-ic">🖼</span>
            <span>내 휴대폰 갤러리 저장</span>
            <span className="er-arrow">›</span>
          </button>
        </div>
      </section>
    </>
  );
}
