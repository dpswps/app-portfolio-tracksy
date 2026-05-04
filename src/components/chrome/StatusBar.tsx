export default function StatusBar({ lightText = false }: { lightText?: boolean }) {
  return (
    <div className="status-bar" id="statusBar" style={lightText ? { color: "#fff" } : undefined}>
      <span className="time">9:41</span>
      <span className="indicators">
        <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
          <rect x="0" y="6" width="3" height="4" rx="0.5" />
          <rect x="4" y="4" width="3" height="6" rx="0.5" />
          <rect x="8" y="2" width="3" height="8" rx="0.5" />
          <rect x="12" y="0" width="3" height="10" rx="0.5" />
        </svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M1 4 a8 8 0 0 1 12 0" />
          <path d="M3 6 a5 5 0 0 1 8 0" />
          <circle cx="7" cy="8.5" r="0.8" fill="currentColor" />
        </svg>
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="0.5" y="0.5" width="18" height="9" rx="2" />
          <rect x="2" y="2" width="15" height="6" rx="1" fill="currentColor" />
          <rect x="19.5" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}
