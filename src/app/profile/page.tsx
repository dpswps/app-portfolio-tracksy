"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useAppStore } from "@/stores/useAppStore";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const showToast = useAppStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarUrl = user.avatarUrl ?? null;
  const coverUrl = user.coverUrl ?? null;

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/home");
  };

  const onPickPhoto = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (user.avatarUrl) {
      try {
        URL.revokeObjectURL(user.avatarUrl);
      } catch {}
    }
    setUser({ avatarUrl: url });
    showToast("프로필 사진이 변경되었어요");
    e.target.value = "";
  };

  const onPickCover = () => {
    coverInputRef.current?.click();
  };

  const onCoverSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (user.coverUrl) {
      try {
        URL.revokeObjectURL(user.coverUrl);
      } catch {}
    }
    setUser({ coverUrl: url });
    showToast("배경 이미지가 변경되었어요");
    e.target.value = "";
  };

  const copyProfileUrl = async () => {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/profile`
        : "/profile";
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("프로필 주소가 복사되었어요");
    } catch {
      showToast("복사에 실패했어요");
    }
  };

  return (
    <section className="profile-screen">
      <div className="app-header">
        <button className="back-btn" onClick={back}>
          ‹
        </button>
        <div className="title">프로필</div>
      </div>
      <div
        className="profile-cover"
        style={
          coverUrl
            ? {
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <button className="profile-share" title="프로필 주소 복사" onClick={copyProfileUrl}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="6" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
            <path d="M8 11l8-4M8 13l8 4" />
          </svg>
        </button>
        <button
          type="button"
          className="cover-plus"
          onClick={onPickCover}
          aria-label="배경 이미지 변경"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onCoverSelected}
        />
      </div>
      <div className="profile-body">
        <div className="profile-avatar-row">
          <div className="avatar">
            {avatarUrl && (
              <img src={avatarUrl} alt="프로필 사진" className="avatar-img" />
            )}
            <button
              type="button"
              className="avatar-plus"
              onClick={onPickPhoto}
              aria-label="프로필 사진 변경"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={onFileSelected}
            />
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
