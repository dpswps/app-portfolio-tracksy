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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * 캡쳐 직전에 카드 안의 외부 이미지(Storage URL 등 다른 origin) 를 fetch → data URL 로
 * 치환한다. 이렇게 안 하면 html-to-image 가 canvas 에 그리려 할 때 cross-origin 이라
 * tainted 상태가 되어 배경이 빠진 채로 캡쳐되는 버그가 있음 (Supabase Storage URL 등).
 *
 * 반환: 캡쳐 끝나고 호출하면 원본 src/background-image 로 복원하는 함수.
 */
async function inlineExternalImages(el: HTMLElement): Promise<() => void> {
  const restorations: Array<() => void> = [];
  const isInlineable = (url: string) =>
    url.startsWith("http://") || url.startsWith("https://");

  // 1) <img> 태그.
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") ?? "";
      if (!src || !isInlineable(src)) return;
      try {
        const res = await fetch(src, { mode: "cors", cache: "force-cache" });
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await blobToDataUrl(blob);
        const original = src;
        img.setAttribute("src", dataUrl);
        // img.crossOrigin 도 명시 — html-to-image 내부의 cloneNode 경로에서
        // 안전하게 그릴 수 있게.
        img.setAttribute("crossorigin", "anonymous");
        restorations.push(() => img.setAttribute("src", original));
      } catch {
        // 실패하면 그대로 둠 (적어도 이미지는 안 나오지만 다른 요소는 그려짐).
      }
    }),
  );

  // 2) background-image: url(...) — RunningCard 의 .rc-photo 등이 여기 해당.
  const all = Array.from(el.querySelectorAll<HTMLElement>("*"));
  // el 자신도 포함.
  all.push(el);
  await Promise.all(
    all.map(async (node) => {
      const computed = window.getComputedStyle(node).backgroundImage;
      // 여러 background-image 가능. 첫 url() 하나만 처리해도 보통 충분.
      const match = computed.match(/url\(["']?([^"')]+)["']?\)/);
      if (!match) return;
      const url = match[1];
      if (!url || !isInlineable(url)) return;
      try {
        const res = await fetch(url, { mode: "cors", cache: "force-cache" });
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await blobToDataUrl(blob);
        const original = node.style.backgroundImage;
        // computed style 의 background-image 를 inline 으로 덮어쓰면 우선순위 최상.
        node.style.backgroundImage = computed.replace(url, dataUrl);
        restorations.push(() => {
          if (original) node.style.backgroundImage = original;
          else node.style.removeProperty("background-image");
        });
      } catch {
        // 실패하면 그대로.
      }
    }),
  );

  return () => restorations.forEach((fn) => fn());
}

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

  // 외부 이미지(Storage URL 등) 를 data URL 로 인라인 처리. 캡쳐 후 원복.
  const restore = await inlineExternalImages(el);

  let blob: Blob | null;
  try {
    blob = await htmlToImage.toBlob(el, {
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: "",
      backgroundColor: undefined,
    });
  } finally {
    restore();
  }
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
