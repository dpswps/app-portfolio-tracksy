"use client";

import { useRouter } from "next/navigation";
import { partners } from "@/data/partners";
import { useAppStore } from "@/stores/useAppStore";

export default function ArchiveSyncPage() {
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
          <div className="am-title">타사 앱 데이터 연동하기</div>
          <div className="am-sub">연동할 앱을 선택해주세요.</div>
        </div>
        <button className="am-close" onClick={back} aria-label="닫기">
          ×
        </button>
      </div>
      <div className="sync-app-list">
        {partners.map((p) => (
          <div
            key={p.id}
            className="sync-app-row"
            onClick={() => showToast(`${p.name} 연동을 시작했어요`)}
          >
            <div className={`logo ${p.cls}`}>{p.initial}</div>
            <div className="name">{p.name}</div>
            <div className="ext">↗</div>
          </div>
        ))}
      </div>
      <div className="sync-safe">
        <div className="ss-icon">🔒</div>
        <div className="ss-text">
          <b>연동은 안전하게 진행돼요</b>
          <p>연동된 데이터는 안전하게 보호되며, 기록 저장에만 사용돼요.</p>
        </div>
      </div>
    </div>
  );
}
