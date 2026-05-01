"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const showToast = useAppStore((s) => s.showToast);

  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [style, setStyle] = useState("산책/러닝");

  const submit = () => {
    if (!name) {
      showToast("이름을 입력해주세요");
      return;
    }
    if (!year || !month || !day) {
      showToast("생년월일을 입력해주세요");
      return;
    }
    setUser({
      name,
      birth: `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`,
      style,
    });
    showToast("계정이 만들어졌어요!");
    setTimeout(() => router.replace("/home"), 600);
  };

  return (
    <>
      <AppHeader fallback="/login" />
      <section className="signup-screen">
        <h2>정보 입력</h2>
        <p className="sub">트랙시에 등록할 내 정보를 입력하세요</p>

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
          <label>선호하는 러닝 스타일</label>
          <div className="radio-row">
            <label>
              <input type="radio" name="style" value="산책/러닝" checked={style === "산책/러닝"} onChange={(e) => setStyle(e.target.value)} /> 산책/러닝
            </label>
            <label>
              <input type="radio" name="style" value="10k 미만 러닝" checked={style === "10k 미만 러닝"} onChange={(e) => setStyle(e.target.value)} /> 10k 미만 러닝
            </label>
            <label>
              <input type="radio" name="style" value="마라톤" checked={style === "마라톤"} onChange={(e) => setStyle(e.target.value)} /> 마라톤
            </label>
          </div>
        </div>

        <button className="primary-btn" onClick={submit}>
          계정 만들기
        </button>
      </section>
    </>
  );
}
