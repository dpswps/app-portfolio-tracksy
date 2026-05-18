"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import BottomNav from "./BottomNav";
import ToastHost from "@/components/ui/ToastHost";
import ModalPortal from "./ModalPortal";

const HIDE_NAV_PREFIXES = [
  "/login",
  "/signup",
  "/studio",
  "/community/compose/cards",
];

export default function DeviceFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isSplash = pathname === "/";
  const showNav = useMemo(() => {
    if (isSplash) return false;
    return !HIDE_NAV_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  }, [pathname, isSplash]);

  /* 상단 시간/와이파이/배터리 등 시뮬레이션 status bar 제거.
   * 실제 모바일 기기에서는 시스템 상태바가 그대로 사용되며,
   * 콘텐츠는 .device 의 safe-area-inset-top padding 으로 상단 안전영역을
   * 자동으로 비우게 된다. */
  return (
    <div className="device-wrapper">
      <div className={`device${isSplash ? " hide-nav" : ""}`} id="device">
        <main id="screen">{children}</main>
        <ModalPortal />
        {showNav && <BottomNav />}
        <ToastHost />
      </div>
    </div>
  );
}
