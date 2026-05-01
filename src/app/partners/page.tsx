import Link from "next/link";
import AppHeader from "@/components/ui/AppHeader";
import { partners } from "@/data/partners";

export default function PartnersPage() {
  return (
    <>
      <AppHeader title="파트너 앱" fallback="/settings" />
      <section className="partner-screen">
        <h3>APP 연동하기</h3>
        <p className="sub">파트너 앱을 선택하여 기록을 가져오세요.</p>
        {partners.map((p) => (
          <Link
            key={p.id}
            href={`/partners/${p.id}`}
            className="partner-row"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div className={`logo ${p.cls}`}>{p.initial}</div>
            <div className="name">{p.name}</div>
            <div className="ext">↗</div>
          </Link>
        ))}
      </section>
    </>
  );
}
