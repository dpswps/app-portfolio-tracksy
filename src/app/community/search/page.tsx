"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/* ──────────────────────────────────────────────────────────
 * 커뮤니티 → 검색
 *
 * 진입: 커뮤니티 메인의 검색 박스 탭 → /community/search
 * 구성:
 *   1) 상단 검색 입력 + 취소 버튼
 *   2) 인기 검색어 (Top 5, 보라 해시태그)
 *   3) 최근 검색어 (chip 형식, 삭제 가능)
 *   4) 추천 사용자 (3명, 둥근 프로필 사진 + 팔로우 버튼)
 *   5) 인기 게시글 (3개, HOT 이미지 사용)
 *
 * 컬러:
 *   - 라이트 라벤더 배경: #F4F3FE
 *   - 보라 강조 텍스트: #723BE4
 * ────────────────────────────────────────────────────────── */

/* 인기 검색어 — 각 키워드에 대응되는 게시글 ID. 클릭 시 해당 게시글 상세로 이동. */
const POPULAR_SEARCHES: Array<{ keyword: string; postId: number }> = [
  { keyword: "#한강러닝", postId: 101 },     // 한강에서 만난 새벽 풍경
  { keyword: "#5km도전", postId: 102 },     // 숲길 따라 10km 완주
  { keyword: "#모닝런", postId: 101 },       // 새벽 풍경
  { keyword: "#러닝메이트", postId: 4 },     // 이용민 게시글
  { keyword: "#서울러닝코스", postId: 103 }, // 야경 러닝의 묘미
];

const RECENT_SEARCHES_DEFAULT = [
  "한강 러닝",
  "페이스 6분대",
  "러닝화 추천",
  "야간 러닝",
];

/* 인기 게시글 — communityPosts 에 추가된 id 101/102/103 과 일대일 대응.
 * 썸네일을 클릭하면 동일한 게시글이 열리도록 ID 가 정확히 매칭됨. */
const POPULAR_POSTS = [
  {
    id: 101,
    title: "한강에서 만난 새벽 풍경",
    author: "이른새벽러너",
    likes: 1342,
    spriteIdx: 0,
  },
  {
    id: 102,
    title: "숲길 따라 10km 완주",
    author: "초록숲러닝",
    likes: 987,
    spriteIdx: 1,
  },
  {
    id: 103,
    title: "야경 러닝의 묘미",
    author: "달빛러너",
    likes: 1521,
    spriteIdx: 2,
  },
];

export default function CommunitySearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // 최근 검색어는 로컬 상태 — 칩 X 로 개별 삭제 가능
  const [recents, setRecents] = useState<string[]>(RECENT_SEARCHES_DEFAULT);

  const onCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/community");
    }
  };

  const onPickKeyword = (kw: string) => {
    setQuery(kw);
    // 최근 검색어 맨 앞에 옮기기 (이미 있으면 중복 제거)
    setRecents((prev) => [kw, ...prev.filter((r) => r !== kw)].slice(0, 10));
  };

  /** 인기 검색어/최근 검색어/태그 칩 클릭 시 → 키워드를 최근 검색어로 등록하고
   *  연결된 게시글 상세로 이동. postId 가 없으면 그냥 검색어만 입력창에 채움. */
  const onPickPopularSearch = (keyword: string, postId?: number) => {
    onPickKeyword(keyword);
    if (postId != null) {
      router.push(`/community/${postId}`);
    }
  };

  const removeRecent = (kw: string) => {
    setRecents((prev) => prev.filter((r) => r !== kw));
  };

  return (
    <section className="cs-screen">
      {/* 상단 검색 바 + 취소 */}
      <div className="cs-topbar">
        <div className="cs-search-box">
          <svg
            className="cs-search-ic"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="cs-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="#오운완  #생활런  #응원해"
            autoFocus
          />
          {query && (
            <button
              type="button"
              className="cs-clear"
              aria-label="입력 지우기"
              onClick={() => setQuery("")}
            >
              ×
            </button>
          )}
        </div>
        <button type="button" className="cs-cancel" onClick={onCancel}>
          취소
        </button>
      </div>

      {/* 1) 인기 검색어 — 클릭 시 해당 키워드와 연관된 게시글 상세 페이지로 이동 */}
      <div className="cs-section cs-section-card">
        <div className="cs-section-title">인기 검색어</div>
        <ol className="cs-popular-list">
          {POPULAR_SEARCHES.map((entry, i) => (
            <li key={entry.keyword}>
              <button
                type="button"
                className="cs-popular-item"
                onClick={() => onPickPopularSearch(entry.keyword, entry.postId)}
              >
                <span className="cs-rank">{i + 1}</span>
                <span className="cs-keyword">{entry.keyword}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* 2) 최근 검색어 */}
      <div className="cs-section">
        <div className="cs-section-title">최근 검색어</div>
        {recents.length === 0 ? (
          <div className="cs-empty">최근 검색어가 없어요</div>
        ) : (
          <div className="cs-recent-wrap">
            {recents.map((kw) => (
              <span key={kw} className="cs-recent-chip">
                <button
                  type="button"
                  className="cs-recent-text"
                  onClick={() => onPickKeyword(kw)}
                >
                  {kw}
                </button>
                <button
                  type="button"
                  className="cs-recent-x"
                  aria-label={`${kw} 삭제`}
                  onClick={() => removeRecent(kw)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3) 인기 게시글 — 추천 사용자 자리에 노출 (추천 사용자 섹션 제거).
          닉네임 앞 @ 제거하고 좋아요 수와 한 줄에 표시. 카드 아래 여백 줄여서
          한 화면에 스크롤 없이 다 보이도록. */}
      <div className="cs-section cs-section-card cs-section-posts">
        <div className="cs-section-title">인기 게시글</div>
        <div className="cs-hot-grid">
          {POPULAR_POSTS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="cs-hot-card"
              onClick={() => router.push(`/community/${p.id}`)}
            >
              <div
                className={`cs-hot-img cs-hot-img-${p.spriteIdx}`}
                aria-hidden="true"
              />
              <div className="cs-hot-info">
                <div className="cs-hot-title">{p.title}</div>
                <div className="cs-hot-author">
                  <span className="cs-hot-name">{p.author}</span>
                  <span className="cs-hot-likes">♥ {p.likes.toLocaleString()}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
