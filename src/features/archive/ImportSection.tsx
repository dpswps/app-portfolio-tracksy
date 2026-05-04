import Link from "next/link";

export default function ImportSection() {
  return (
    <div className="import-section">
      <h3>데이터 가져오기</h3>
      <div className="import-grid">
        <Link href="/archive/manual" className="import-tile" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="it-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21l4-1L20 7l-3-3L4 17l-1 4z" />
            </svg>
          </span>
          <span className="it-label">직접 입력하기</span>
        </Link>
        <Link href="/archive/sync" className="import-tile" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="it-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12a8 8 0 0 1 14-5" />
              <path d="M20 12a8 8 0 0 1-14 5" />
              <path d="M18 4v3h-3M6 20v-3h3" />
            </svg>
          </span>
          <span className="it-label">타사앱 연동하기</span>
        </Link>
        <Link href="/archive/scan" className="import-tile" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="it-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="6" width="16" height="14" rx="2" />
              <circle cx="12" cy="13" r="3.5" />
              <path d="M9 6l1.5-2h3L15 6" />
            </svg>
          </span>
          <span className="it-label">캡쳐사진 스캔하기</span>
        </Link>
      </div>
    </div>
  );
}
