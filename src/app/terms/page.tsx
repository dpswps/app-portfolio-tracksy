import AppHeader from "@/components/ui/AppHeader";

export const metadata = {
  title: "이용약관 | Tracksy",
};

export default function TermsPage() {
  return (
    <>
      <AppHeader title="이용약관" fallback="/settings" />
      <section style={{ padding: 20, fontSize: 14, lineHeight: 1.6, color: "#333" }}>
        <h2 style={{ fontSize: 18, margin: "8px 0 12px" }}>제1조 (목적)</h2>
        <p>
          본 약관은 Tracksy(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
        </p>

        <h2 style={{ fontSize: 18, margin: "20px 0 12px" }}>제2조 (정의)</h2>
        <p>&quot;회원&quot;이라 함은 회사에 개인정보를 제공하여 회원등록을 한 자로서, 서비스를 지속적으로 이용할 수 있는 자를 말합니다.</p>

        <h2 style={{ fontSize: 18, margin: "20px 0 12px" }}>제3조 (약관의 효력 및 변경)</h2>
        <p>회사는 약관의 규제에 관한 법률 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</p>

        <h2 style={{ fontSize: 18, margin: "20px 0 12px" }}>제4조 (서비스의 제공 및 변경)</h2>
        <p>회사는 러닝 기록 저장, AI 일지 작성, 커뮤니티 등의 서비스를 제공합니다. 서비스의 내용은 회사 사정에 따라 변경될 수 있습니다.</p>

        <h2 style={{ fontSize: 18, margin: "20px 0 12px" }}>제5조 (이용자의 의무)</h2>
        <p>이용자는 타인의 개인정보를 도용하거나, 서비스의 정상 운영을 방해하는 행위를 해서는 안 됩니다.</p>

        <p style={{ marginTop: 32, color: "#888", fontSize: 12 }}>
          ※ 본 약관은 초안이며, 정식 서비스 출시 전 법무 검토 후 확정됩니다.
        </p>
      </section>
    </>
  );
}
