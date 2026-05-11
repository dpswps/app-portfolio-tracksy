"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { partners } from "@/data/partners";
import { useAppStore } from "@/stores/useAppStore";

export default function SyncConnectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const showToast = useAppStore((s) => s.showToast);

  const id = decodeURIComponent(String(params?.id ?? ""));
  const partner = partners.find((p) => p.id === id) || partners[0];

  const back = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/archive/sync");
    }
  };

  const onConnect = () => {
    showToast(`${partner.name} 앱 연결을 시작했어요`);
  };

  const onSync = () => {
    showToast(`${partner.name}에서 기록을 가져오고 있어요`);
  };

  return (
    <>
      <div className="app-header sc-header">
        <button className="back-btn" onClick={back} aria-label="뒤로">
          ‹
        </button>
        <div className="sc-header-title">{partner.name}</div>
        <span className="sc-header-spacer" />
      </div>

      <section className="sc-screen">
        <div className={`logo logo-large ${partner.cls}`} aria-hidden="true">
          {partner.initial}
        </div>

        <h2 className="sc-title">{partner.name} 에 연결</h2>
        <p className="sc-desc">{partner.desc}</p>

        <div className="sc-actions">
          <button className="primary-btn sc-primary-btn" onClick={onConnect}>
            APP 연결하기
          </button>
          <button className="sc-secondary-btn" onClick={onSync}>
            기록 동기화 및 가져오기
          </button>
        </div>

        <Link href="/archive/sync" className="sc-back-link">
          다른 앱 선택하기
        </Link>
      </section>
    </>
  );
}
