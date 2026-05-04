import Link from "next/link";
import type { CommunityPost } from "@/types";
import { useAppStore } from "@/stores/useAppStore";

export default function FeedCard({ p }: { p: CommunityPost }) {
  const showToast = useAppStore((s) => s.showToast);
  const onBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showToast("저장됨");
  };

  if (p.type === "stats") {
    return (
      <Link href={`/community/${p.id}`} className="feed-card stats" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
        <div className="fc-bg" style={{ background: p.bg }} />
        <button className="fc-bm" onClick={onBookmark}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </button>
        {p.user && <div className="fc-username">{p.user}</div>}
        <div className="fc-big">{p.dist}</div>
        <div className="fc-stats">
          <div>
            <b>{p.pace}</b>
            <i>페이스</i>
          </div>
          <div>
            <b>{p.time}</b>
            <i>시간</i>
          </div>
          <div>
            <b>{p.cal}</b>
            <i>kcal</i>
          </div>
          <div>
            <b>{p.extra}</b>
            <i>거리</i>
          </div>
        </div>
        <div className="fc-likes">❤ {p.likes}</div>
      </Link>
    );
  }

  return (
    <Link
      href={`/community/${p.id}`}
      className={`feed-card${p.tall ? " tall" : ""}`}
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div className="fc-bg" style={{ background: p.bg }} />
      <button className="fc-bm" onClick={onBookmark}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
      </button>
      {p.brand && <div className="fc-brand">{p.brand}</div>}
      <div className="fc-top">
        {p.user && <div className="fc-user">{p.user}</div>}
        {p.dist && <div className="fc-dist">{p.dist}</div>}
        {p.time && <div className="fc-time">{p.time}</div>}
      </div>
      <div className="fc-likes">❤ {p.likes}</div>
    </Link>
  );
}
