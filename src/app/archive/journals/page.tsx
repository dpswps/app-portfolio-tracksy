"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { formatKoreanDate } from "@/lib/date";
import Mascot from "@/components/ui/Mascot";

type JournalEntry = ReturnType<typeof useAppStore.getState>["aiJournals"][number];

/** AI 요약 HTML(<br/>) → 카드 말풍선 plain text 변환. ai/page.tsx 의 toPlainBubble
 *  과 동일 로직 — 스튜디오 카드에 들어가는 텍스트도 같은 정규화 적용. */
function toPlainBubble(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function JournalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const journals = useAppStore((s) => s.aiJournals);
  const removeAIJournal = useAppStore((s) => s.removeAIJournal);
  const setStudioCardData = useAppStore((s) => s.setStudioCardData);
  const showToast = useAppStore((s) => s.showToast);
  /* 스튜디오 진입 컨텍스트 — ?from=studio 가 있으면 각 일지 카드에 "러닝 일지
   * 사용하기" 버튼이 표시되고, 클릭 시 스튜디오 카드 말풍선에 그 일지 요약을
   * 박아 넣은 뒤 스튜디오로 이동한다. 보관함에서 일반 진입했을 땐 버튼이
   * 안 보이고 기존 일지 목록 UI 그대로. */
  const fromStudio = searchParams?.get("from") === "studio";

  const onUseInStudio = (summary: string) => {
    setStudioCardData({ bubble: toPlainBubble(summary) });
    showToast("러닝 일지를 카드에 적용했어요");
    router.push("/studio");
  };

  const back = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/archive");
  };

  // Group entries by date (YYYY-MM-DD), keeping insertion order (newest first)
  const grouped = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    for (const j of journals) {
      const arr = map.get(j.date) || [];
      arr.push(j);
      map.set(j.date, arr);
    }
    // Convert to sorted array (latest date first)
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [journals]);

  const onRemove = (id: number) => {
    removeAIJournal(id);
    showToast("일지를 삭제했어요");
  };

  return (
    <>
      <div className="app-header journals-header">
        <button className="back-btn" onClick={back} aria-label="뒤로">
          ‹
        </button>
        <div className="journals-title">저장된 러닝 일지</div>
        <div style={{ width: 28 }} />
      </div>

      <section className="journals-screen">
        {journals.length === 0 ? (
          <div className="journals-empty">
            <div className="journals-empty-mascot">
              <Mascot />
            </div>
            <div className="journals-empty-title">아직 저장된 일지가 없어요</div>
            <div className="journals-empty-sub">
              AI와 대화로 오늘의 러닝을 한 줄로 정리하고<br />
              저장하면 여기에 차곡차곡 모여요
            </div>
            <Link href="/archive/ai" className="primary-btn journals-empty-cta" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              새 러닝 일지 쓰기 ✨
            </Link>
          </div>
        ) : (
          <div className="journals-list">
            {grouped.map(([date, items]) => (
              <div key={date} className="journals-group">
                <div className="journals-date">{formatKoreanDate(date)}</div>
                <div className="journals-cards">
                  {items.map((j) => (
                    <article key={j.id} className="journal-card">
                      <div className="journal-card-stars">✨ 오늘의 러닝 한 줄 요약 ✨</div>
                      <p className="journal-card-quote">
                        <span className="journal-q open">&quot;</span>
                        {j.summary.split("\n").map((line, i, arr) => (
                          <span key={i}>
                            {line}
                            {i < arr.length - 1 && <br />}
                          </span>
                        ))}
                        <span className="journal-q close">&quot;</span>
                      </p>
                      {fromStudio && (
                        <button
                          className="journal-card-use"
                          onClick={() => onUseInStudio(j.summary)}
                          style={{
                            display: "block",
                            width: "100%",
                            marginTop: 12,
                            /* 세로 길이 축소 — primary-btn 의 기본 패딩(14px)
                               보다 작게 8px 로 줄여 카드 안에 더 콤팩트하게. */
                            padding: "8px 14px",
                            borderRadius: 10,
                            background: "var(--primary, #8b5cf6)",
                            color: "#fff",
                            border: "none",
                            fontSize: 13,
                            fontWeight: 700,
                            textAlign: "center",
                            textDecoration: "none",
                            cursor: "pointer",
                          }}
                        >
                          러닝 일지 사용하기 ✨
                        </button>
                      )}
                      <button
                        className="journal-card-remove"
                        onClick={() => onRemove(j.id)}
                        aria-label="일지 삭제"
                      >
                        ×
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/**
 * useSearchParams 가 Next.js 15+ 에서 Suspense boundary 를 요구하기 때문에
 * 실제 페이지 로직(JournalsPageContent) 을 <Suspense> 로 감싸서 export.
 */
export default function JournalsPage() {
  return (
    <Suspense fallback={<section className="journals-screen" />}>
      <JournalsPageContent />
    </Suspense>
  );
}
