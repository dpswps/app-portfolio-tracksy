"use client";

import Link from "next/link";
import FeedCard from "@/features/community/FeedCard";
import { communityPosts } from "@/data/communityPosts";
import { useAppStore } from "@/stores/useAppStore";

const collections = [
  { title: "오늘 러닝 무드", emoji: "☁️", g: "linear-gradient(135deg,#9CA3AF,#4B5563)" },
  { title: "데일리 러닝", emoji: "🏆", g: "linear-gradient(135deg,#FBBF24,#F59E0B)" },
  { title: "야경 러닝", emoji: "🌙", g: "linear-gradient(135deg,#1E3A8A,#312E81)" },
  { title: "감성 러닝", emoji: "💜", g: "linear-gradient(135deg,#A78BFA,#7C3AED)" },
];

export default function CommunityPage() {
  const tab = useAppStore((s) => s.communityTab);
  const setTab = useAppStore((s) => s.setCommunityTab);

  return (
    <section className="community-screen">
      <div className="comm-search">
        <div className="comm-search-box">
          <svg className="search-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <span className="search-tags">#오운완  #생활런  #응원해</span>
        </div>
        <button className="comm-bookmark" aria-label="저장">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </button>
      </div>

      <div className="comm-tabs">
        <button className={`ct-tab${tab === "hot" ? " active" : ""}`} onClick={() => setTab("hot")}>
          Hot
        </button>
        <button className={`ct-tab${tab === "new" ? " active" : ""}`} onClick={() => setTab("new")}>
          New
        </button>
      </div>

      <div className="comm-collections-wrap">
        <div className="cc-head">
          <div className="cc-title">
            인기 모음집 <span className="cc-emoji">👟</span>
          </div>
          <Link href="/community/compose" className="cc-write" style={{ textDecoration: "none" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>글쓰기</span>
          </Link>
        </div>
        <div className="cc-grid">
          {collections.map((c) => (
            <div key={c.title} className="cc-tile" style={{ background: c.g }}>
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
    </section>
  );
}
