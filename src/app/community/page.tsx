"use client";

import Link from "next/link";
import { useMemo } from "react";
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

/* Hot 탭 랭킹 기준이 되는 인기 검색어 5종.
 * 게시글의 tags 필드에 이 중 하나라도 포함돼 있어야 Hot 피드에 노출됨.
 * 검색 페이지의 POPULAR_SEARCHES 와 같은 키워드 집합. */
const POPULAR_TAGS = [
  "#한강러닝",
  "#5km도전",
  "#모닝런",
  "#러닝메이트",
  "#서울러닝코스",
];

/** 비교용 정규화 — # 제거, 공백 제거, 소문자. */
function normalizeTag(s: string): string {
  return s.replace(/^#/, "").replace(/\s+/g, "").toLowerCase();
}
const POPULAR_TAGS_NORM = POPULAR_TAGS.map(normalizeTag);

/** 게시글의 tags 문자열을 정규화된 토큰 배열로 분해. */
function postTagTokens(tagsRaw: string | undefined): string[] {
  if (!tagsRaw) return [];
  return tagsRaw
    .split(/[\s,]+/)
    .map(normalizeTag)
    .filter(Boolean);
}

/** 게시글이 인기 태그 중 하나라도 포함하는지. */
function hasAnyPopularTag(tagsRaw: string | undefined): boolean {
  const tokens = postTagTokens(tagsRaw);
  return tokens.some((t) => POPULAR_TAGS_NORM.includes(t));
}

/** 게시글의 "인기도 점수" — 매칭된 인기 태그 수 × 200 + likes.
 *  인기 태그를 더 많이 단 글일수록 위로 올라오고, 같은 카테고리 내에선
 *  좋아요가 많은 글이 먼저. */
function popularityScore(p: { tags?: string; likes?: number }): number {
  const tokens = postTagTokens(p.tags);
  const matches = tokens.filter((t) => POPULAR_TAGS_NORM.includes(t)).length;
  return matches * 200 + (p.likes ?? 0);
}

export default function CommunityPage() {
  const tab = useAppStore((s) => s.communityTab);
  const setTab = useAppStore((s) => s.setCommunityTab);
  const userPosts = useAppStore((s) => s.userCommunityPosts);
  // 머지 — 사용자 게시글이 항상 기본 샘플 위에 오도록 앞에 붙임.
  const allPosts = useMemo(
    () => [...userPosts, ...communityPosts],
    [userPosts],
  );

  /**
   * Hot 피드 — 인기 검색어 5종 중 하나라도 단 게시글만 노출.
   *   - 인기 태그 매칭 수 × 200 + likes 로 정렬해서 "인기 키워드를 많이 단 글" +
   *     "좋아요 많은 글" 이 위로 올라오게 한다.
   *   - 사용자가 방금 작성한 글이라도 인기 태그가 없으면 Hot 에 안 뜸 →
   *     New 탭에서만 노출. (사용자의 글이 Hot 에 자동으로 올라가는 것을 방지.)
   */
  const hotPosts = useMemo(() => {
    return allPosts
      .filter((p) => hasAnyPopularTag(p.tags))
      .slice()
      .sort((a, b) => popularityScore(b) - popularityScore(a));
  }, [allPosts]);

  /**
   * New 피드 — 모든 게시글을 날짜 내림차순 정렬.
   *   - 사용자가 방금 등록한 글은 todayKey() 기반 날짜라 자연스럽게 최상단.
   *   - 인기 태그 유무와 무관 — 모든 신규 글이 여기 노출됨.
   */
  const newPosts = useMemo(() => {
    return allPosts.slice().sort((a, b) => {
      const da = a.date ?? "";
      const db = b.date ?? "";
      return db.localeCompare(da);
    });
  }, [allPosts]);

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

          {/* Hot 피드 — 인기 태그 글만 + 인기도 정렬. 사용자가 방금 쓴 글은
              인기 태그가 없으면 안 보이는 게 정상(=New 탭에서 노출). */}
          <div className="comm-feed">
            {hotPosts.map((p) => (
              <FeedCard key={p.id} p={p} />
            ))}
          </div>
        </>
      ) : (
        /* NEW 탭 — 최근 게시글을 날짜 내림차순으로 2열 그리드 노출.
         * 사용자가 방금 작성한 글이 자동으로 최상단에 뜬다.
         * 카드 배경: 게시글의 image / bg 그대로 사용. */
        <>
          <div className="cnew-grid">
            {newPosts.map((p) => (
              <Link
                key={p.id}
                href={`/community/${p.id}`}
                className="cnew-card"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  className="cnew-bg"
                  style={
                    p.image
                      ? {
                          backgroundImage: `url(${p.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : { background: p.bg }
                  }
                  aria-hidden="true"
                />
                <div className="cnew-grad" />
                <div className="cnew-userline">
                  <div
                    className="cnew-avatar"
                    style={{
                      background:
                        p.avatarBg ??
                        "linear-gradient(135deg,#A78BFA,#7C3AED)",
                    }}
                  />
                  <span className="cnew-username">{p.user ?? "익명"}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
