"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { archiveRecords } from "@/data/archiveRecords";
import { useAppStore } from "@/stores/useAppStore";
import { formatKoreanDate } from "@/lib/date";

/**
 * 페이스 문자열(예: "5'56\"")을 분 단위 숫자로 변환.
 * 페이스 평가용. 실패하면 undefined.
 *
 * pace 가 null/undefined/빈문자열인 경우(사용자 수동 입력 누락 등)에 대비해
 * 타입 가드를 먼저 통과시킨다.
 */
function paceToMinutes(pace: string | null | undefined): number | undefined {
  if (typeof pace !== "string" || pace.length === 0) return undefined;
  const m = pace.match(/(\d+)['′](\d{0,2})(?:["″]?)/);
  if (!m) return undefined;
  const min = parseInt(m[1]!, 10);
  const sec = m[2] ? parseInt(m[2], 10) : 0;
  return min + sec / 60;
}

/**
 * 페이스 평가 메시지. 일반 러너 기준.
 *  - <=5분/km : "프로 러너 페이스"
 *  - <=5.5    : "꽤 빠른 페이스"
 *  - <=6.5    : "안정적인 페이스"
 *  - <=8      : "편안한 조깅 페이스"
 *  - >8       : "워킹 + 조깅 수준"
 */
function paceComment(paceMin: number): { label: string; tone: "great" | "good" | "ok" | "tough" } {
  if (paceMin <= 5) return { label: "프로 러너 페이스 🔥", tone: "great" };
  if (paceMin <= 5.5) return { label: "꽤 빠른 페이스 💪", tone: "great" };
  if (paceMin <= 6.5) return { label: "안정적인 페이스 🌟", tone: "good" };
  if (paceMin <= 8) return { label: "편안한 조깅 페이스 🌿", tone: "ok" };
  return { label: "천천히, 꾸준히가 중요해 🌙", tone: "tough" };
}

export default function RecordDetailPage() {
  const params = useParams<{ date: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = decodeURIComponent(String(params?.date ?? ""));
  // 진입 경로 — manual save 직후엔 ?from=manual 이 붙어있어서 뒤로가기를
  // 홈으로 보낸다. 그 외(예: 보관함 캘린더에서 자세히 보기) 는 기본 동작.
  const fromManual = searchParams?.get("from") === "manual";

  const userRecords = useAppStore((s) => s.userRecords);
  const deleteUserRecord = useAppStore((s) => s.deleteUserRecord);
  const showToast = useAppStore((s) => s.showToast);
  // 수동 저장 → 자세히 보기에서 뒤로가기 시 보관함의 "내 기록 보관소" 로
  // 진입하면서 방금 저장한 날짜가 선택된 상태로 표시되도록 상태 셋업에 사용.
  const setArchiveMainTab = useAppStore((s) => s.setArchiveMainTab);
  const setArchiveView = useAppStore((s) => s.setArchiveView);
  const setArchiveMonth = useAppStore((s) => s.setArchiveMonth);
  const selectDate = useAppStore((s) => s.selectDate);
  const setCalExpanded = useAppStore((s) => s.setCalExpanded);
  // 같은 날짜에 저장된 AI 러닝일지들 — 메모 아래에 함께 노출.
  //
  // ⚠️ Zustand selector 안에서 직접 `.filter(...)` 를 호출하면 매 호출마다 새
  // 배열을 반환하게 되어 React 가 "getSnapshot should be cached" 무한 루프
  // 경고를 띄운다. 그래서 selector 는 stable 한 원본 배열 reference 만 꺼내고,
  // 필터링은 useMemo 로 분리한다. (영구 저장 state 가 오래돼서 aiJournals
  // 필드가 없을 가능성에 대비해 `?? []` 폴백도 함께 적용.)
  const aiJournals = useAppStore((s) => s.aiJournals);
  const aiJournalsForDate = useMemo(
    () => (aiJournals ?? []).filter((j) => j.date === dateParam),
    [aiJournals, dateParam],
  );
  const removeAIJournal = useAppStore((s) => s.removeAIJournal);

  const isUserOwned = dateParam in userRecords;
  const rec = userRecords[dateParam] || archiveRecords[dateParam];

  const back = () => {
    // manual save → 자세히 보기 진입(?from=manual) 의 경우엔
    // 보관함의 "내 기록 보관소" 로 보내고, 방금 저장한 날짜를 선택된 상태로
    // 표시한다. (이전엔 홈으로 보냈으나, 사용자가 보관함에서 흐름을 이어가길
    // 원해서 변경.)
    if (fromManual) {
      const [yStr, mStr] = dateParam.split("-");
      const y = Number(yStr);
      const m = Number(mStr);
      if (!isNaN(y) && !isNaN(m)) {
        setArchiveMainTab("records");
        setArchiveView("calendar");
        setArchiveMonth(y, m);
        selectDate(dateParam);
        setTimeout(() => setCalExpanded(true), 0);
      }
      router.push("/archive");
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push("/archive");
  };

  if (!rec) {
    return (
      <>
        <div className="app-header rd-header">
          <button className="back-btn" onClick={back} aria-label="뒤로">
            ‹
          </button>
          <div className="rd-header-title">러닝 기록</div>
          <span className="rd-header-spacer" />
        </div>
        <section className="rd-empty">
          <div className="rd-empty-title">기록을 찾을 수 없어요</div>
          <div className="rd-empty-sub">해당 날짜의 러닝 기록이 없어요.</div>
          <Link href="/archive" className="primary-btn rd-empty-cta">
            보관함으로 돌아가기
          </Link>
        </section>
      </>
    );
  }

  const paceMin = paceToMinutes(rec.pace);
  const comment = paceMin !== undefined ? paceComment(paceMin) : null;

  const onEdit = () => {
    router.push(`/archive/manual?date=${encodeURIComponent(dateParam)}`);
  };

  const onDelete = () => {
    if (!isUserOwned) {
      showToast("샘플 기록은 삭제할 수 없어요");
      return;
    }
    const ok =
      typeof window !== "undefined"
        ? window.confirm("이 러닝 기록을 삭제할까요?")
        : true;
    if (!ok) return;
    deleteUserRecord(dateParam);
    showToast("기록이 삭제되었어요");
    setTimeout(() => router.push("/archive"), 200);
  };

  return (
    <>
      <div className="app-header rd-header">
        <button className="back-btn" onClick={back} aria-label="뒤로">
          ‹
        </button>
        <div className="rd-header-title">러닝 기록</div>
        <span className="rd-header-spacer" />
      </div>

      <section className="rd-screen">
        {/* 메인 카드 — 거리 큰 글자 + 날짜 */}
        <div className="rd-hero">
          <div className="rd-hero-date">{formatKoreanDate(dateParam)}</div>
          <div className="rd-hero-distance">
            <b>{rec.dist}</b>
            <small>km</small>
          </div>
          {comment && (
            <div className={`rd-hero-tag tone-${comment.tone}`}>{comment.label}</div>
          )}
        </div>

        {/* 통계 그리드 */}
        <div className="rd-grid">
          <div className="rd-cell">
            <b>{rec.pace}</b>
            <i>/km</i>
            <small>평균 페이스</small>
          </div>
          <div className="rd-cell">
            <b>{rec.time ?? "—"}</b>
            <small>시간</small>
          </div>
          <div className="rd-cell">
            <b>{rec.kcal ?? "—"}</b>
            {rec.kcal != null && <i>kcal</i>}
            <small>칼로리</small>
          </div>
          <div className="rd-cell">
            <b>{rec.bpm ?? "—"}</b>
            {rec.bpm != null && <i>bpm</i>}
            <small>평균 심박</small>
          </div>
          <div className="rd-cell">
            <b>{rec.cadence ?? "—"}</b>
            {rec.cadence != null && <i>spm</i>}
            <small>케이던스</small>
          </div>
          <div className="rd-cell">
            <b>{rec.elev ?? "—"}</b>
            <small>누적 상승</small>
          </div>
        </div>

        {/* 지도 (캡쳐 사진) — 있을 때만 */}
        {rec.screenshot && (
          <div className="rd-map">
            <div className="rd-section-label">지도</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rec.screenshot}
              alt="러닝 캡쳐 사진"
              className="rd-map-img"
            />
          </div>
        )}

        {/* 구간(splits) — 있을 때만 */}
        {rec.splits && rec.splits.length > 0 && (
          <div className="rd-splits">
            <div className="rd-section-label">구간</div>
            <div className="rd-splits-table">
              <div className="rd-splits-head">
                <span>구간</span>
                <span>시간</span>
                <span>페이스</span>
                <span>심박</span>
              </div>
              {rec.splits.map((sp, i) => (
                <div className="rd-splits-row" key={`${sp.km}-${i}`}>
                  <span className="rs-km">
                    {Number.isInteger(sp.km) ? `${sp.km}km` : `${sp.km}km`}
                  </span>
                  <span>{sp.time ?? "—"}</span>
                  <span>{sp.pace ?? "—"}</span>
                  <span>{sp.bpm != null ? `${sp.bpm}` : "—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 메모 */}
        {rec.note ? (
          <div className="rd-note">
            <div className="rd-note-label">메모</div>
            <div className="rd-note-text">{rec.note}</div>
          </div>
        ) : (
          <div className="rd-note rd-note-empty">
            <div className="rd-note-label">메모</div>
            <div className="rd-note-text muted">기록된 메모가 없어요.</div>
          </div>
        )}

        {/* AI 오늘의 러닝일지 — 같은 날짜에 저장된 일지들을 메모 아래에 함께 노출.
            보관함에서 AI 챗봇을 마치고 "러닝 일지 저장하기" 를 누르면 이 섹션에
            자동으로 카드 형태로 쌓인다. */}
        {aiJournalsForDate.length > 0 && (
          <div className="rd-ai-journals">
            <div className="rd-ai-journals-label">
              <span>✨ AI 오늘의 러닝일지</span>
              <span className="rd-ai-journals-count">
                {aiJournalsForDate.length}
              </span>
            </div>
            <div className="rd-ai-journals-list">
              {aiJournalsForDate.map((j) => (
                <div key={j.id} className="rd-ai-journal-card">
                  <button
                    className="rd-ai-journal-remove"
                    aria-label="이 러닝일지 삭제"
                    title="이 러닝일지 삭제"
                    onClick={() => {
                      const ok =
                        typeof window !== "undefined"
                          ? window.confirm("이 러닝일지를 삭제할까요?")
                          : true;
                      if (!ok) return;
                      removeAIJournal(j.id);
                      showToast("러닝일지가 삭제되었어요");
                    }}
                  >
                    ×
                  </button>
                  <div className="rd-ai-journal-quote">
                    <span className="rd-ai-journal-q open">&ldquo;</span>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: (j.summary ?? "").replace(/\n/g, "<br/>"),
                      }}
                    />
                    <span className="rd-ai-journal-q close">&rdquo;</span>
                  </div>
                  <div className="rd-ai-journal-meta">
                    {new Date(j.savedAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    저장
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="rd-actions">
          <button className="rd-edit-btn" onClick={onEdit}>
            기록 수정하기
          </button>
          <button
            className="rd-delete-btn"
            onClick={onDelete}
            aria-disabled={!isUserOwned}
            title={isUserOwned ? "기록 삭제" : "샘플 기록은 삭제할 수 없어요"}
          >
            삭제
          </button>
        </div>
      </section>
    </>
  );
}

