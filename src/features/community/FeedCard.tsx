import Link from "next/link";
import { useState } from "react";
import type { CommunityPost } from "@/types";
import { useAppStore } from "@/stores/useAppStore";

function UserLine({ user, avatarBg, dark }: { user?: string; avatarBg?: string; dark?: boolean }) {
  const [followed, setFollowed] = useState(false);
  if (!user) return null;
  const onFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFollowed((v) => !v);
  };
  return (
    <div className={`fc-userline${dark ? " dark" : ""}`}>
      <div
        className="fc-avatar"
        style={{ background: avatarBg || "linear-gradient(135deg,#A78BFA,#7C3AED)" }}
      >
        <button
          type="button"
          className={`fc-followbtn${followed ? " followed" : ""}`}
          onClick={onFollow}
          aria-label="팔로우"
        >
          {followed ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </button>
      </div>
      <span className="fc-username-text">{user}</span>
    </div>
  );
}

export default function FeedCard({ p }: { p: CommunityPost }) {
  const showToast = useAppStore((s) => s.showToast);
  const togglePostSaved = useAppStore((s) => s.togglePostSaved);
  const saved = useAppStore((s) => Boolean(s.savedPosts[String(p.id)]));
  const onBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = togglePostSaved(p.id);
    showToast(next ? "저장됨" : "저장 취소됨");
  };

  if (p.type === "stats") {
    return (
      <Link href={`/community/${p.id}`} className="feed-card stats" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
        <div
        className="fc-bg"
        style={{
          background: p.image
            ? `url(${p.image}) center/cover no-repeat`
            : p.bg,
        }}
      />
        <button className={`fc-bm${saved ? " saved" : ""}`} onClick={onBookmark}>
          <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </button>
        <UserLine user={p.user} avatarBg={p.avatarBg} dark />
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
        <div className="fc-likes">
          <span className="fc-likes-heart">❤</span>
          <span className="fc-likes-count">{p.likes}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/community/${p.id}`}
      className={`feed-card${p.tall ? " tall" : ""}`}
      style={{ display: "block", textDecoration: "none", color: "inherit" }}
    >
      <div
        className="fc-bg"
        style={{
          background: p.image
            ? `url(${p.image}) center/cover no-repeat`
            : p.bg,
        }}
      />
      <button className={`fc-bm${saved ? " saved" : ""}`} onClick={onBookmark}>
        <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
      </button>
      <UserLine user={p.user} avatarBg={p.avatarBg} />
      <div className="fc-likes">❤ {p.likes}</div>
    </Link>
  );
}
