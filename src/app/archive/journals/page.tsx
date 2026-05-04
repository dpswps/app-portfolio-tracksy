"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { formatKoreanDate } from "@/lib/date";
import Mascot from "@/components/ui/Mascot";

type JournalEntry = ReturnType<typeof useAppStore.getState>["aiJournals"][number];

export default function JournalsPage() {
  const router = useRouter();
  const journals = useAppStore((s) => s.aiJournals);
  const removeAIJournal = useAppStore((s) => s.removeAIJournal);
  const showToast = useAppStore((s) => s.showToast);

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
