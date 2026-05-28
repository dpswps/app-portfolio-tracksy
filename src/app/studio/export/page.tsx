"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import RunningCard from "@/features/studio/RunningCard";
import { useAppStore } from "@/stores/useAppStore";
import { downloadCardAsImage } from "@/lib/downloadCard";

/**
 * 카드 DOM 을 PNG Blob 으로 캡쳐. downloadCard 내부 로직과 동일하게 외부 이미지를
 * inline 처리 후 html-to-image 로 캡쳐한다. export page 의 공유 흐름이 공통 사용.
 */
async function captureCardBlob(): Promise<Blob | null> {
  const el = document.querySelector<HTMLElement>(".export-preview .running-card");
  if (!el) return null;
  const htmlToImage = await import("html-to-image");
  // downloadCard.ts 의 inlineExternalImages 와 동일한 처리를 inline 으로.
  const restorations: Array<() => void> = [];
  const isInlineable = (u: string) => u.startsWith("http://") || u.startsWith("https://");
  const blobToData = (b: Blob) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(b);
    });
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") ?? "";
      if (!src || !isInlineable(src)) return;
      try {
        const res = await fetch(src, { mode: "cors", cache: "force-cache" });
        if (!res.ok) return;
        const data = await blobToData(await res.blob());
        const orig = src;
        img.setAttribute("src", data);
        restorations.push(() => img.setAttribute("src", orig));
      } catch {}
    }),
  );
  const nodes = Array.from(el.querySelectorAll<HTMLElement>("*"));
  nodes.push(el);
  await Promise.all(
    nodes.map(async (node) => {
      const computed = window.getComputedStyle(node).backgroundImage;
      const m = computed.match(/url\(["']?([^"')]+)["']?\)/);
      if (!m) return;
      const url = m[1];
      if (!isInlineable(url)) return;
      try {
        const res = await fetch(url, { mode: "cors", cache: "force-cache" });
        if (!res.ok) return;
        const data = await blobToData(await res.blob());
        const orig = node.style.backgroundImage;
        node.style.backgroundImage = computed.replace(url, data);
        restorations.push(() => {
          if (orig) node.style.backgroundImage = orig;
          else node.style.removeProperty("background-image");
        });
      } catch {}
    }),
  );
  try {
    const blob = await htmlToImage.toBlob(el, {
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: "",
      backgroundColor: undefined,
    });
    return blob;
  } finally {
    restorations.forEach((fn) => fn());
  }
}

export default function StudioExportPage() {
  const router = useRouter();
  const showToast = useAppStore((s) => s.showToast);
  const user = useAppStore((s) => s.user);
  const [busy, setBusy] = useState<"gallery" | "insta" | "kakao" | "link" | null>(null);

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/studio");
  };

  /** 공유 가능한 URL — 사용자 프로필 페이지 또는 갤러리 카드 상세 URL.
   *  실제 카드별 공유 URL 은 추후 /share/[id] 라우트로 확장 예정.
   *  현재는 사이트 루트로 안내. */
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://tracksy.app";
  const shareTitle = `${user.name || "나"}의 러닝 카드`;
  const shareText = "Tracksy 에서 만든 러닝 카드를 확인해보세요!";

  const onSaveToGallery = async () => {
    if (busy) return;
    setBusy("gallery");
    try {
      const result = await downloadCardAsImage(".export-preview .running-card");
      if (result === "shared") showToast("공유 시트에서 '사진에 저장'을 선택하세요");
      else if (result === "downloaded") showToast("내 사진첩(다운로드 폴더)에 저장되었습니다");
    } catch (e) {
      showToast(`저장 실패: ${e instanceof Error ? e.message : "오류"}`);
    } finally {
      setBusy(null);
    }
  };

  /**
   * 인스타 공유 — 모바일에서:
   *   - Web Share API (files 포함) 로 시스템 공유시트 → 사용자가 Instagram 선택
   *     → Instagram 이 자동으로 새 게시물/스토리 화면 띄움
   * 데스크탑/지원 안 함:
   *   - 카드를 다운로드해주고 인스타 웹에 직접 업로드하라고 안내
   */
  const onShareInsta = async () => {
    if (busy) return;
    setBusy("insta");
    try {
      const blob = await captureCardBlob();
      if (!blob) throw new Error("카드 캡쳐 실패");
      const file = new File([blob], "tracksy-card.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] }) && typeof navigator.share === "function") {
        await navigator.share({ files: [file], title: shareTitle, text: shareText });
        showToast("공유시트에서 Instagram 을 선택하세요");
      } else {
        // 데스크탑 폴백: 다운로드 → 사용자가 인스타 웹에서 업로드
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tracksy-card.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast("카드를 내려받았어요. 인스타에 업로드해보세요!");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("AbortError")) showToast(`인스타 공유 실패: ${msg.slice(0, 40)}`);
    } finally {
      setBusy(null);
    }
  };

  /**
   * 카카오톡 공유 —
   *   1) Web Share API + files 가 가능하면 시스템 공유시트로 (사용자가 카카오톡 선택)
   *   2) 안 되면 Kakao JS SDK 가 있는지 확인 후 sendDefault. (현재는 미설치)
   *   3) 그것도 안 되면 카드 + 텍스트 클립보드 복사 + 안내.
   */
  const onShareKakao = async () => {
    if (busy) return;
    setBusy("kakao");
    try {
      const blob = await captureCardBlob();
      if (!blob) throw new Error("카드 캡쳐 실패");
      const file = new File([blob], "tracksy-card.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] }) && typeof navigator.share === "function") {
        await navigator.share({ files: [file], title: shareTitle, text: shareText });
        showToast("공유시트에서 카카오톡을 선택하세요");
      } else {
        // 폴백: 텍스트 + URL 클립보드 복사 + 카드 다운로드.
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tracksy-card.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        showToast("카드 다운로드 + 텍스트 복사 완료 — 카카오톡에서 붙여넣어주세요");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("AbortError")) showToast(`카카오 공유 실패: ${msg.slice(0, 40)}`);
    } finally {
      setBusy(null);
    }
  };

  const onCopyLink = async () => {
    if (busy) return;
    setBusy("link");
    try {
      const link = shareUrl;
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        // 구형 브라우저 폴백.
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      showToast("공유 링크가 복사되었어요");
    } catch {
      showToast("링크 복사에 실패했어요");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="app-header export-header">
        <button className="back-btn" onClick={back} style={{ color: "#fff" }}>
          &lsaquo;
        </button>
        <div className="title" style={{ color: "#fff" }}>
          갤러리 보관소에 저장 완료
        </div>
      </div>
      <section className="export-screen">
        <div className="export-preview">
          <RunningCard small />
        </div>
        <div className="export-section">
          <div className="export-label">공유 및 저장</div>
          <button className="export-insta" onClick={onShareInsta} disabled={busy !== null}>
            <span className="ig-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="white" />
              </svg>
            </span>
            <span className="ig-text">
              <b>{busy === "insta" ? "준비 중…" : "인스타 공유"}</b>
              <em>인스타그램 스토리에 바로 공유해보세요</em>
            </span>
          </button>
          <button className="export-row" onClick={onShareKakao} disabled={busy !== null}>
            <span className="er-ic kk">K</span>
            <span>{busy === "kakao" ? "준비 중…" : "카카오톡 공유하기"}</span>
            <span className="er-arrow">&rsaquo;</span>
          </button>
          <button className="export-row" onClick={onCopyLink} disabled={busy !== null}>
            <span className="er-ic">🔗</span>
            <span>{busy === "link" ? "복사 중…" : "공유 링크 복사"}</span>
            <span className="er-arrow">&rsaquo;</span>
          </button>
          <button className="export-row" onClick={onSaveToGallery} disabled={busy !== null}>
            <span className="er-ic">🖼</span>
            <span>{busy === "gallery" ? "준비 중…" : "내 휴대폰 갤러리 저장"}</span>
            <span className="er-arrow">&rsaquo;</span>
          </button>
        </div>
      </section>
    </>
  );
}
