"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import type { ScanResult } from "@/types";

/** File → base64 data URL 변환 (구형 안드로이드 fallback 경로용) */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error || new Error("파일을 읽지 못했어요"));
    reader.readAsDataURL(file);
  });
}

/**
 * File을 캔버스에 그려 maxWidth로 리사이즈 + JPEG 압축해서 base64 dataURL로 반환.
 *
 * 왜 이렇게까지 하나?
 * - 갤럭시 S21 등 고해상도 카메라는 원본이 4~8MB. base64 인코딩 시 +33% → 6~11MB.
 *   이를 fetch 바디로 보내면 Vercel 4.5MB 한도에 엣지에서 거부되거나, 안드로이드
 *   JS 엔진 메모리/JSON.stringify에서 실패한다.
 * - 그래서 OCR 업로드와 로컬 저장(screenshot) 양쪽 모두 *압축본*을 쓴다.
 *
 * 구현 전략:
 * 1) 최신 경로: createImageBitmap(file) → canvas. blob 단계에서 디코딩을 위임해
 *    new Image()의 메모리 문제(특히 Samsung Internet)를 피한다.
 * 2) Fallback: FileReader → new Image() → canvas. 1)이 안되는 환경 (createImageBitmap
 *    미지원 또는 HEIC 등) 에서 사용.
 *
 * 둘 다 실패해도 호출자에서 step별 메시지로 사용자에게 정확한 실패 단계를 알려줌.
 */
async function compressFileToDataUrl(
  file: File,
  maxWidth = 1280,
  quality = 0.72,
): Promise<string> {
  // 1) Modern path — createImageBitmap (Chrome/Edge/Firefox 50+, Safari 15+,
  //    삼성 인터넷 14+ 등 대부분의 현역 모바일 브라우저 지원)
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(file);
      const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, w, h);
        const out = canvas.toDataURL("image/jpeg", quality);
        try {
          bitmap.close();
        } catch {
          /* ignore */
        }
        return out;
      }
    } catch (err) {
      console.warn(
        "[scan] createImageBitmap path failed, falling back to Image():",
        err,
      );
      try {
        bitmap?.close();
      } catch {
        /* ignore */
      }
    }
  }

  // 2) Fallback path — FileReader → new Image() → canvas
  const dataUrl = await fileToDataUrl(file);
  return await new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl); // canvas 미지원 → 원본 그대로 (마지막 안전망)
        return;
      }
      try {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (e) {
        // tainted canvas 등 — 원본 dataUrl이라도 반환
        console.warn("[scan] canvas draw/toDataURL failed:", e);
        resolve(dataUrl);
      }
    };
    img.onerror = () =>
      reject(new Error("이미지를 디코딩하지 못했어요 (지원되지 않는 형식일 수 있어요)"));
    img.src = dataUrl;
  });
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

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("이미지 파일만 업로드할 수 있어요");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setFileName(file.name);
    setPickedFile(file);
    showToast("사진을 업로드했어요");
  };

  const removePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (analyzing) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
    setPickedFile(null);
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

  const onAnalyze = async () => {
    if (!pickedFile || analyzing) return;
    setAnalyzing(true);

    /* 단계별 실패 지점을 추적 — 사용자에게 "어디서 실패했는지" 알려주고
     * 콘솔로도 디버깅할 수 있도록 한다. (S21 처럼 특정 기기에서만 실패할 때
     * 이전엔 "분석 중 오류" 만 떴는데, 이제 어느 단계인지까지 보인다.) */
    let step: "compress" | "ocr-fetch" | "ocr-parse" | "done" = "compress";
    try {
      // 1) 파일 → 압축된 base64. OCR 업로드 + 로컬 screenshot 양쪽에 동일하게 사용.
      //    원본을 OCR에 보내지 않는 이유는 위 compressFileToDataUrl 주석 참고.
      step = "compress";
      const compressed = await compressFileToDataUrl(pickedFile, 1280, 0.72);

      // payload 크기 가드 — 압축에도 불구하고 너무 크면 사용자에게 알리고 중단.
      // (Vercel free 4.5MB 제한. base64는 원본 대비 ~1.33배, JSON wrapping까지
      //  여유를 두고 4_000_000 byte로 컷.)
      if (compressed.length > 4_000_000) {
        throw new Error(
          "사진이 너무 커서 분석할 수 없어요. 더 작은 사진으로 다시 시도해주세요.",
        );
      }

      // 2) OCR 호출 — 압축본을 전송. 60초 타임아웃으로 무한 대기 방지.
      step = "ocr-fetch";
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 60_000);
      let res: Response;
      try {
        res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressed }),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(tid);
      }
      if (!res.ok) {
        // 413 (Payload Too Large), 5xx 등 명시적 실패. Vercel 엣지에서 거부될 때
        // 보통 413이 떨어진다.
        throw new Error(`서버 응답 오류 (HTTP ${res.status})`);
      }

      step = "ocr-parse";
      const ocrJson = (await res.json()) as { result?: ScanResult };
      const result = ocrJson?.result;

      step = "done";
      if (!result || !hasAnyData(result)) {
        showToast("기록을 인식하지 못했어요. 직접 입력해주세요.");
        // 인식이 실패해도 사진 자체는 보존해서 지도/스튜디오에서 활용
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
          screenshot: compressed,
        });
        router.push("/archive/manual");
        return;
      }

      setPendingScanData({ ...result, screenshot: compressed });
      showToast("사진에서 기록을 추출했어요");
      router.push("/archive/manual");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[scan] failed at step '${step}':`, err);

      // 단계별 사용자 메시지. step 으로 어디서 실패했는지 구분.
      if (step === "compress") {
        showToast(
          msg.includes("디코딩") || msg.includes("읽")
            ? msg
            : "이미지 처리에 실패했어요. 다른 사진으로 시도해주세요.",
        );
      } else if (step === "ocr-fetch") {
        if (err instanceof DOMException && err.name === "AbortError") {
          showToast("서버 응답이 너무 느려요. 잠시 후 다시 시도해주세요.");
        } else {
          showToast(`서버 연결 실패: ${msg}`);
        }
      } else if (step === "ocr-parse") {
        showToast("서버 응답을 해석하지 못했어요. 다시 시도해주세요.");
      } else {
        showToast(`분석 중 오류: ${msg}`);
      }
      setAnalyzing(false);
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

      {previewUrl && (
        <button
          className="primary-btn am-save"
          onClick={onAnalyze}
          disabled={analyzing}
        >
          {analyzing ? "분석 중…" : "기록 분석하기"}
        </button>
      )}
    </div>
  );
}
