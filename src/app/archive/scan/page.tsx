"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import type { ScanResult } from "@/types";

/** File → base64 data URL 변환 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지를 canvas에 그려서 max 너비로 리사이즈 + JPEG 압축.
 * localStorage에 base64로 저장할 때 용량 부담 줄임 (대형 사진 → 100~300KB 수준).
 */
function compressImage(
  dataUrl: string,
  maxWidth = 800,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // canvas 미지원 환경 → 원본 그대로
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        // tainted canvas 등 → 원본 그대로
        resolve(dataUrl);
      }
    };
    img.onerror = () => reject(new Error("이미지 로드 실패"));
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
    try {
      // 1) 원본을 base64 data URL로 (OCR 전송용)
      const originalDataUrl = await fileToDataUrl(pickedFile);

      // 2) OCR 호출 + 동시에 사진 압축 (저장용 thumbnail)
      const [ocrJson, compressed] = await Promise.all([
        fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: originalDataUrl }),
        }).then((r) => r.json()),
        compressImage(originalDataUrl).catch(() => originalDataUrl),
      ]);

      const result: ScanResult | undefined = ocrJson?.result;

      if (!result || !hasAnyData(result)) {
        showToast("기록을 인식하지 못했어요. 직접 입력해주세요.");
        // 인식은 실패해도 사진 자체는 보존해서 지도로 활용
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

      // OCR 결과에 압축된 사진을 함께 담음
      setPendingScanData({ ...result, screenshot: compressed });
      showToast("사진에서 기록을 추출했어요");
      router.push("/archive/manual");
    } catch (err) {
      console.error("OCR error:", err);
      showToast("분석 중 오류가 발생했어요");
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
          <div className="se-tile" style={{ background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)" }}>
            <div className="se-mock se-mock-map" />
          </div>
          <div className="se-tile" style={{ background: "linear-gradient(135deg,#1F2937,#111827)" }}>
            <div className="se-mock se-mock-stats" />
          </div>
          <div className="se-tile" style={{ background: "linear-gradient(135deg,#FEF3C7,#FDE68A)" }}>
            <div className="se-mock se-mock-summary" />
          </div>
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
