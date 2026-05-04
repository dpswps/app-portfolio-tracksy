"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavKey = "home" | "studio" | "record" | "community" | "archive";

const HOME_GROUP = ["/profile", "/settings", "/partners", "/inquiry", "/feedback"];
const COMMUNITY_GROUP = ["/community"];
const ARCHIVE_GROUP = ["/archive"];

function activeKey(pathname: string): NavKey | null {
  if (pathname === "/home") return "home";
  if (pathname === "/studio" || pathname.startsWith("/studio/")) return "studio";
  if (pathname === "/record") return "record";
  if (HOME_GROUP.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "home";
  if (COMMUNITY_GROUP.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "community";
  if (ARCHIVE_GROUP.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "archive";
  return null;
}

export default function BottomNav() {
  const pathname = usePathname();
  const active = activeKey(pathname);

  return (
    <nav className="bottom-nav" id="bottomNav">
      <Link href="/home" className={`nav-item${active === "home" ? " active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V11z" />
        </svg>
        <span>홈</span>
      </Link>
      <Link href="/studio" className={`nav-item${active === "studio" ? " active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="11" r="2" />
          <path d="M3 17l5-4 4 3 5-5 4 4" />
        </svg>
        <span>스튜디오</span>
      </Link>
      <div className={`nav-item nav-fab${active === "record" ? " active" : ""}`}>
        <span className="fab">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M13 4l3 3-7 7-3 1 1-3 6-8z" />
            <path d="M14 5l2 2" />
          </svg>
        </span>
        <span>기록</span>
      </div>
      <Link href="/community" className={`nav-item${active === "community" ? " active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="9" r="3" />
          <circle cx="17" cy="10" r="2.5" />
          <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
          <path d="M14 19c0-2 2-4 4-4s4 1.5 4 4" />
        </svg>
        <span>커뮤니티</span>
      </Link>
      <Link href="/archive" className={`nav-item${active === "archive" ? " active" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 7h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          <path d="M3 7l2-3h14l2 3" />
          <path d="M9 12h6" />
        </svg>
        <span>보관함</span>
      </Link>
    </nav>
  );
}
