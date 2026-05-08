"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import Mascot from "@/components/ui/Mascot";

export default function CommunityComposePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const showToast = useAppStore((s) => s.showToast);

  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/community");
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
            style={{ background: "linear-gradient(135deg,#A78BFA,#7C3AED)" }}
          />
          <span>{user.name || "김러너"}</span>
        </div>
        <button className="comm-bookmark" style={{ marginLeft: "auto" }} aria-label="저장">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 3h12v18l-6-4-6 4z" />
          </svg>
        </button>
      </div>
      <section className="comm-compose">
        <div className="compose-canvas">
          <div className="cc-mascot">
            <Mascot />
            <div className="cc-card-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="#8B5CF6" strokeWidth="2">
                <rect x="6" y="6" width="36" height="36" rx="6" />
                <circle cx="18" cy="18" r="3" />
                <path d="M6 32l10-8 8 6 8-6 10 8" />
              </svg>
            </div>
          </div>
          <div className="cc-bring">카드 가져오기</div>
          <button className="cc-plus" onClick={() => showToast("카드를 가져왔어요")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <div className="compose-fields">
          <input
            type="text"
            className="compose-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="캡션 추가..."
          />
          <input
            type="text"
            className="compose-input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="해시태그 추가..."
          />
        </div>
        <div className="compose-actions">
          <button
            className="compose-template-btn"
            onClick={() => showToast("저장된 템플릿을 불러왔어요")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
            저장된 템플릿 가져오기
          </button>
          <button
            className="compose-submit-btn"
            onClick={() => showToast("등록되었어요")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            등록하기
          </button>
        </div>
      </section>
    </>
  );
}
