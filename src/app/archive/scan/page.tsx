"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";

export default function ArchiveScanPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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
    showToast("사진을 업로드했어요");
  };

  const removePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
  };

  const onAnalyze = () => {
    showToast("기록을 분석하고 있어요");
    setTimeout(() => back(), 700);
  };

  return (
    <div className="archive-modal">
      <div className="am-head">
        <div>
          <div className="am-title">캡쳐사진 스캔하기</div>
          <div className="am-sub">러닝 기록 캡쳐 사진을 업로드해주세요.</div>
        </div>
        <button className="am-close" onClick={back} aria-label="닫기">
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
        className={`scan-drop${previewUrl ? " has-preview" : ""}`}
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
      >
        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="업로드한 캡쳐 사진" className="sd-preview" />
            <button
              type="button"
              className="sd-remove"
              onClick={removePreview}
              aria-label="사진 제거"
            >
              ×
            </button>
            {fileName && <div className="sd-filename">{fileName}</div>}
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
        <button className="primary-btn am-save" onClick={onAnalyze}>
          기록 분석하기
        </button>
      )}
    </div>
  );
}
