import AppHeader from "@/components/ui/AppHeader";

export const metadata = {
  title: "개인정보처리방침 | Tracksy",
};

export default function PrivacyPage() {
  return (
    <>
      <AppHeader title="개인정보처리방침" fallback="/settings" />
      <section style={{ padding: 20, fontSize: 14, lineHeight: 1.6, color: "#333" }}>
        <h2 style={{ fontSize: 18, margin: "8px 0 12px" }}>1. 수집하는 개인정보 항목</h2>
        <p>회사는 회원가입 및 서비스 이용 시 다음의 정보를 수집합니다.</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>필수: 이메일, 비밀번호(해시 저장), 이름</li>
          <li>선택: 생년월일, 선호 러닝 스타일, 프로필 사진</li>
          <li>자동 수집: 서비스 이용 기록, 접속 IP</li>
        </ul>

        <h2 style={{ fontSize: 18, margin: "20px 0 12px" }}>2. 개인정보 이용 목적</h2>
        <p>회원 식별·인증, 러닝 기록 저장·동기화, 커뮤니티 기능, 푸시 알림 전송, 서비스 개선.</p>

        <h2 style={{ fontSize: 18, margin: "20px 0 12px" }}>3. 보관 및 파기</h2>
        <p>회원 탈퇴 시 즉시 모든 개인정보를 파기합니다. 단, 관련 법령에 따라 일정 기간 보존이 필요한 정보는 별도 저장 후 파기합니다.</p>

        <h2 style={{ fontSize: 18, margin: "20px 0 12px" }}>4. 제3자 제공</h2>
        <p>회사는 다음의 경우를 제외하고는 이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>법령상 의무가 있는 경우</li>
          <li>이용자가 사전에 동의한 경우</li>
        </ul>

        <h2 style={{ fontSize: 18, margin: "20px 0 12px" }}>5. 처리 위탁</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>Supabase: 인증·DB·Storage</li>
          <li>Vercel: 웹 호스팅</li>
          <li>Groq: AI 일지 생성·OCR (영상은 처리 후 저장되지 않음)</li>
        </ul>

        <p style={{ marginTop: 32, color: "#888", fontSize: 12 }}>
          ※ 본 방침은 초안이며, 정식 서비스 출시 전 법무 검토 후 확정됩니다.
        </p>
      </section>
    </>
  );
}
