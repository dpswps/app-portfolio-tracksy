"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import type { ScanResult } from "@/types";

/* ──────────────────────────────────────────────────────────
 * OCR 업로드 — 단계별 헬퍼.
 *
 * 갤럭시 S21 등 구형 Android(Chromium 90 미만 / 삼성 인터넷 일부 버전) 에서
 * createImageBitmap / OffscreenCanvas / URL.createObjectURL 의 OCR 경로 사용을
 * 했을 때 디코딩이 실패하거나 fetch 직전에 자바스크립트 엔진이 멈추는 케이스가
 * 보고됐다. 이를 회피하기 위해 OCR 경로는 다음 단계만 사용한다(보장된 API 만):
 *   1) FileReader.readAsDataURL(file)   — 파일을 base64 dataURL 로 읽기
 *   2) new Image().onload                — HTMLImageElement 로 디코딩
 *   3) canvas.drawImage + toDataURL("image/jpeg", 0.65)
 *   4) fetch("/api/ocr", { ... })
 *
 * 각 단계가 독립 함수라서 호출 측 try/catch 가 정확한 실패 지점을 콘솔/UI 로
 * 보여줄 수 있다.
 * ────────────────────────────────────────────────────────── */

/** Step 1: File → base64 dataURL (FileReader 사용). */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error || new Error("FileReader 실패"));
    reader.readAsDataURL(file);
  });
}

/** Step 2: dataURL → HTMLImageElement (new Image + onload). */
function loadImageFromDataUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image onerror"));
    img.src = src;
  });
}

/** Step 3: image → canvas 리사이즈/JPEG 압축. 최대 가로 1000px, quality 0.65. */
function compressImageToJpegBase64(
  img: HTMLImageElement,
  maxWidth = 1000,
  quality = 0.65,
): string {
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas getContext('2d') === null");
  }
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function ArchiveScanPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const setPendingScanData = useAppStore((s) => s.setPendingScanData);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  // 파일 선택 직후 미리 압축해둔 base64 — onAnalyze 시 그대로 fetch 에 사용한다.
  // 이렇게 분리한 이유: 갤럭시 S21/Samsung Files 조합 등 일부 Android 환경에서
  // 파일 선택 후 시간이 지나면 OS 가 파일 참조 권한을 회수해서, "기록 분석하기"
  // 버튼을 누른 시점엔 FileReader 가 NotReadableError 로 실패한다("permission
  // problems that have occurred after a reference to a file was acquired").
  // 권한이 살아있는 onFileSelected 콜백 안에서 즉시 읽어 base64 로 박제해두면
  // 이 문제를 우회할 수 있다. base64 는 단순 문자열이라 권한 만료와 무관.
  const [compressedBase64, setCompressedBase64] = useState<string | null>(null);
  // 파일 선택 후 압축이 진행 중인 상태 — 분석 버튼을 일시 비활성화.
  const [preparing, setPreparing] = useState(false);
  // OCR 단계별 실패를 사용자에게 화면으로 표시 — 콘솔에 안 나오는 모바일 환경에서
  // 어디서 실패했는지 즉시 확인하기 위함. errorMessage 는 한 줄짜리 사용자용 문구,
  // debugMessage 는 그 아래에 작은 회색 글씨로 표시되는 기술적 디테일(에러 메시지/
  // HTTP 상태/base64 길이 등).
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/archive");
  };

  // Clean up the object URL when the preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openPicker = () => {
    if (analyzing) return;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일만 업로드할 수 있어요");
      return;
    }
    // 1) 미리보기 — URL.createObjectURL 은 화면 썸네일 렌더링용. OCR 경로와는
    //    무관(아래의 압축은 file 자체에서 별도로 진행됨).
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setFileName(file.name);
    setPickedFile(file);
    setCompressedBase64(null);
    setErrorMessage(null);
    setDebugMessage(null);
    showToast("사진을 업로드했어요");

    /* 2) 파일 권한이 살아있는 지금 즉시 base64 로 압축해 박제.
     *
     * 갤럭시 S21 + Samsung Files 같은 환경에서 onFileSelected 콜백 종료 후
     * 일정 시간이 지나면 OS 가 file 객체의 read 권한을 회수한다 → "기록 분석
     * 하기" 누를 때 FileReader 가 NotReadableError 로 실패. 그래서 선택 직후
     * 같은 micro-task 사이클 안에서 readAsDataURL → Image → canvas → JPEG
     * base64 까지 완료한 뒤 결과만 state 에 저장해둔다.
     *
     * 어느 단계에서 실패해도 화면에 정확한 단계명 + debug 메시지를 노출.  */
    setPreparing(true);
    try {
      console.log("[ocr] selected file type:", file.type);
      console.log("[ocr] selected file size:", file.size);

      // (a) FileReader — fresh 권한으로 즉시 읽기.
      let dataUrl: string;
      try {
        dataUrl = await readFileAsDataUrl(file);
      } catch (err) {
        console.error("[ocr] readFileAsDataUrl failed:", err);
        setErrorMessage("이미지 읽기 실패");
        setDebugMessage(err instanceof Error ? err.message : String(err));
        return;
      }

      // (b) Image decode.
      let img: HTMLImageElement;
      try {
        img = await loadImageFromDataUrl(dataUrl);
      } catch (err) {
        console.error("[ocr] loadImageFromDataUrl failed:", err);
        setErrorMessage("이미지 로딩 실패");
        setDebugMessage(err instanceof Error ? err.message : String(err));
        return;
      }
      console.log("[ocr] image width:", img.width);
      console.log("[ocr] image height:", img.height);

      // (c) canvas + JPEG 압축.
      let compressed: string;
      try {
        compressed = compressImageToJpegBase64(img, 1000, 0.65);
      } catch (err) {
        console.error("[ocr] compressImageToJpegBase64 failed:", err);
        setErrorMessage("이미지 변환 실패");
        setDebugMessage(err instanceof Error ? err.message : String(err));
        return;
      }
      console.log("[ocr] compressed base64 length:", compressed.length);

      // (d) base64 sanity check.
      if (
        !compressed ||
        compressed.length < 200 ||
        !compressed.startsWith("data:image/")
      ) {
        console.error("[ocr] base64 invalid — length:", compressed?.length);
        setErrorMessage("base64 생성 실패");
        setDebugMessage(
          `length=${compressed?.length ?? 0}, prefix=${compressed?.slice(0, 30) ?? ""}`,
        );
        return;
      }

      // (e) 캐시 — 이후 onAnalyze 에서 그대로 fetch 에 사용.
      setCompressedBase64(compressed);
    } finally {
      setPreparing(false);
    }
  };

  const removePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (analyzing) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
    setPickedFile(null);
    // 캐시된 base64 + 에러 상태도 함께 초기화.
    setCompressedBase64(null);
    setErrorMessage(null);
    setDebugMessage(null);
  };

  /** OCR 결과에서 의미있는 항목이 하나라도 있는지 */
  const hasAnyData = (r: ScanResult): boolean =>
    !!(
      r.date ||
      r.dist ||
      r.time ||
      r.pace ||
      r.bpm ||
      r.cadence ||
      r.kcal ||
      r.elev ||
      (r.splits && r.splits.length > 0)
    );

  /**
   * OCR 업로드 — 압축은 이미 onFileSelected 에서 완료됨. 여기서는 캐시된 base64
   * 를 그대로 fetch 에 보낸다. 갤럭시 S21 등에서 파일 권한이 만료된 후에도
   * base64 문자열은 그대로 유효하므로 NotReadableError 가 발생하지 않음.
   *
   * 시퀀스:
   *   1) 캐시 base64 확인  → 없으면 "이미지 준비가 완료되지 않았습니다"
   *   2) fetch("/api/ocr") → 실패 시 "OCR 요청 전송 실패"
   *   3) 결과 파싱         → 기존 로직 그대로
   */
  const onAnalyze = async () => {
    if (analyzing) return;

    // 파일 자체가 없으면 단순 안내.
    if (!pickedFile) {
      console.error("[ocr] no pickedFile");
      setErrorMessage("파일이 선택되지 않았습니다");
      setDebugMessage(null);
      return;
    }

    // 압축이 아직 안 끝났거나 실패한 상태 — onFileSelected 에서 setError 가
    // 이미 호출됐으면 그 메시지가 화면에 떠 있고, 그렇지 않으면 안내만 한다.
    if (!compressedBase64) {
      if (preparing) {
        setErrorMessage(null);
        setDebugMessage("이미지 준비 중입니다. 잠시 후 다시 시도해주세요.");
      } else if (!errorMessage) {
        setErrorMessage("이미지 준비가 완료되지 않았습니다");
        setDebugMessage("사진을 다시 선택해주세요.");
      }
      return;
    }

    setAnalyzing(true);
    setErrorMessage(null);
    setDebugMessage(null);

    try {
      // fetch("/api/ocr") — 캐시된 base64 전송.
      console.log("[ocr] before fetch");
      let response: Response;
      try {
        response = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressedBase64 }),
        });
      } catch (err) {
        console.error("[ocr] fetch threw:", err);
        setErrorMessage("OCR 요청 전송 실패");
        setDebugMessage(err instanceof Error ? err.message : String(err));
        return;
      }
      console.log("[ocr] fetch status:", response.status);

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        console.error("[ocr] non-ok response:", response.status, bodyText);
        setErrorMessage("OCR 요청 전송 실패");
        setDebugMessage(
          `HTTP ${response.status}${bodyText ? `: ${bodyText.slice(0, 200)}` : ""}`,
        );
        return;
      }

      // 결과 파싱 + 라우팅 — 기존 로직 유지.
      const ocrJson = (await response.json()) as { result?: ScanResult };
      const result = ocrJson?.result;

      if (!result || !hasAnyData(result)) {
        showToast("기록을 인식하지 못했어요. 직접 입력해주세요.");
        setPendingScanData({
          date: null,
          dist: null,
          time: null,
          pace: null,
          bpm: null,
          cadence: null,
          kcal: null,
          elev: null,
          splits: null,
          screenshot: compressedBase64,
        });
        router.push("/archive/manual");
        return;
      }

      setPendingScanData({ ...result, screenshot: compressedBase64 });
      showToast("사진에서 기록을 추출했어요");
      router.push("/archive/manual");
    } finally {
      // 성공/실패 무관하게 loading 해제 + 파일 input 초기화(ref 경유).
      setAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="archive-modal">
      <div className="am-head">
        <div>
          <div className="am-title">캡쳐사진 스캔하기</div>
          <div className="am-sub">러닝 기록 캡쳐 사진을 업로드해주세요.</div>
        </div>
        <button className="am-close" onClick={back} aria-label="닫기" disabled={analyzing}>
          ×
        </button>
      </div>

      <div className="scan-examples">
        <div className="se-title">지원 예시</div>
        <div className="se-grid">
          {/* 사용자가 제공한 캡쳐 사진 지원 예시 3장 (가로 정렬) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scan-example-1.png"
            alt="러닝 앱 캡쳐 예시 1"
            className="se-tile se-tile-img"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scan-example-2.png"
            alt="러닝 앱 캡쳐 예시 2"
            className="se-tile se-tile-img"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scan-example-3.png"
            alt="러닝 앱 캡쳐 예시 3"
            className="se-tile se-tile-img"
          />
        </div>
      </div>

      <div
        className={`scan-drop${previewUrl ? " has-preview" : ""}${analyzing ? " analyzing" : ""}`}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        aria-label="캡쳐 사진 업로드"
        aria-disabled={analyzing}
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="업로드한 캡쳐 사진" className="sd-preview" />
            {!analyzing && (
              <button
                type="button"
                className="sd-remove"
                onClick={removePreview}
                aria-label="사진 제거"
              >
                ×
              </button>
            )}
            {fileName && <div className="sd-filename">{fileName}</div>}
            {analyzing && (
              <div className="sd-analyzing-overlay">
                <div className="sd-spinner" />
                <div className="sd-analyzing-text">기록 분석 중…</div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="sd-cloud">
              <svg viewBox="0 0 60 60" fill="none" stroke="#8B5CF6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 38 a10 10 0 1 1 4 -19 a14 14 0 0 1 26 6 a8 8 0 0 1 0 16 H22 a4 4 0 0 1 -4 -3" />
                <path d="M30 26 v14 M24 32 l6 -6 6 6" />
              </svg>
            </div>
            <div className="sd-label">캡쳐 사진 업로드</div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onFileSelected}
      />

      <div className="scan-tip">
        <div className="st-title">TIP</div>
        <p>
          기록이 잘 보이도록 캡쳐해주세요.
          <br />
          거리, 시간, 페이스가 보이면 인식이 더 잘 돼요.
        </p>
      </div>

      {/* OCR 단계별 에러 표시 — 모바일 콘솔에 접근 못하는 사용자도 어디서
          실패했는지 즉시 알 수 있도록 모달 안에 inline 으로 노출.
          (showToast 는 토스트라 빨리 사라져서 진단용으로 부족함.) */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            margin: "10px 16px 0",
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.35)",
            color: "#B91C1C",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 700 }}>{errorMessage}</div>
          {debugMessage && (
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "rgba(0,0,0,0.5)",
                wordBreak: "break-all",
              }}
            >
              {debugMessage}
            </div>
          )}
        </div>
      )}

      {previewUrl && (
        <button
          className="primary-btn am-save"
          onClick={onAnalyze}
          disabled={analyzing || preparing}
        >
          {analyzing
            ? "분석 중…"
            : preparing
              ? "준비 중…"
              : "기록 분석하기"}
        </button>
      )}
    </div>
  );
}
