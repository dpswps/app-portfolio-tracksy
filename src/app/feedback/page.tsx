"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/components/ui/AppHeader";
import { useAppStore } from "@/stores/useAppStore";

export default function FeedbackPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!title || !body) {
      showToast("제목과 내용을 입력해주세요");
      return;
    }
    setBusy(true);
    try {
      // feedback 테이블에 RLS 가 anyone insert 허용이라 비로그인도 가능.
      // 단 user_id 는 서버 쪽에서 세션을 보고 채워주는 게 안전 → /api/feedback 경유.
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 제목+내용을 한 묶음으로 저장. 카테고리는 "feature" 로 (개선 제안).
          body: `${title}\n\n${body}`,
          category: "feature",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        const msg = json.error || json.warn || "전송에 실패했어요";
        showToast(`실패: ${msg}`);
        setBusy(false);
        return;
      }
      showToast("소중한 의견 감사합니다!");
      setTimeout(() => router.back(), 700);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`오류: ${msg}`);
      setBusy(false);
    }
  };

  return (
    <>
      <AppHeader title="개선사항" fallback="/settings" />
      <section className="feedback-screen">
        <h2>
          더 나은 서비스를<br />
          만들어가는데 도움을 주세요!
        </h2>
        <p className="sub">
          여러분의 소중한 의견이 트랙시의<br />
          더 좋은 서비스를 만들어갑니다.
        </p>
        <div className="field">
          <label>제목</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" />
        </div>
        <div className="field">
          <label>내용</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="개선되었으면 하는 부분을 자유롭게 적어주세요"
          />
        </div>
        <div className="notice-box">
          <div className="t">안내사항</div>
          <ul>
            <li>보내주신 의견은 서비스 개선에 적극 반영할게요.</li>
            <li>모든 의견에 개별 답변이 어려운 점 양해부탁드립니다.</li>
          </ul>
        </div>
        <button className="primary-btn" onClick={submit} disabled={busy}>
          {busy ? "전송 중…" : "의견 보내기"}
        </button>
      </section>
    </>
  );
}
