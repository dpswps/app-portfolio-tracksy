"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/useAppStore";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  };

  return (
    <section className="profile-screen">
      <div className="profile-cover" />
      <div className="app-header" style={{ position: "absolute", top: 34, left: 0, right: 0 }}>
        <button className="back-btn" onClick={back} style={{ color: "#fff" }}>
          ‹
        </button>
        <div className="title" style={{ color: "#fff" }}>
          프로필
        </div>
        <div className="right-action">
          <button title="공유">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="6" r="2.5" />
              <circle cx="18" cy="18" r="2.5" />
              <path d="M8 11l8-4M8 13l8 4" />
            </svg>
          </button>
        </div>
      </div>
      <div className="profile-body">
        <div className="profile-avatar-row">
          <div className="avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 4l3 3-7 7-3 1 1-3 6-8z" />
            </svg>
          </div>
          <div className="avatar-name">{user.name} 님</div>
        </div>
        <Link href="/profile/edit" className="profile-edit" role="button" aria-label="프로필 수정">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 21l4-1L20 7l-3-3L4 17l-1 4z" />
          </svg>
        </Link>
        <div className="profile-list">
          <div className="profile-row">
            <span className="k">이름</span>
            <span className="v">{user.name}</span>
          </div>
          <div className="profile-row">
            <span className="k">생년월일</span>
            <span className="v">{user.birth}</span>
          </div>
          <div className="profile-row">
            <span className="k">이메일 계정</span>
            <span className="v">{user.email}</span>
          </div>
          <div className="profile-row">
            <span className="k">선호하는 러닝 스타일</span>
            <span className="v">{user.style}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
