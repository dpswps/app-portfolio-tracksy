"use client";

import { useParams } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { partners } from "@/data/partners";
import { useAppStore } from "@/stores/useAppStore";

export default function PartnerDetailPage() {
  const params = useParams<{ id: string }>();
  const showToast = useAppStore((s) => s.showToast);
  const p = partners.find((x) => x.id === params.id) || partners[0];

  return (
    <>
      <AppHeader title={p.name} fallback="/partners" />
      <section className="partner-detail">
        <div className={`big-logo ${p.cls}`}>{p.initial}</div>
        <h2>{p.name} 에 연결</h2>
        <p>{p.desc}</p>
        <div className="actions">
          <button
            className="primary-btn"
            style={{ marginTop: 0 }}
            onClick={() => showToast("연결 요청을 보냈어요")}
          >
            APP 연결하기
          </button>
          <button
            className="primary-btn"
            style={{
              background: "#fff",
              color: "var(--primary)",
              border: "1px solid var(--primary)",
              marginTop: 0,
            }}
            onClick={() => showToast("동기화를 시작했어요")}
          >
            기록 동기화 및 가져오기
          </button>
        </div>
      </section>
    </>
  );
}
