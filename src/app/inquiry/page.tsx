"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";
import type { Inquiry } from "@/types";

export default function InquiryPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const prependInquiry = useAppStore((s) => s.prependInquiry);

  const [type, setType] = useState<Inquiry["type"]>("서비스 이용");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const submit = () => {
    if (!title || !body) {
      showToast("제목과 내용을 입력해주세요");
      return;
    }
    const id = Date.now();
    const date = new Date().toISOString().slice(0, 16).replace("T", " ").replace(/-/g, ".");
    prependInquiry({ id, type, title, body, date, status: "wait" });
    showToast("문의가 등록되었어요");
    setTimeout(() => router.replace(`/inquiry/${id}`), 500);
  };

  return (
    <>
      <AppHeader title="이용문의" fallback="/settings" />
      <section className="inquiry-screen">
        <div className="top">
          <div>
            <h2>무엇을 도와드릴까요?</h2>
            <p>문의하시면 확인 후 답변해드릴게요.</p>
          </div>
          <div className="mail-emoji">📮</div>
        </div>
        <div className="field">
          <label>문의유형</label>
          <div className="radio-row">
            <label>
              <input type="radio" name="iqtype" value="서비스 이용" checked={type === "서비스 이용"} onChange={() => setType("서비스 이용")} /> 서비스 이용
            </label>
            <label>
              <input type="radio" name="iqtype" value="계정/로그인" checked={type === "계정/로그인"} onChange={() => setType("계정/로그인")} /> 계정/로그인
            </label>
            <label>
              <input type="radio" name="iqtype" value="기타" checked={type === "기타"} onChange={() => setType("기타")} /> 기타
            </label>
          </div>
        </div>
        <div className="field">
          <label>제목</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" />
        </div>
        <div className="field">
          <label>내용</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="문의하실 내용을 자세히 적어주세요"
          />
        </div>
        <button className="primary-btn" onClick={submit}>
          문의 완료하기
        </button>
      </section>
    </>
  );
}
