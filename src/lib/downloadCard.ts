"use client";

/**
 * 러닝 카드 DOM 노드를 PNG 로 캡쳐해서 사용자의 휴대폰/PC 에 다운로드한다.
 *
 * 동작 우선순위:
 *  1. 모바일에서 Web Share API + files 사용 가능 → 네이티브 공유시트 열기.
 *     사용자가 "사진에 저장" / "갤러리 저장" 같은 옵션을 직접 선택.
 *  2. 그 외(데스크탑/구형 브라우저) → blob URL 로 직접 다운로드 트리거.
 *     Chrome/Edge: Downloads 폴더, iOS Safari: 파일 앱.
 *
 * @param selector 캡쳐 대상 CSS 셀렉터. 기본은 ".running-card".
 * @param filename 저장될 파일명 (기본 "tracksy-card-<timestamp>.png").
 * @returns "shared" | "downloaded" | "cancelled"
 */
export async function downloadCardAsImage(
  selector = ".running-card",
  filename?: string,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`카드 요소를 찾을 수 없어요 (${selector})`);

  // html-to-image 는 dynamic import 로 첫 다운로드 시점에만 로드 — 초기 번들 절약.
  const htmlToImage = await import("html-to-image");

  const name =
    filename ??
    `tracksy-card-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;

  // 이미지 캡쳐 — 2배 해상도로 선명하게.
  // skipFonts/fontEmbedCSS — cross-origin 스타일시트(예: Google Fonts, Next dev
  // overlay) 의 cssRules 를 읽으려다 SecurityError 가 발생하는 걸 막는다.
  // 폰트는 임베드 없이 그대로 렌더되며, 시스템 fallback 으로 동작하기 충분.
  const blob = await htmlToImage.toBlob(el, {
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: true,
    fontEmbedCSS: "",
    // 카드 자체가 둥근 모서리 + 그림자라 투명 배경이 자연스럽다.
    backgroundColor: undefined,
  });
  if (!blob) throw new Error("카드 캡쳐에 실패했어요");

  // 1) 모바일 — Web Share API + files. 시스템 공유시트에서 "사진에 저장" 선택 가능.
  const file = new File([blob], name, { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
  };
  if (
    typeof navigator !== "undefined" &&
    nav.canShare &&
    nav.canShare({ files: [file] }) &&
    typeof navigator.share === "function"
  ) {
    try {
      await navigator.share({ files: [file], title: "Tracksy 러닝 카드" });
      return "shared";
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우엔 그냥 종료.
      if ((e as { name?: string })?.name === "AbortError") return "cancelled";
      // 그 외 오류는 fallback 으로.
    }
  }

  // 2) Fallback — blob URL 다운로드. 모든 브라우저에서 동작.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return "downloaded";
}
