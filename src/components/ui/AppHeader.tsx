"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  className?: string;
  style?: CSSProperties;
  titleStyle?: CSSProperties;
  backStyle?: CSSProperties;
  fallback?: string;
};

export default function AppHeader({
  title,
  showBack = true,
  rightAction,
  className,
  style,
  titleStyle,
  backStyle,
  fallback = "/home",
}: Props) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <div className={`app-header${className ? " " + className : ""}`} style={style}>
      {showBack && (
        <button className="back-btn" onClick={handleBack} style={backStyle} aria-label="뒤로">
          ‹
        </button>
      )}
      {title && (
        <div className="title" style={titleStyle}>
          {title}
        </div>
      )}
      {rightAction && <div className="right-action">{rightAction}</div>}
    </div>
  );
}
