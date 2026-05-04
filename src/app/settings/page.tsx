import Link from "next/link";
import AppHeader from "@/components/ui/AppHeader";

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="설정" fallback="/home" />
      <section className="settings-screen">
        <div className="settings-section">
          <h3>파트너 앱</h3>
          <Link href="/partners" className="partner-cta" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
            파트너 APP 기록 가져오기
          </Link>
        </div>
        <div className="settings-section">
          <h3>고객 문의</h3>
          <Link href="/inquiry" className="list-item" style={{ textDecoration: "none", color: "inherit" }}>
            <span>이용 문의하기</span>
            <span className="arrow">›</span>
          </Link>
          <Link href="/inquiry/list" className="list-item" style={{ textDecoration: "none", color: "inherit" }}>
            <span>나의 문의내역</span>
            <span className="arrow">›</span>
          </Link>
          <Link href="/feedback" className="list-item" style={{ textDecoration: "none", color: "inherit" }}>
            <span>개선사항 보내기</span>
            <span className="arrow">›</span>
          </Link>
        </div>
      </section>
    </>
  );
}
