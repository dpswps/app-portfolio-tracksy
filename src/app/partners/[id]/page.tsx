"use client";

import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { partners } from "@/data/partners";
import { partnerRecords } from "@/data/partnerRecords";
import { useAppStore } from "@/stores/useAppStore";

export default function PartnerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const mergeRecords = useAppStore((s) => s.mergeRecords);
  const setArchiveMainTab = useAppStore((s) => s.setArchiveMainTab);
  const setArchiveView = useAppStore((s) => s.setArchiveView);
  const isConnected = useAppStore((s) =>
    s.connectedPartners.includes(params.id)
  );
  const p = partners.find((x) => x.id === params.id) || partners[0];

  const onConnect = () => {
    if (isConnected) {
      showToast("이미 연결된 앱이에요");
      return;
    }
    router.push(`/partners/${p.id}/consent`);
  };

  const onSync = () => {
    if (!isConnected) {
      showToast("먼저 앱 연결에 동의해주세요");
      return;
    }
    const records = partnerRecords[p.id] || {};
    const count = Object.keys(records).length;
    if (count === 0) {
      showToast("가져올 기록이 없어요");
      return;
    }
    mergeRecords(records);
    showToast(`${count}개의 러닝 기록을 가져왔어요`);
    setArchiveMainTab("records");
    setArchiveView("calendar");
    setTimeout(() => router.push("/archive"), 700);
  };

  return (
    <>
      <AppHeader title={p.name} fallback="/partners" />
      <section className="partner-detail">
        <div className={`big-logo ${p.cls}`}>{p.initial}</div>
        <h2>{p.name} 에 연결</h2>
        <p>{p.desc}</p>
        {isConnected && (
          <div className="partner-connected-badge">
            <span className="pcb-dot" />
            연결됨
          </div>
        )}
        <div className="actions">
          <button
            className="primary-btn"
            style={{ marginTop: 0 }}
            onClick={onConnect}
          >
            {isConnected ? "이미 연결됨" : "APP 연결하기"}
          </button>
          <button
            className="primary-btn"
            style={{
              background: "#fff",
              color: "var(--primary)",
              border: "1px solid var(--primary)",
              marginTop: 0,
              opacity: isConnected ? 1 : 0.6,
            }}
            onClick={onSync}
          >
            기록 동기화 및 가져오기
          </button>
        </div>
      </section>
    </>
  );
}
