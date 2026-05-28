"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";
import { upsertProfile } from "@/lib/supabase/auth";

export default function ProfileEditPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const showToast = useAppStore((s) => s.showToast);

  /** birth 는 두 가지 포맷 모두 받음:
   *   - "1995.08.15" (Zustand 로컬 캐시 포맷)
   *   - "1995-08-15" (DB ISO 포맷, SessionProvider 가 사용할 수도)
   *  점·하이픈 어느 쪽이든 split.
   */
  const [yInit = "", mInit = "", dInit = ""] = (user.birth || "")
    .split(/[.\-/]/)
    .map((s) => s.trim());
  const [name, setName] = useState(user.name || "");
  const [year, setYear] = useState(yInit || "");
  const [month, setMonth] = useState(mInit || "");
  const [day, setDay] = useState(dInit || "");
  const [email, setEmail] = useState(user.email || "");
  const [style, setStyle] = useState(user.style || "산책/러닝");

  const save = async () => {
    if (!name) return showToast("이름을 입력해주세요");
    if (!year || !month || !day) return showToast("생년월일을 입력해주세요");
    if (!email || !email.includes("@")) return showToast("올바른 이메일을 입력해주세요");
    const birth = `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`;
    setUser({ name, birth, email, style });
    try {
      await upsertProfile({
        name,
        birth: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
        email,
        style,
      });
    } catch (err) {
      console.warn("[profile-edit] supabase update failed", err);
    }
    showToast("프로필이 수정되었어요");
    setTimeout(() => router.back(), 600);
  };

  return (
    <>
      <AppHeader title="프로필 수정" fallback="/profile" style={{ background: "#fff" }} />
      <section className="signup-screen" style={{ background: "#fff", paddingTop: 8 }}>
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
