"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import BottomNav from "./BottomNav";
import ToastHost from "@/components/ui/ToastHost";
import ModalPortal from "./ModalPortal";
import { useAppStore } from "@/stores/useAppStore";

const HIDE_NAV_PREFIXES = [
  "/login",
  "/signup",
  "/studio",
  "/community/compose/cards",
];

export default function DeviceFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setModal = useAppStore((s) => s.setModal);
  const prevPathRef = useRef(pathname);

  // 라우트가 바뀌면 열려 있던 바텀시트/모달을 자동으로 닫는다.
  // (modal 상태는 zustand store 에 있어서 페이지를 옮겨도 그대로 유지되는데,
  //  바텀시트는 보통 현재 페이지 컨텍스트에만 의미가 있으므로 라우트 변경 시
  //  닫아주는 게 자연스럽다 — 예: 공유 시트가 떠 있는 상태에서 하단 nav 로
  //  보관함/홈 등으로 이동하면 시트는 사라져야 함.)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      setModal(null);
      prevPathRef.current = pathname;
    }
  }, [pathname, setModal]);

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
