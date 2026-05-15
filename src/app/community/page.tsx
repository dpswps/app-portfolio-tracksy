"use client";

import Link from "next/link";
import FeedCard from "@/features/community/FeedCard";
import { communityPosts } from "@/data/communityPosts";
import { useAppStore } from "@/stores/useAppStore";

/* 인기 모음집 — 각 타일 클릭 시 /community/[postId] 로 이동.
 * 썸네일 이미지(img)와 연결된 게시글의 이미지가 동일하도록 communityPosts.ts 의
 * id 201/202/203/204 와 매칭해두었음. */
const collections = [
  { postId: 201, title: "오늘 러닝 무드", emoji: "🎧", img: "/card_3-1.png" },
  { postId: 202, title: "데일리 러닝",   emoji: "📅", img: "/card_3-3.png" },
  { postId: 203, title: "야경 러닝",     emoji: "🌙", img: "/card_3-4.png" },
  { postId: 204, title: "감성 러닝",     emoji: "💜", img: "/card_3-2.png" },
];

/* NEW 탭에서 보여줄 러닝 카드들 — public/community-cards.png 한 장에 4x2 = 8개
 * 카드 사진이 들어있어 background-position 으로 슬라이스. spriteIdx 0~7.
 * 거리/페이스/시간 정보는 배경 사진 자체에 이미 인쇄돼 있으므로 별도 텍스트 오버레이는 하지 않는다.
 * 좌측 상단 닉네임만 표시. */
const NEW_RUNNING_CARDS = [
  { id: 1, user: "달리는하늘", avatarBg: "linear-gradient(135deg,#A78BFA,#7C3AED)", spriteIdx: 0 },
  { id: 2, user: "한강러너",   avatarBg: "linear-gradient(135deg,#34D399,#10B981)", spriteIdx: 1 },
  { id: 3, user: "마라톤준비", avatarBg: "linear-gradient(135deg,#FBBF24,#F59E0B)", spriteIdx: 2 },
  { id: 4, user: "트레일러너", avatarBg: "linear-gradient(135deg,#F472B6,#EC4899)", spriteIdx: 3 },
  { id: 5, user: "초록숲러닝", avatarBg: "linear-gradient(135deg,#60A5FA,#3B82F6)", spriteIdx: 4 },
  { id: 6, user: "야경러너",   avatarBg: "linear-gradient(135deg,#A78BFA,#7C3AED)", spriteIdx: 5 },
  { id: 7, user: "달빛러너",   avatarBg: "linear-gradient(135deg,#FB923C,#F97316)", spriteIdx: 6 },
  { id: 8, user: "이른새벽러너", avatarBg: "linear-gradient(135deg,#22D3EE,#0891B2)", spriteIdx: 7 },
];

export default function CommunityPage() {
  const tab = useAppStore((s) => s.communityTab);
  const setTab = useAppStore((s) => s.setCommunityTab);
  const userPosts = useAppStore((s) => s.userCommunityPosts);
  // 사용자가 직접 올린 게시글이 항상 기본 게시글보다 위(최신)에 오도록 앞에 붙여서 머지.
  const allPosts = [...userPosts, ...communityPosts];

  return (
    <section className="community-screen">
      <div className="comm-search">
        {/* 검색 박스 클릭 시 검색 페이지로 이동. Link 로 감싸서 접근성 유지. */}
        <Link
          href="/community/search"
          className="comm-search-box"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <svg className="search-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <span className="search-tags">#오운완  #생활런  #응원해</span>
        </Link>
      </div>

      {/* Hot / New 탭 + 우측 글쓰기 버튼 한 줄로. */}
      <div className="comm-tabs">
        <button className={`ct-tab${tab === "hot" ? " active" : ""}`} onClick={() => setTab("hot")}>
          Hot
        </button>
        <button className={`ct-tab${tab === "new" ? " active" : ""}`} onClick={() => setTab("new")}>
          New
        </button>
        <Link href="/community/compose" className="cc-write" style={{ textDecoration: "none", marginLeft: "auto" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>글쓰기</span>
        </Link>
      </div>

      {tab === "hot" ? (
        <>
          <div className="comm-collections-wrap">
            <div className="cc-head">
              <div className="cc-title">
                인기 모음집 <span className="cc-emoji">👟</span>
              </div>
            </div>
            <div className="cc-grid">
              {collections.map((c) => (
                <Link
                  key={c.title}
                  href={`/community/${c.postId}`}
                  className="cc-tile"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    className="cc-thumb"
                    style={{ background: `url(${c.img}) center/cover no-repeat` }}
                  />
                  <div className="cc-label">
                    {c.title} <span>{c.emoji}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="comm-feed">
            {allPosts.map((p) => (
              <FeedCard key={p.id} p={p} />
            ))}
          </div>
        </>
      ) : (
        /* NEW 탭 — 최근 업로드된 러닝 카드들을 2열 그리드로 노출.
         * 카드 배경 사진은 public/community-cards.png 스프라이트(4x2)에서 슬라이스.
         * Hot 탭 thumbnail 과 동일한 구성: 좌상단 닉네임 + 우상단 북마크 + 좌하단 좋아요. */
        <>
          <div className="cnew-grid">
            {NEW_RUNNING_CARDS.map((c) => (
              <Link
                key={c.id}
                href={`/community/${c.id}`}
                className="cnew-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className={`cnew-bg cnew-bg-${c.spriteIdx}`} aria-hidden="true" />
                <div className="cnew-grad" />
                {/* 좌측 상단 — 닉네임 + 아바타 */}
                <div className="cnew-userline">
                  <div
                    className="cnew-avatar"
                    style={{ background: c.avatarBg }}
                  />
                  <span className="cnew-username">{c.user}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
