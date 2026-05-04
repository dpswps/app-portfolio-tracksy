import Link from "next/link";
import Mascot from "@/components/ui/Mascot";

export default function SplashPage() {
  return (
    <>
      <section className="splash">
        <div className="mascot-wrap">
          <Mascot alt="TRACKSY" className="mascot-img" />
        </div>
        <h1>TRACKSY</h1>
        <p>오늘의 러닝을, 나만의 이야기로</p>
      </section>
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center" }}>
        <Link
          href="/login"
          className="action"
          style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.4)",
            padding: "12px 32px",
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 500,
            backdropFilter: "blur(8px)",
            textDecoration: "none",
          }}
        >
          시작하기 →
        </Link>
      </div>
    </>
  );
}
