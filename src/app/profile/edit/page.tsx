"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";

export default function ProfileEditPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const showToast = useAppStore((s) => s.showToast);

  const [yInit, mInit, dInit] = (user.birth || "").split(".");
  const [name, setName] = useState(user.name || "");
  const [year, setYear] = useState(yInit || "");
  const [month, setMonth] = useState(mInit || "");
  const [day, setDay] = useState(dInit || "");
  const [email, setEmail] = useState(user.email || "");
  const [style, setStyle] = useState(user.style || "산책/러닝");

  const save = () => {
    if (!name) return showToast("이름을 입력해주세요");
    if (!year || !month || !day) return showToast("생년월일을 입력해주세요");
    if (!email || !email.includes("@")) return showToast("올바른 이메일을 입력해주세요");
    setUser({
      name,
      birth: `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`,
      email,
      style,
    });
    showToast("프로필이 수정되었어요");
    setTimeout(() => router.back(), 600);
  };

  return (
    <>
      <AppHeader title="프로필 수정" fallback="/profile" />
      <section className="signup-screen" style={{ background: "#fff", paddingTop: 8 }}>
        <div className="profile-avatar-row" style={{ marginTop: 0, marginBottom: 28 }}>
          <div className="avatar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 4l3 3-7 7-3 1 1-3 6-8z" />
            </svg>
          </div>
        </div>

        <div className="field">
          <label>이름</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </div>

        <div className="field">
          <label>생년월일</label>
          <div className="date-row">
            <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="년*" maxLength={4} />
            <input type="text" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="월*" maxLength={2} />
            <input type="text" value={day} onChange={(e) => setDay(e.target.value)} placeholder="일*" maxLength={2} />
          </div>
        </div>

        <div className="field">
          <label>이메일 계정</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일을 입력하세요" />
        </div>

        <div className="field">
          <label>선호하는 러닝 스타일</label>
          <div className="radio-row">
            <label>
              <input type="radio" name="editStyle" value="산책/러닝" checked={style === "산책/러닝"} onChange={(e) => setStyle(e.target.value)} /> 산책/러닝
            </label>
            <label>
              <input type="radio" name="editStyle" value="10k 미만 러닝" checked={style === "10k 미만 러닝"} onChange={(e) => setStyle(e.target.value)} /> 10k 미만 러닝
            </label>
            <label>
              <input type="radio" name="editStyle" value="마라톤" checked={style === "마라톤"} onChange={(e) => setStyle(e.target.value)} /> 마라톤
            </label>
          </div>
        </div>

        <button className="primary-btn" onClick={save}>
          저장하기
        </button>
      </section>
    </>
  );
}
