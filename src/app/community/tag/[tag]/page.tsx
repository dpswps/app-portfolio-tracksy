"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { communityPosts } from "@/data/communityPosts";
import { useAppStore } from "@/stores/useAppStore";

/* ──────────────────────────────────────────────────────────
 * 커뮤니티 → 검색 결과/태그 게시판  (`/community/tag/[tag]`)
 *
 * 진입:
 *   1) 검색 페이지의 "인기 검색어" 클릭 → "#한강러닝" 같이 정확한 태그
 *   2) 검색 입력에서 Enter / 돋보기 버튼 → "5km 도전", "한강" 같은 자유 검색어
 *   3) 최근 검색어 칩 클릭 → 위 두 경로와 동일하게 재사용
 *
 * 역할: 입력된 검색어와 관련된 게시글을 그리드로 노출.
 *       태그뿐 아니라 캡션 · 유저명까지 매칭 범위를 넓혀 일반 검색처럼 동작.
 *
 * 매칭 규칙(관대한 부분 일치):
 *   - 검색어 정규화 — # 제거 + 공백 제거 + 소문자.
 *   - 게시글 tags / caption / user 도 동일 방식으로 정규화한 뒤
 *     검색어가 substring 인지 확인. 셋 중 하나라도 매칭되면 결과에 포함.
 *   - 예) "5KM 도전" → "5km도전" → "#5km도전" 태그를 가진 글 매칭.
 *   - 예) "한강" → "한강" → "#한강러닝" 태그 또는 캡션에 "한강" 포함된 글 매칭.
 *
 * UI 구성:
 *   1) 상단 — 왼쪽 뒤로가기 꺾쇠 + 검색어 라벨 + 우측 글쓰기 버튼.
 *   2) 그리드 — `.cnew-grid` / `.cnew-card` 스타일 재사용.
 *   3) 매칭 0개면 빈 상태 UI 노출.
 * ────────────────────────────────────────────────────────── */

/** 검색어/태그 비교용 정규화: # 제거 + 모든 공백 제거 + 소문자. */
function normalize(s: string): string {
  return s.replace(/^#/, "").replace(/\s+/g, "").toLowerCase();
}

export default function CommunityTagBoardPage() {
  const router = useRouter();
  const params = useParams<{ tag: string }>();
  // URL 의 [tag] 세그먼트는 인코딩되어 들어옴 — 화면에 보여줄 때는 디코드 필요.
  const rawTag = decodeURIComponent(String(params?.tag ?? ""));
  // 헤더 라벨 — 사용자가 입력한 그대로 보여준다 (`#한강러닝`, `5KM 도전` 등).
  const tagLabel = rawTag.trim();
  // 비교용 정규화 키.
  const queryNorm = normalize(rawTag);

  const userPosts = useAppStore((s) => s.userCommunityPosts);

  /**
   * 검색어가 어디든 매칭되는 게시글 추출.
   *
   * 매칭 우선순위(아래로 갈수록 약한 매칭):
   *   1) tags 토큰 중 하나라도 검색어를 포함 (정규화 후)
   *   2) caption 에 검색어 포함 (정규화 후)
   *   3) user 닉네임에 검색어 포함 (정규화 후)
   *
   * 사용자가 직접 올린 글이 항상 최상단에 오도록 앞에 머지.
   */
  const matched = useMemo(() => {
    if (!queryNorm) return [];
    const all = [...userPosts, ...communityPosts];
    return all.filter((p) => {
      // 1) tags
      const tagsRaw = (p.tags ?? "").trim();
      if (tagsRaw) {
        const tokens = tagsRaw
          .split(/[\s,]+/)
          .map((s) => normalize(s))
          .filter(Boolean);
        if (tokens.some((t) => t.includes(queryNorm))) return true;
      }
      // 2) caption
      if (p.caption && normalize(p.caption).includes(queryNorm)) return true;
      // 3) user
      if (p.user && normalize(p.user).includes(queryNorm)) return true;
      return false;
    });
  }, [userPosts, queryNorm]);

  const back = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/community");
    }
  };

  return (
    <section className="community-screen ctag-screen">
      {/* 상단 — 뒤로가기 꺾쇠 + 태그 라벨 + 글쓰기 버튼 한 줄.
          커뮤니티 메인의 `.comm-tabs` 자리에 대응되는 UI. */}
      <div className="comm-tabs ctag-tabs">
        <button
          type="button"
          className="ctag-back"
          aria-label="뒤로 가기"
          onClick={back}
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
        <span className="ctag-title">{tagLabel}</span>
        {/* 우측 상단 글쓰기 버튼은 인기검색어 진입 페이지에서 혼란을 줘서 삭제됨.
            글쓰기는 커뮤니티 메인의 FAB 또는 하단 nav 에서 진입. */}
        <span style={{ marginLeft: "auto" }} />
      </div>

      {/* 매칭된 게시글이 있을 때만 그리드 노출. 0개면 빈 상태 UI 로 대체.
          검색한 태그와 무관한 게시글은 절대 렌더하지 않음 — 이전에 있던
          fill 카드(NEW_RUNNING_CARDS) 는 검색 태그를 보장하지 않아서 제거. */}
      {matched.length > 0 ? (
        <div className="cnew-grid">
          {matched.map((p) => (
            <Link
              key={`post-${p.id}`}
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
                      p.avatarBg ?? "linear-gradient(135deg,#A78BFA,#7C3AED)",
                  }}
                />
                <span className="cnew-username">{p.user ?? "익명"}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="ctag-empty">
          <div className="ctag-empty-title">
            “{tagLabel}” 검색 결과가 없어요
          </div>
          <div className="ctag-empty-sub">
            다른 키워드로 검색하거나<br />첫 게시글을 작성해보세요!
          </div>
          <Link
            href="/community/compose"
            className="primary-btn ctag-empty-cta"
            style={{ display: "inline-block", textDecoration: "none" }}
          >
            글쓰기 +
          </Link>
        </div>
      )}
    </section>
  );
}
