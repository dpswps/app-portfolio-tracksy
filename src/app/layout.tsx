import type { Metadata } from "next";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoKr.variable}>
      <body>
        <DeviceFrame>{children}</DeviceFrame>
      </body>
    </html>
  );
}
