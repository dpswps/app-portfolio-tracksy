"use client";

import { useParams, useRouter } from "next/navigation";
import { communityPosts } from "@/data/communityPosts";
import { useAppStore } from "@/stores/useAppStore";

/** 오늘 날짜를 저장한 스타일 카드의 "오늘 · M.D (요일)" 포맷으로 만든다. */
function formatStyleDate(): string {
  const d = new Date();
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `오늘 · ${m}.${dd} (${dow})`;
}

export default function CommunityPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const userPosts = useAppStore((s) => s.userCommunityPosts);
  const addUserSavedStyle = useAppStore((s) => s.addUserSavedStyle);
  // 게시글 조회는 사용자가 직접 등록한 게시글 + 기본 게시글 모두에서 찾는다.
  // 사용자 게시글의 id 는 Date.now() 기반이라 기본 게시글(1~6) 과 충돌하지 않음.
  const p =
    userPosts.find((x) => String(x.id) === String(params.id)) ||
    communityPosts.find((x) => String(x.id) === String(params.id)) ||
    communityPosts[0];

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/community");
  };

  /** 스타일 저장하기 — 현재 게시글을 보관함 > 스타일 보관소 > 저장한 스타일에 추가.
   *  같은 게시글에 대해 다시 저장하면 기존 항목을 갱신만 함 (id 가 결정적). */
  const onSaveStyle = () => {
    const styleBg = p.image
      ? `url(${p.image}) center/cover no-repeat`
      : p.bg || "linear-gradient(180deg,#1F2937 0%,#0F172A 100%)";
    addUserSavedStyle({
      id: `post-${p.id}`,
      date: formatStyleDate(),
      title: p.caption || "커뮤니티 게시글",
      // 이미지 자체에 거리/통계가 모두 표시되어 있으므로 React 오버레이는 비워둠.
      dist: "",
      bg: styleBg,
      stats: [],
    });
    showToast("저장한 스타일에 추가했어요");
  };

  return (
    <>
      <div className="app-header comm-post-header">
        <button className="back-btn" onClick={back}>
          ‹
        </button>
        <div className="comm-post-user">
          <div
            className="cpu-avatar"
            style={{ background: p.avatarBg || "linear-gradient(135deg,#A78BFA,#7C3AED)" }}
          />
          <span>{p.user || "박채원"}</span>
        </div>
      </div>
      <section className="comm-post">
        <div className="post-card">
          <div
            className="post-card-photo"
            style={{
              background: p.image
                ? `url(${p.image}) top center/cover no-repeat`
                : p.bg || "linear-gradient(180deg,#7DC8E8 0%,#A8D08D 80%)",
            }}
          />
        </div>

        <div className="post-body">
          {/* 사용자가 입력한 캡션/태그가 있으면 그걸 우선 노출, 없으면 기본 샘플 */}
          <div className="post-title">{p.caption || "오늘 날씨 진짜 좋다 - !!!"}</div>
          <div className="post-tags">{p.tags || "@ 오공원 # 무이용 # 야자스"}</div>
          <div className="post-meta">
            <span className="post-time">{p.date || "2026-05-15"}</span>
          </div>
        </div>

        <div className="post-actions">
          <button className="post-act" onClick={onSaveStyle}>
            스타일 저장하기
          </button>
        </div>
      </section>
    </>
  );
}
