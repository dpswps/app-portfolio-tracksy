"use client";

import { useEffect, useRef, useState } from "react";
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
  const removeCommunityPost = useAppStore((s) => s.removeCommunityPost);

  // 현재 게시글이 "사용자가 직접 등록한 글" 인지 판단 — 점세개 메뉴 노출 여부를
  // 결정. 사용자 글에만 삭제 옵션이 보이도록 한다(기본 샘플 글은 삭제 불가).
  const isUserOwned = userPosts.some(
    (x) => String(x.id) === String(params.id),
  );
  // 게시글 조회는 사용자가 직접 등록한 게시글 + 기본 게시글 모두에서 찾는다.
  // 사용자 게시글의 id 는 Date.now() 기반이라 기본 게시글(1~6) 과 충돌하지 않음.
  const p =
    userPosts.find((x) => String(x.id) === String(params.id)) ||
    communityPosts.find((x) => String(x.id) === String(params.id)) ||
    communityPosts[0];

  /* 점세개 메뉴 — 외부 클릭 시 자동으로 닫히도록 ref 로 boundary 추적. */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDocPointer = (e: MouseEvent | TouchEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("touchstart", onDocPointer);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("touchstart", onDocPointer);
    };
  }, [menuOpen]);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/community");
  };

  /**
   * 삭제 — 사용자가 직접 등록한 글에 한해서 confirm 후 store 에서 제거하고
   * 커뮤니티 메인으로 이동. 기본 샘플 글은 메뉴 자체가 안 보이므로 여기 도달
   * 하지 않지만 안전망으로 isUserOwned 한 번 더 체크.
   */
  const onDelete = () => {
    if (!isUserOwned) {
      showToast("샘플 게시글은 삭제할 수 없어요");
      setMenuOpen(false);
      return;
    }
    const ok =
      typeof window !== "undefined"
        ? window.confirm("이 게시글을 삭제할까요?")
        : true;
    if (!ok) return;
    removeCommunityPost(p.id);
    setMenuOpen(false);
    showToast("게시글이 삭제되었어요");
    setTimeout(() => router.push("/community"), 200);
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
        {/* 우측 상단 점세개 메뉴 — 사용자가 직접 등록한 게시글에서만 노출.
            클릭하면 작은 드롭다운이 열리고 "삭제하기" 항목을 누르면 confirm
            후 store 에서 제거 + 커뮤니티 메인으로 이동. */}
        {isUserOwned && (
          <div className="cp-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="cp-menu-btn"
              aria-label="더보기"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>
            {menuOpen && (
              <div className="cp-menu" role="menu">
                <button
                  type="button"
                  className="cp-menu-item cp-menu-item-danger"
                  role="menuitem"
                  onClick={onDelete}
                >
                  삭제하기
                </button>
              </div>
            )}
          </div>
        )}
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
