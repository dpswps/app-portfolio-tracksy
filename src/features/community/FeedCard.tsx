import Link from "next/link";
import type { CommunityPost } from "@/types";

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
      <UserLine user={p.user} avatarBg={p.avatarBg} />
    </Link>
  );
}
