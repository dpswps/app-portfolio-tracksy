import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import DeviceFrame from "@/components/chrome/DeviceFrame";
import "./globals.css";

const notoKr = Noto_Sans_KR({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-kr",
});

export const metadata: Metadata = {
  title: "TRACKSY — 오늘의 러닝을, 나만의 이야기로",
  description: "러닝 기록을 한곳에 모으고 예쁜 러닝카드로 꾸며 저장/공유할 수 있는 앱.",
};

/* viewport-fit=cover — iOS safe-area (노치/다이나믹 아일랜드/제스처바)
 * env(safe-area-inset-*) 값이 0 이 아닌 실제 값으로 계산되도록 활성화.
 *
 * maximumScale: 1 + userScalable: false — iOS Safari 에서 input focus 시
 * 자동 확대(viewport zoom-in) 차단. (input font-size 16px+ 와 함께 적용해야
 * 완전히 막힘 — CSS 쪽에서도 input 사이즈 16px 로 유지.) */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoKr.variable}>
      <head>
        {/* Pretendard 가변 폰트 — jsDelivr CDN 에서 비동기 로드.
         * (CSS @import 는 파싱을 블록해서 첫 페이지 로드가 매우 느려지므로
         *  여기 <link> 로 받아서 CSS 와 병렬 다운로드되게 한다.) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body>
        <DeviceFrame>{children}</DeviceFrame>
      </body>
    </html>
  );
}
