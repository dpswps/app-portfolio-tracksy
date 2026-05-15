import Link from "next/link";
import type { CommunityPost } from "@/types";
import { useAppStore } from "@/stores/useAppStore";

/**
 * 사용자 표시 — 프로필 아바타 + 닉네임. 카드 좌측 상단에 위치.
 * 이전에 아바타 우하단에 있던 "+" 팔로우 버튼만 제거됨 (감싸던 작은 보라 동그라미 포함).
 * 아바타 본체와 닉네임은 그대로 유지.
 */
function UserLine({ user, avatarBg, dark }: { user?: string; avatarBg?: string; dark?: boolean }) {
  if (!user) return null;
  return (
    <div className={`fc-userline${dark ? " dark" : ""}`}>
      <div
        className="fc-avatar"
        style={{
          background: avatarBg || "linear-gradient(135deg,#A78BFA,#7C3AED)",
        }}
      />
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
      {/* 좋아요 — 두번째 디자인 사진처럼 보라 하트 + 카운트로 분리해서 또렷하게.
          fc-likes-heart 가 보라(#723BE4)색을, fc-likes-count 가 흰색 굵은 글씨를 사용. */}
      <div className="fc-likes">
        <span className="fc-likes-heart">❤</span>
        <span className="fc-likes-count">{p.likes.toLocaleString()}</span>
      </div>
    </Link>
  );
}
