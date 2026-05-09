"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { archiveRecords } from "@/data/archiveRecords";
import { useAppStore } from "@/stores/useAppStore";
import { formatKoreanDate } from "@/lib/date";

/**
 * 페이스 문자열(예: "5'56\"")을 분 단위 숫자로 변환.
 * 페이스 평가용. 실패하면 undefined.
 */
function paceToMinutes(pace: string): number | undefined {
  const m = pace.match(/(\d+)['′](\d{0,2})(?:["″]?)/);
  if (!m) return undefined;
  const min = parseInt(m[1], 10);
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
  const dateParam = decodeURIComponent(String(params?.date ?? ""));

  const userRecords = useAppStore((s) => s.userRecords);
  const deleteUserRecord = useAppStore((s) => s.deleteUserRecord);
  const showToast = useAppStore((s) => s.showToast);

  const isUserOwned = dateParam in userRecords;
  const rec = userRecords[dateParam] || archiveRecords[dateParam];

  const back = () => {
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

        {/* 액션 */}
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
