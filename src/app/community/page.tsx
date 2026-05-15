"use client";

import Link from "next/link";
import FeedCard from "@/features/community/FeedCard";
import { communityPosts } from "@/data/communityPosts";
import { useAppStore } from "@/stores/useAppStore";

const collections = [
  { title: "오늘 러닝 무드", emoji: "🎧", img: "/collection1.jpg" },
  { title: "데일리 러닝", emoji: "📅", img: "/collection2.jpg" },
  { title: "야경 러닝", emoji: "🌙", img: "/collection3.jpg" },
  { title: "감성 러닝", emoji: "💜", img: "/collection4.jpg" },
];

/* NEW 탭에서 보여줄 러닝 카드들 — public/community-cards.png 한 장에 4x2 = 8개
 * 카드 사진이 들어있어 background-position 으로 슬라이스. spriteIdx 0~7. */
const NEW_RUNNING_CARDS = [
  { id: 1, dist: "8.24", pace: "5'12\"", time: "42:55", user: "달리는하늘", spriteIdx: 0 },
  { id: 2, dist: "6.47", pace: "5'46\"", time: "37:21", user: "한강러너", spriteIdx: 1 },
  { id: 3, dist: "10.18", pace: "5'02\"", time: "51:13", user: "마라톤준비", spriteIdx: 2 },
  { id: 4, dist: "12.33", pace: "5'30\"", time: "1:07:42", user: "트레일러너", spriteIdx: 3 },
  { id: 5, dist: "7.15", pace: "6'05\"", time: "43:30", user: "초록숲러닝", spriteIdx: 4 },
  { id: 6, dist: "9.01", pace: "5'24\"", time: "48:39", user: "야경러너", spriteIdx: 5 },
  { id: 7, dist: "5.21", pace: "6'12\"", time: "32:18", user: "달빛러너", spriteIdx: 6 },
  { id: 8, dist: "11.27", pace: "5'18\"", time: "59:42", user: "이른새벽러너", spriteIdx: 7 },
];

export default function CommunityPage() {
  const tab = useAppStore((s) => s.communityTab);
  const setTab = useAppStore((s) => s.setCommunityTab);

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
        {/* 북마크 버튼 — 즐겨찾기 페이지로 이동 */}
        <Link href="/community/favorites" className="comm-bookmark" aria-label="즐겨찾기">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
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
                <div key={c.title} className="cc-tile">
                  <div
                    className="cc-thumb"
                    style={{ background: `url(${c.img}) center/cover no-repeat` }}
                  />
                  <div className="cc-label">
                    {c.title} <span>{c.emoji}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="comm-feed">
            {communityPosts.map((p) => (
              <FeedCard key={p.id} p={p} />
            ))}
          </div>
        </>
      ) : (
        /* NEW 탭 — 최근 업로드된 러닝 카드들을 2열 그리드로 노출.
         * 카드 배경 사진은 public/community-cards.png 스프라이트(4x2)에서 슬라이스. */
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
                <div className="cnew-info">
                  <div className="cnew-dist">
                    {c.dist}
                    <small>km</small>
                  </div>
                  <div className="cnew-stats">
                    <span>
                      <b>{c.pace}</b> /km
                    </span>
                    <span>
                      <b>{c.time}</b>
                    </span>
                  </div>
                  <div className="cnew-user">@{c.user}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
