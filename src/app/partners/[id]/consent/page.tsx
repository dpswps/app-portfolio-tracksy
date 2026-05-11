"use client";

import { useParams, useRouter } from "next/navigation";
import AppHeader from "@/components/ui/AppHeader";
import { partners } from "@/data/partners";
import { useAppStore } from "@/stores/useAppStore";

const DATA_ITEMS: { icon: string; label: string; desc: string }[] = [
  { icon: "📅", label: "러닝 날짜", desc: "내가 뛴 날짜와 시간 정보" },
  { icon: "🗺️", label: "러닝 코스", desc: "이동 경로 및 위치 정보" },
  { icon: "📏", label: "거리(KM)", desc: "총 이동 거리" },
  { icon: "⏱️", label: "시간", desc: "전체 운동 시간" },
  { icon: "⚡", label: "페이스", desc: "1km당 평균 속도" },
  { icon: "❤️", label: "심박수", desc: "운동 중 평균/최고 심박수" },
];

export default function PartnerConsentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const connectPartner = useAppStore((s) => s.connectPartner);
  const isConnected = useAppStore((s) =>
    s.connectedPartners.includes(params.id)
  );
  const p = partners.find((x) => x.id === params.id) || partners[0];

  const onConsent = () => {
    connectPartner(p.id);
    showToast(`${p.name}에 연결되었어요`);
    setTimeout(() => router.push(`/partners/${p.id}`), 600);
  };

  const onCancel = () => {
    router.back();
  };

  return (
    <>
      <AppHeader title="앱 연결 동의" fallback={`/partners/${p.id}`} />
      <section className="consent-screen">
        <div className={`big-logo ${p.cls}`}>{p.initial}</div>
        <h2 className="consent-title">{p.name} 연결</h2>
        <p className="consent-sub">
          TRACKSY가 <strong>{p.name}</strong>의 다음 러닝 데이터에 접근하는 것에
          동의합니다. 가져온 기록은 보관함의 내 기록 보관소에서 확인할 수 있어요.
        </p>

        <ul className="consent-list">
          {DATA_ITEMS.map((it) => (
            <li key={it.label} className="consent-item">
              <span className="ci-ic">{it.icon}</span>
              <div className="ci-text">
                <div className="ci-label">{it.label}</div>
                <div className="ci-desc">{it.desc}</div>
              </div>
              <span className="ci-check">✓</span>
            </li>
          ))}
        </ul>

        <p className="consent-note">
          연결 이후 언제든 설정에서 연결을 해제할 수 있고,
          가져온 기록은 사용자의 기기에서만 사용됩니다.
        </p>

        <div className="consent-actions">
          <button className="primary-btn" onClick={onConsent} disabled={isConnected}>
            {isConnected ? "이미 연결됨" : "동의하고 연결하기"}
          </button>
          <button className="ghost-btn" onClick={onCancel}>
            취소
          </button>
        </div>
      </section>
    </>
  );
}
