"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import BottomNav from "./BottomNav";
import StatusBar from "./StatusBar";
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

  return (
    <div className="device-wrapper">
      <div className={`device${isSplash ? " hide-nav" : ""}`} id="device">
        <StatusBar lightText={isSplash} />
        <main id="screen">{children}</main>
        <ModalPortal />
        {showNav && <BottomNav />}
        <ToastHost />
      </div>
    </div>
  );
}
