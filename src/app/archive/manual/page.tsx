"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { archiveRecords } from "@/data/archiveRecords";
import { KO_DOW, dateKey, pad2 } from "@/lib/date";

function formatDateInput(y: number, m: number, d: number) {
  return `${y}.${pad2(m)}.${pad2(d)}`;
}

function inputToKey(input: string): string | null {
  const m = input.trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/);
  if (!m) return null;
  return dateKey(Number(m[1]), Number(m[2]), Number(m[3]));
}

function keyToInput(key: string): string {
  const [y, mm, dd] = key.split("-");
  return `${y}.${mm}.${dd}`;
}

/* ──────────────────────────────────────────────────────────
 * 시간/페이스 변환 헬퍼
 * 사용자 입력은 자유 형식("30:05" / "1:30:05" / "30분 5초" / "30'05\"" / "30")
 * 을 모두 받아 초 단위로 정규화한다.
 * ────────────────────────────────────────────────────────── */
function timeToSeconds(s: string): number | null {
  if (!s) return null;
  const t = s.trim();
  if (!t) return null;

  // "1:30:05" / "30:05" / "30:5"
  let m = t.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  m = t.match(/^(\d+):(\d{1,2})$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);

  // "1시간 30분 5초" / "30분 05초" / "30분"
  let h = 0,
    mm = 0,
    ss = 0;
  let matched = false;
  const hm = t.match(/(\d+)\s*시간/);
  if (hm) {
    h = Number(hm[1]);
    matched = true;
  }
  const mm2 = t.match(/(\d+)\s*분/);
  if (mm2) {
    mm = Number(mm2[1]);
    matched = true;
  }
  const sm = t.match(/(\d+)\s*초/);
  if (sm) {
    ss = Number(sm[1]);
    matched = true;
  }
  if (matched) return h * 3600 + mm * 60 + ss;

  // "30'05\"" / "30'5"
  m = t.match(/^(\d+)['′](\d{1,2})(?:["″])?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2]);

  // 단순 숫자 → 분으로 가정 ("30" → 30분)
  m = t.match(/^(\d+)$/);
  if (m) return Number(m[1]) * 60;

  return null;
}

/** 초 → "MM:SS" 또는 "H:MM:SS" 형식 (저장·표시용 표준형) */
function secondsToTimeString(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`;
  return `${m}:${pad2(s)}`;
}

/** 페이스: 초/km → "M'SS\"" (러닝 관례 형식) */
function secondsToPaceString(secPerKm: number): string {
  if (!isFinite(secPerKm) || secPerKm <= 0) return "";
  let m = Math.floor(secPerKm / 60);
  let s = Math.round(secPerKm - m * 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return `${m}'${pad2(s)}"`;
}

/** "5.21" / "5.21 km" / "5km" → 5.21 (양수일 때만) */
function distToKm(s: string): number | null {
  const t = s.replace(/[^\d.]/g, "");
  if (!t) return null;
  const n = parseFloat(t);
  if (isNaN(n) || n <= 0) return null;
  return n;
}

export default function ArchiveManualPage() {
  return (
    <Suspense fallback={<div className="archive-modal" />}>
      <ManualForm />
    </Suspense>
  );
}

function ManualForm() {
  const router = useRouter();
  const search = useSearchParams();
  const showToast = useAppStore((s) => s.showToast);
  const addRecord = useAppStore((s) => s.addRecord);
  const setArchiveMonth = useAppStore((s) => s.setArchiveMonth);
  const pickDate = useAppStore((s) => s.pickDate);
  const archiveSelected = useAppStore((s) => s.archiveSelected);
  const userRecords = useAppStore((s) => s.userRecords);

  const initialDateKey = search?.get("date") || null;

  /* ── prefill 우선순위 ──────────────────────────────
   * 1) OCR로 막 추출된 pendingScanData (scan 페이지 → manual로 전달)
   * 2) URL ?date=YYYY-MM-DD 로 들어온 기존 기록 수정
   * 3) 빈 form (새 입력)
   * pendingScanData는 mount 시점에 한 번만 consume.
   * ──────────────────────────────────────────── */
  // mount 시 한 번만 consume (useState lazy initializer로 사이드이펙트 1회 보장)
  const [scanData] = useState(() =>
    useAppStore.getState().consumePendingScanData(),
  );

  const initialRec = initialDateKey
    ? userRecords[initialDateKey] || archiveRecords[initialDateKey] || null
    : null;

  // OCR이 날짜를 추출했으면 그걸로, 아니면 URL 파라미터로
  const effectiveDateKey = scanData?.date || initialDateKey;

  const [date, setDate] = useState(
    effectiveDateKey ? keyToInput(effectiveDateKey) : "",
  );
  const [dist, setDist] = useState(scanData?.dist ?? initialRec?.dist ?? "");

  /* 시간을 시/분/초 3개 input으로 분리. prefill source 우선순위에 따라 분해. */
  const initialHMS = (() => {
    const timeStr = scanData?.time ?? initialRec?.time;
    if (!timeStr) return { h: "", m: "", s: "" };
    const sec = timeToSeconds(timeStr);
    if (sec == null) return { h: "", m: "", s: "" };
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return {
      h: h > 0 ? String(h) : "",
      m: String(m),
      s: pad2(s),
    };
  })();
  const [hour, setHour] = useState<string>(initialHMS.h);
  const [minute, setMinute] = useState<string>(initialHMS.m);
  const [second, setSecond] = useState<string>(initialHMS.s);

  /** 시·분·초 state → 총 초. 비어있는 칸은 0으로 간주. 모두 비면 null. */
  const totalSeconds = useMemo(() => {
    const h = parseInt(hour, 10) || 0;
    const m = parseInt(minute, 10) || 0;
    const s = parseInt(second, 10) || 0;
    if (h === 0 && m === 0 && s === 0) return null;
    return h * 3600 + m * 60 + s;
  }, [hour, minute, second]);

  /**
   * 사용자가 페이스를 직접 override 했을 때 사용. 보통은 자동 계산값 사용.
   * prefill 시 거리·시간이 있어 자동 계산 가능하면 override 비워둠.
   * 그렇지 않은데 기존/스캔 페이스가 있으면 그걸 보존.
   */
  const initialPaceOverride = (() => {
    const distSrc = scanData?.dist ?? initialRec?.dist;
    const timeSrc = scanData?.time ?? initialRec?.time;
    const km = distToKm(distSrc ?? "");
    const sec = timeToSeconds(timeSrc ?? "");
    if (km && sec) return ""; // 자동 계산 가능
    return scanData?.pace ?? initialRec?.pace ?? "";
  })();
  const [paceOverride, setPaceOverride] = useState<string>(initialPaceOverride);

  /* 추가 정보 (선택 사항) — OCR로 인식되거나 사용자가 직접 입력
   * scanData → initialRec → 빈 값 우선순위 */
  const [bpm, setBpm] = useState<string>(
    scanData?.bpm != null
      ? String(scanData.bpm)
      : initialRec?.bpm != null
        ? String(initialRec.bpm)
        : "",
  );
  const [cadence, setCadence] = useState<string>(
    scanData?.cadence != null
      ? String(scanData.cadence)
      : initialRec?.cadence != null
        ? String(initialRec.cadence)
        : "",
  );
  const [kcal, setKcal] = useState<string>(
    scanData?.kcal != null
      ? String(scanData.kcal)
      : initialRec?.kcal != null
        ? String(initialRec.kcal)
        : "",
  );
  // 고도는 단위 포함 문자열("11 m"). 사용자가 숫자만 입력하면 저장 시 "m" 붙임.
  const [elev, setElev] = useState<string>(
    scanData?.elev ?? initialRec?.elev ?? "",
  );

  const [note, setNote] = useState(initialRec?.note ?? "");

  /* 거리·시간으로 자동 계산되는 페이스 */
  const computedPace = useMemo(() => {
    const km = distToKm(dist);
    if (!km || !totalSeconds) return "";
    return secondsToPaceString(totalSeconds / km);
  }, [dist, totalSeconds]);

  /** 화면에 보여줄 페이스. override 있으면 그걸, 없으면 자동 계산값. */
  const paceDisplay = paceOverride || computedPace;

  const today = new Date();
  const initialPickerYM = (() => {
    if (effectiveDateKey) {
      const [yy, mm] = effectiveDateKey.split("-").map(Number);
      return { y: yy, m: mm };
    }
    return { y: today.getFullYear(), m: today.getMonth() + 1 };
  })();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYM, setPickerYM] = useState<{ y: number; m: number }>(initialPickerYM);
  const [pickedKey, setPickedKey] = useState<string | null>(effectiveDateKey);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  /* ── 시간 input refs (자동 포커스 이동용) ────────────── */
  const hourRef = useRef<HTMLInputElement | null>(null);
  const minuteRef = useRef<HTMLInputElement | null>(null);
  const secondRef = useRef<HTMLInputElement | null>(null);

  /**
   * 숫자 input 변경 처리.
   *  - 숫자 외 문자 제거
   *  - max 자릿수 초과 방지
   *  - max 자릿수 채우면 자동으로 다음 input에 포커스
   */
  const handleTimeChange = (
    raw: string,
    maxDigits: number,
    setter: (v: string) => void,
    nextRef?: React.RefObject<HTMLInputElement | null>,
  ) => {
    const cleaned = raw.replace(/\D/g, "").slice(0, maxDigits);
    setter(cleaned);
    if (cleaned.length === maxDigits && nextRef?.current) {
      nextRef.current.focus();
      nextRef.current.select();
    }
  };

  /** 빈 input에서 백스페이스 누르면 이전 input 끝으로 포커스 이동 */
  const handleTimeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentValue: string,
    prevRef?: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (e.key === "Backspace" && currentValue === "" && prevRef?.current) {
      e.preventDefault();
      prevRef.current.focus();
      // 커서를 끝으로
      const len = prevRef.current.value.length;
      prevRef.current.setSelectionRange(len, len);
    }
  };

  useEffect(() => {
    if (!pickerOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!pickerRef.current) return;
      if (!pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [pickerOpen]);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/archive");
  };

  const save = () => {
    if (!date || !dist) {
      showToast("날짜와 거리는 필수예요");
      return;
    }
    const key = inputToKey(date);
    if (!key) {
      showToast("날짜 형식이 올바르지 않아요 (예: 2026.05.04)");
      return;
    }

    // 거리 정규화: "5" → "5", "5.21" → "5.21" (단위 떼고 저장)
    const km = distToKm(dist);
    const distSave = km != null ? String(km) : dist.trim();

    // 시간 정규화: 저장 시 "MM:SS" / "H:MM:SS"로 통일
    const timeSave = totalSeconds != null ? secondsToTimeString(totalSeconds) : undefined;

    // 페이스: 자동 계산값이 있으면 그걸, 없으면 사용자 override
    const paceSave = (computedPace || paceOverride).trim();

    // 추가 필드(bpm/cadence/kcal/elev)는 form state 기준으로 정규화
    const bpmNum = bpm.trim() ? parseInt(bpm.replace(/\D/g, ""), 10) : NaN;
    const cadenceNum = cadence.trim()
      ? parseInt(cadence.replace(/\D/g, ""), 10)
      : NaN;
    const kcalNum = kcal.trim() ? parseInt(kcal.replace(/\D/g, ""), 10) : NaN;
    const elevTrim = elev.trim();
    // 고도: 사용자가 숫자만 입력했으면 자동으로 " m" 붙임
    const elevSave = elevTrim
      ? /\d\s*[a-zA-Z가-힣]/.test(elevTrim)
        ? elevTrim
        : `${elevTrim} m`
      : undefined;

    // 기존 기록의 splits/screenshot은 보존, 다른 필드는 form 기준
    const preserved = userRecords[key] || archiveRecords[key];

    addRecord(key, {
      ...preserved,
      ...(isFinite(bpmNum) ? { bpm: bpmNum } : { bpm: undefined }),
      ...(isFinite(cadenceNum)
        ? { cadence: cadenceNum }
        : { cadence: undefined }),
      ...(isFinite(kcalNum) ? { kcal: kcalNum } : { kcal: undefined }),
      ...(elevSave ? { elev: elevSave } : { elev: undefined }),
      // splits/screenshot은 OCR로만 들어옴 (form에 없음)
      ...(scanData?.splits && scanData.splits.length > 0
        ? { splits: scanData.splits }
        : {}),
      ...(scanData?.screenshot ? { screenshot: scanData.screenshot } : {}),
      dist: distSave,
      pace: paceSave,
      time: timeSave,
      note: note.trim() || undefined,
    });
    const [yy, mm] = key.split("-").map(Number);
    setArchiveMonth(yy, mm);
    if (archiveSelected !== key) {
      pickDate(key);
    }
    showToast("기록을 저장했어요");
    setTimeout(() => back(), 500);
  };

  const togglePicker = () => {
    setPickerOpen((v) => !v);
  };

  const prevMonth = () => {
    setPickerYM(({ y, m }) => (m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }));
  };
  const nextMonth = () => {
    setPickerYM(({ y, m }) => (m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }));
  };

  const onPickDay = (y: number, m: number, d: number) => {
    const key = dateKey(y, m, d);
    setPickedKey(key);
    setDate(formatDateInput(y, m, d));
    setPickerOpen(false);
  };

  const { y, m } = pickerYM;
  const firstDow = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const prevDays = new Date(y, m - 1, 0).getDate();
  type Cell = { d: number; key: string; other: boolean; y: number; m: number };
  const cells: Cell[] = [];
  for (let i = 0; i < firstDow; i++) {
    const d = prevDays - firstDow + 1 + i;
    const py = m === 1 ? y - 1 : y;
    const pm = m === 1 ? 12 : m - 1;
    cells.push({ d, key: dateKey(py, pm, d), other: true, y: py, m: pm });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ d, key: dateKey(y, m, d), other: false, y, m });
  }
  while (cells.length % 7) {
    const d = cells.length - firstDow - daysInMonth + 1;
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    cells.push({ d, key: dateKey(ny, nm, d), other: true, y: ny, m: nm });
  }

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
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="입력하기"
              readOnly
              onClick={togglePicker}
            />
            <button
              type="button"
              className="am-cal-btn"
              onClick={togglePicker}
              aria-label="캘린더 열기"
              aria-expanded={pickerOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 10h18M8 2v4M16 2v4" />
              </svg>
            </button>

            {pickerOpen && (
              <div className="am-cal-pop" ref={pickerRef} role="dialog" aria-label="날짜 선택">
                <div className="amcp-head">
                  <button className="amcp-arrow" onClick={prevMonth} aria-label="이전 달" type="button">
                    ‹
                  </button>
                  <span className="amcp-title">
                    {y}년 {m}월
                  </span>
                  <button className="amcp-arrow" onClick={nextMonth} aria-label="다음 달" type="button">
                    ›
                  </button>
                </div>
                <div className="amcp-dow">
                  {KO_DOW.map((d, i) => (
                    <span key={d} className={i === 0 ? "sun" : i === 6 ? "sat" : ""}>
                      {d}
                    </span>
                  ))}
                </div>
                <div className="amcp-grid">
                  {cells.map((c, i) => {
                    const dow = i % 7;
                    const cls = ["amcp-day"];
                    if (c.other) cls.push("other");
                    if (pickedKey === c.key) cls.push("sel");
                    if (dow === 0) cls.push("sun");
                    if (dow === 6) cls.push("sat");
                    return (
                      <button
                        key={`${c.key}-${i}`}
                        type="button"
                        className={cls.join(" ")}
                        onClick={() => onPickDay(c.y, c.m, c.d)}
                      >
                        {c.d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 거리 — 우측에 km 자동 표시 */}
        <div className="am-field">
          <label>거리</label>
          <div className="am-input-wrap">
            <input
              type="text"
              inputMode="decimal"
              value={dist}
              onChange={(e) => setDist(e.target.value)}
              placeholder="입력하기"
            />
            {dist.trim() && <span className="am-suffix">km</span>}
          </div>
        </div>

        {/* 시간 — 시/분/초 분리 input. 자동 포커스 이동. */}
        <div className="am-field">
          <label>시간</label>
          <div className="am-time-row" role="group" aria-label="시간 입력">
            <div className="am-time-cell">
              <input
                ref={hourRef}
                type="text"
                inputMode="numeric"
                value={hour}
                onChange={(e) =>
                  handleTimeChange(e.target.value, 2, setHour, minuteRef)
                }
                onFocus={(e) => e.target.select()}
                placeholder="00"
                aria-label="시간"
              />
              <span className="am-time-unit">시</span>
            </div>
            <span className="am-time-sep">:</span>
            <div className="am-time-cell">
              <input
                ref={minuteRef}
                type="text"
                inputMode="numeric"
                value={minute}
                onChange={(e) =>
                  handleTimeChange(e.target.value, 2, setMinute, secondRef)
                }
                onKeyDown={(e) => handleTimeKeyDown(e, minute, hourRef)}
                onFocus={(e) => e.target.select()}
                placeholder="00"
                aria-label="분"
              />
              <span className="am-time-unit">분</span>
            </div>
            <span className="am-time-sep">:</span>
            <div className="am-time-cell">
              <input
                ref={secondRef}
                type="text"
                inputMode="numeric"
                value={second}
                onChange={(e) =>
                  handleTimeChange(e.target.value, 2, setSecond)
                }
                onKeyDown={(e) => handleTimeKeyDown(e, second, minuteRef)}
                onFocus={(e) => e.target.select()}
                placeholder="00"
                aria-label="초"
              />
              <span className="am-time-unit">초</span>
            </div>
          </div>
        </div>

        {/* 평균 페이스 — 자동 계산. 사용자가 클릭해서 직접 입력도 가능 */}
        <div className="am-field">
          <label>
            평균 페이스
            <span className="am-auto-tag">자동 계산</span>
          </label>
          <div className="am-input-wrap">
            <input
              type="text"
              value={paceDisplay}
              onChange={(e) => setPaceOverride(e.target.value)}
              placeholder={
                computedPace
                  ? ""
                  : "거리·시간을 입력하면 자동으로 계산돼요"
              }
              className={computedPace && !paceOverride ? "am-pace-auto" : ""}
            />
            {paceDisplay && <span className="am-suffix">/km</span>}
          </div>
        </div>

        {/* 추가 정보 (선택사항) — 캡쳐 사진에서 자동 인식되거나 직접 입력 */}
        <div className="am-section-label">추가 정보 (선택)</div>
        <div className="am-grid-2">
          <div className="am-field">
            <label>평균 심박수</label>
            <div className="am-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                value={bpm}
                onChange={(e) => setBpm(e.target.value.replace(/\D/g, ""))}
                placeholder="입력하기"
              />
              {bpm.trim() && <span className="am-suffix">bpm</span>}
            </div>
          </div>
          <div className="am-field">
            <label>케이던스</label>
            <div className="am-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                value={cadence}
                onChange={(e) => setCadence(e.target.value.replace(/\D/g, ""))}
                placeholder="입력하기"
              />
              {cadence.trim() && <span className="am-suffix">spm</span>}
            </div>
          </div>
          <div className="am-field">
            <label>칼로리</label>
            <div className="am-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                value={kcal}
                onChange={(e) => setKcal(e.target.value.replace(/\D/g, ""))}
                placeholder="입력하기"
              />
              {kcal.trim() && <span className="am-suffix">kcal</span>}
            </div>
          </div>
          <div className="am-field">
            <label>누적 상승</label>
            <div className="am-input-wrap">
              <input
                type="text"
                value={elev}
                onChange={(e) => setElev(e.target.value)}
                placeholder="예: 11 m"
              />
              {elev.trim() && !/[a-zA-Z가-힣]/.test(elev) && (
                <span className="am-suffix">m</span>
              )}
            </div>
          </div>
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
