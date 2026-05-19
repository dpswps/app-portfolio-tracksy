"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

/* ──────────────────────────────────────────────────────────
 * 커뮤니티 → 검색
 *
 * 진입: 커뮤니티 메인의 검색 박스 탭 → /community/search
 * 구성:
 *   1) 상단 검색 입력 + 뒤로가기 꺾쇠
 *   2) 인기 검색어 (Top 5, 보라 해시태그)
 *   3) 최근 검색어 (chip 형식, 삭제 가능)
 *
 * 인기 게시글 섹션은 사용자 요청으로 제거됨 — 최근 검색어 아래는 빈 공간.
 *
 * 컬러:
 *   - 라이트 라벤더 배경: #F4F3FE
 *   - 보라 강조 텍스트: #723BE4
 * ────────────────────────────────────────────────────────── */

/* 인기 검색어 후보 풀 — 화면에는 검색 횟수(`communitySearchCounts`) 내림차순
 * 으로 상위 5개만 노출된다. postId 는 (현재는 사용하지 않지만) 호환을 위해
 * 시그니처에 남겨둠. 새 인기 검색어를 추가하려면 이 배열에만 등록하면 자동으로
 * 후보 풀에 들어가고, 카운트가 0 이상이면 노출 대상이 된다. */
const POPULAR_SEARCHES: Array<{ keyword: string; postId: number }> = [
  { keyword: "#한강러닝", postId: 101 },
  { keyword: "#5km도전", postId: 102 },
  { keyword: "#모닝런", postId: 101 },
  { keyword: "#러닝메이트", postId: 4 },
  { keyword: "#서울러닝코스", postId: 103 },
];

/** 검색어 정규화 — store 의 incrementCommunitySearch / communitySearchCounts
 *  키 규칙과 동일하게: `#` 제거 + 공백 제거 + 소문자. */
function normalizeSearchKey(raw: string): string {
  return raw.replace(/^#/, "").replace(/\s+/g, "").toLowerCase();
}

/* 최근 검색어는 이제 store 의 communityRecentSearches 를 사용한다. 초기 기본
 * 키워드 목록(`한강 러닝`, `페이스 6분대` 등)은 사용자 요청으로 모두 제거됨 →
 * 사용자가 실제로 검색한 키워드만 최근 검색어로 누적되며, 최대 5개까지만 노출. */

/* 인기 게시글 섹션은 화면에서 제거되었음 (사용자 요청 — 빈 공간으로 둠).
 * 관련 POPULAR_POSTS 상수와 렌더 블록도 함께 제거. 추후 다시 노출이 필요하면
 * git history 에서 복원 가능. */

export default function CommunitySearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  // 인기 검색어 카운트 — store 에서 영구 보존되는 검색 횟수 맵.
  const searchCounts = useAppStore((s) => s.communitySearchCounts);
  const incrementCommunitySearch = useAppStore(
    (s) => s.incrementCommunitySearch,
  );
  // 최근 검색어 — store 에 보존되어 페이지 이동/새로고침 후에도 유지.
  // 최대 5개. 사용자가 검색할 때마다 store 액션을 통해 최상단에 추가됨.
  // (예전에 저장된 persist state 에는 이 필드가 없을 수 있어 `?? []` 폴백.)
  const recentsRaw = useAppStore((s) => s.communityRecentSearches);
  const recents = recentsRaw ?? [];
  const addCommunityRecentSearch = useAppStore(
    (s) => s.addCommunityRecentSearch,
  );
  const removeCommunityRecentSearch = useAppStore(
    (s) => s.removeCommunityRecentSearch,
  );

  /**
   * 인기 검색어 노출 순서 결정.
   * - 후보 풀(POPULAR_SEARCHES) 각각의 검색 횟수를 store 에서 조회
   * - 카운트 내림차순으로 정렬하고 상위 5개만 표시
   * - 동률일 때는 후보 풀의 원래 등록 순서를 유지(stable sort)
   * 사용자가 특정 키워드를 더 자주 검색할수록 그 키워드가 1위로 올라옴.
   */
  const rankedPopular = useMemo(() => {
    return POPULAR_SEARCHES.map((entry, idx) => ({
      ...entry,
      count: searchCounts?.[normalizeSearchKey(entry.keyword)] ?? 0,
      origIdx: idx,
    }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.origIdx - b.origIdx;
      })
      .slice(0, 5);
  }, [searchCounts]);

  const onCancel = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/community");
    }
  };

  const onPickKeyword = (kw: string) => {
    setQuery(kw);
    // 최근 검색어 맨 앞에 추가 (store 액션이 중복 제거 + 최대 5개 제한 처리).
    addCommunityRecentSearch(kw);
  };

  /**
   * 검색 실행 — 입력값을 최근 검색어로 등록한 뒤, 검색 결과 페이지(태그 게시판
   * 라우트를 재사용) 로 이동한다.
   *
   * 호출 시점:
   *   1) 검색 입력에서 Enter 키 입력
   *   2) 좌측 돋보기 아이콘 버튼 클릭
   *   3) 최근 검색어 칩의 텍스트 클릭
   *
   * 빈 문자열이면 아무 동작도 하지 않는다. 검색어는 URL 인코딩되어 라우트로 전달.
   */
  const executeSearch = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    // 최근 검색어 최상단에 추가(중복 제거 + 최대 5개로 자동 제한).
    addCommunityRecentSearch(q);
    // 검색 횟수 1 증가 — 인기 검색어 순위에 즉시 반영(useMemo 가 재계산).
    incrementCommunitySearch(q);
    router.push(`/community/tag/${encodeURIComponent(q)}`);
  };

  /** 인기 검색어 클릭 시 → 키워드를 최근 검색어로 등록하고, 해당 태그를 가진
   *  게시글들이 모인 태그 게시판(`/community/tag/[tag]`) 으로 이동.
   *  (기존 `/community/[postId]` 단일 게시글 이동은 더 이상 사용하지 않음 —
   *   사용자가 인기 검색어를 누르면 해당 태그의 글 목록을 보고 싶어 하는 게
   *   더 자연스럽다.)
   *  `postId` 인자는 호환을 위해 시그니처에 남겨두지만 더는 참조하지 않음. */
  const onPickPopularSearch = (keyword: string, _postId?: number) => {
    void _postId;
    onPickKeyword(keyword);
    // 인기 검색어 클릭도 "검색"으로 간주 — 카운트 증가 → 다음 진입 시 더 위로.
    incrementCommunitySearch(keyword);
    router.push(`/community/tag/${encodeURIComponent(keyword)}`);
  };

  const removeRecent = (kw: string) => {
    removeCommunityRecentSearch(kw);
  };

  return (
    <section className="cs-screen">
      {/* 상단 — 왼쪽 뒤로가기 꺾쇠 + 검색 바.
          기존 우측 "취소" 버튼은 제거하고, 검색창 왼쪽 외부에 뒤로 가기 chevron
          아이콘 버튼을 배치. 클릭 시 커뮤니티 메인(/community) 으로 이동. */}
      <div className="cs-topbar">
        <button
          type="button"
          className="cs-back"
          aria-label="뒤로 가기"
          onClick={onCancel}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </button>
        {/* 검색 박스 — `<form>` 으로 감싸서 모바일 키보드의 "확인/검색" 버튼
            (Enter) 으로도 검색이 실행되도록 한다. 좌측 돋보기 아이콘은 버튼화
            해서 마우스 클릭으로도 검색 트리거 가능. */}
        <form
          className="cs-search-box"
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch(query);
          }}
          role="search"
        >
          <button
            type="submit"
            className="cs-search-ic-btn"
            aria-label="검색 실행"
          >
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
          </button>
          <input
            type="text"
            className="cs-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="#오운완  #생활런  #응원해"
            autoFocus
            enterKeyHint="search"
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
        </form>
      </div>

      {/* 1) 인기 검색어 — 검색 횟수 내림차순 상위 5개 노출.
          rankedPopular 는 communitySearchCounts 가 변할 때마다 자동 재정렬 →
          사용자가 어떤 검색어를 더 많이 검색할수록 위로 올라온다. */}
      <div className="cs-section cs-section-card">
        <div className="cs-section-title">인기 검색어</div>
        <ol className="cs-popular-list">
          {rankedPopular.map((entry, i) => (
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
                  onClick={() => executeSearch(kw)}
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

      {/* 인기 게시글 섹션 제거됨 — 사용자가 인기 검색어와 최근 검색어 아래 공간을
          비워두기를 원해서 의도적으로 빈 영역으로 남긴다. POPULAR_POSTS / cs-hot-*
          관련 코드는 미사용 상태로 두되, 추후 다시 노출할 가능성에 대비해 데이터
          정의는 유지한다. */}
    </section>
  );
}
