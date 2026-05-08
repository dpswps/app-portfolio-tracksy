"use client";

import { useParams, useRouter } from "next/navigation";
import { communityPosts } from "@/data/communityPosts";
import { useAppStore } from "@/stores/useAppStore";

export default function CommunityPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const togglePostSaved = useAppStore((s) => s.togglePostSaved);
  const p = communityPosts.find((x) => String(x.id) === String(params.id)) || communityPosts[0];
  const saved = useAppStore((s) => Boolean(s.savedPosts[String(p.id)]));

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/community");
  };

  const toggleSaved = () => {
    const next = togglePostSaved(p.id);
    showToast(next ? "저장됨" : "저장 취소됨");
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
        <button
          className={`comm-bookmark${saved ? " saved" : ""}`}
          style={{ marginLeft: "auto" }}
          aria-label="저장"
          onClick={toggleSaved}
        >
          <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </button>
      </div>
      <section className="comm-post">
        <div className="post-card">
          <div
            className="post-card-photo"
            style={{
              background: p.image
                ? `url(${p.image}) center/cover no-repeat`
                : p.bg || "linear-gradient(180deg,#7DC8E8 0%,#A8D08D 80%)",
            }}
          />
          <div className="post-card-overlay">
            <div className="pc-distance">{p.dist || "6.06"}</div>
            <div className="pc-stats-row">
              <div>
                <b>5&apos;48&quot;</b>
                <i>페이스</i>
              </div>
              <div>
                <b>46:45</b>
                <i>시간</i>
              </div>
              <div>
                <b>154</b>
                <i>kcal</i>
              </div>
            </div>
            <div className="pc-stats-row sub">
              <div>
                <b>25 m</b>
                <i>고도</i>
              </div>
              <div>
                <b>152</b>
                <i>심박</i>
              </div>
              <div>
                <b>173</b>
                <i>케이던스</i>
              </div>
            </div>
          </div>
        </div>

        <div className="post-body">
          <div className="post-title">오늘 날씨 진짜 좋다 - !!!</div>
          <div className="post-tags">@ 오공원 # 무이용 # 야자스</div>
          <div className="post-meta">
            <span className="post-time">4시간 전</span>
            <span className="post-likes">❤️ 563</span>
            <span className="post-comments">💬 120</span>
          </div>
        </div>

        <div className="post-actions">
          <button className="post-act" onClick={() => showToast("즐겨찾기에 추가했어요")}>
            <span>⭐</span> 즐겨찾기
          </button>
          <button className="post-act primary" onClick={() => showToast("템플릿을 적용했어요")}>
            <span>✨</span> 이 템플릿 사용하기
          </button>
        </div>
      </section>
    </>
  );
}
