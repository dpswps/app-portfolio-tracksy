"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/* ──────────────────────────────────────────────────────────
 * 커뮤니티 → 즐겨찾기
 *
 * 진입: 커뮤니티 메인의 검색창 옆 북마크 버튼 → /community/favorites
 *
 * 구성:
 *   - 상단 헤더 (← 뒤로 + "즐겨찾기" 타이틀 + 부제목)
 *   - 그 아래 2열 러닝 카드 그리드 (NEW 탭과 동일한 .cnew-card 스타일 재사용)
 *   - 카드 사진은 /community-cards.png 스프라이트 (4x2 = 8개) 슬라이스
 * ────────────────────────────────────────────────────────── */

const FAV_RUNNING_CARDS = [
  { id: 101, dist: "8.24", pace: "5'12\"", time: "42:55", user: "한강하늘", spriteIdx: 0 },
  { id: 102, dist: "6.06", pace: "5'46\"", time: "37:21", user: "페이스마스터", spriteIdx: 1 },
  { id: 103, dist: "10:54", pace: "5'02\"", time: "51:13", user: "트레일러너", spriteIdx: 4 },
  { id: 104, dist: "5:09", pace: "5'30\"", time: "1:07:42", user: "초록숲러닝", spriteIdx: 5 },
  { id: 105, dist: "11.00", pace: "6'05\"", time: "43:30", user: "이른새벽러너", spriteIdx: 2 },
  { id: 106, dist: "1.07", pace: "5'24\"", time: "48:39", user: "야경러너", spriteIdx: 3 },
  { id: 107, dist: "7.15", pace: "5'18\"", time: "32:18", user: "달빛러너", spriteIdx: 6 },
  { id: 108, dist: "6.41", pace: "6'12\"", time: "59:42", user: "달리는하늘", spriteIdx: 7 },
];

export default function CommunityFavoritesPage() {
  const router = useRouter();

  const back = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/community");
    }
  };

  return (
    <section className="cfav-screen">
      <div className="cfav-header">
        <button className="cfav-back" onClick={back} aria-label="뒤로">
          ‹
        </button>
        <div className="cfav-title-wrap">
          <div className="cfav-title">즐겨찾기</div>
          <div className="cfav-subtitle">내가 저장한 러닝 카드들이에요</div>
        </div>
        <span className="cfav-spacer" aria-hidden="true" />
      </div>

      <div className="cnew-grid">
        {FAV_RUNNING_CARDS.map((c) => (
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
    </section>
  );
}
