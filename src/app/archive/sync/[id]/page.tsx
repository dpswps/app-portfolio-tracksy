"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { partners } from "@/data/partners";
import { partnerRecords } from "@/data/partnerRecords";
import { useAppStore } from "@/stores/useAppStore";

export default function SyncConnectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const showToast = useAppStore((s) => s.showToast);
  const mergeRecords = useAppStore((s) => s.mergeRecords);
  const connectPartner = useAppStore((s) => s.connectPartner);
  const isConnected = useAppStore((s) =>
    s.connectedPartners.includes(String(params?.id ?? "")),
  );
  const setArchiveMainTab = useAppStore((s) => s.setArchiveMainTab);
  const setArchiveView = useAppStore((s) => s.setArchiveView);

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
    if (isConnected) {
      showToast(`${partner.name} 앱은 이미 연결되어 있어요`);
      return;
    }
    connectPartner(partner.id);
    showToast(`${partner.name} 앱과 연결되었어요`);
  };

  /**
   * 동기화 → 해당 파트너의 mock 기록(partnerRecords[id])을
   * userRecords에 merge. 동일 날짜의 기록은 새 기록으로 덮어쓴다.
   * 저장 후 보관함의 내 기록 보관소(캘린더 뷰)로 이동.
   */
  const onSync = () => {
    if (!isConnected) {
      showToast("먼저 APP 연결하기를 눌러주세요");
      return;
    }
    const records = partnerRecords[partner.id] || {};
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

        {isConnected && (
          <div className="partner-connected-badge">
            <span className="pcb-dot" />
            연결됨
          </div>
        )}

        <div className="sc-actions">
          <button
            className="primary-btn sc-primary-btn"
            onClick={onConnect}
            aria-disabled={isConnected}
          >
            {isConnected ? "이미 연결됨" : "APP 연결하기"}
          </button>
          <button
            className="sc-secondary-btn"
            onClick={onSync}
            style={{ opacity: isConnected ? 1 : 0.6 }}
          >
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
