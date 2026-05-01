"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

export default function ArchiveManualPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);

  const [date, setDate] = useState("");
  const [dist, setDist] = useState("");
  const [time, setTime] = useState("");
  const [pace, setPace] = useState("");
  const [note, setNote] = useState("");

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/archive");
  };

  const save = () => {
    if (!date || !dist) {
      showToast("날짜와 거리는 필수예요");
      return;
    }
    showToast("기록을 저장했어요");
    setTimeout(() => back(), 500);
  };

  return (
    <div className="archive-modal">
      <div className="am-head">
        <div>
          <div className="am-title">데이터 직접 입력하기</div>
          <div className="am-sub">직접 러닝 기록을 입력해 보세요.</div>
        </div>
        <button className="am-close" onClick={back} aria-label="닫기">
          ×
        </button>
      </div>
      <div className="am-card">
        <div className="am-field">
          <label>날짜</label>
          <div className="am-date-input">
            <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="입력하기" />
            <span className="am-cal-ic">📅</span>
          </div>
        </div>
        <div className="am-field">
          <label>거리</label>
          <input type="text" value={dist} onChange={(e) => setDist(e.target.value)} placeholder="입력하기" />
        </div>
        <div className="am-field">
          <label>시간</label>
          <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="입력하기" />
        </div>
        <div className="am-field">
          <label>평균 페이스</label>
          <input type="text" value={pace} onChange={(e) => setPace(e.target.value)} placeholder="입력하기" />
        </div>
        <div className="am-field">
          <label>러닝 메모(선택)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder=""
          />
          <div className="am-counter">
            <span>{note.length}</span>/200
          </div>
        </div>
      </div>
      <button className="primary-btn am-save" onClick={save}>
        기록 저장하기
      </button>
    </div>
  );
}
