import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="login-screen">
      <div className="heading">
        <h2>로그인</h2>
        <p className="sub">로그인 방법을 선택하세요</p>
      </div>
      <div className="social-buttons">
        <Link href="/signup" className="social-btn google">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google 로 계속하기
        </Link>
        <Link href="/signup" className="social-btn kakao">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#391B1B">
            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.86 5.31 4.66 6.71l-1.04 3.81c-.09.34.28.62.58.43L10.7 19.3c.43.04.86.07 1.3.07 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
          </svg>
          카카오톡으로 계속하기
        </Link>
        <Link href="/signup" className="social-btn naver">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
            <path d="M14.4 12.7L9.4 5h-4v14h4.2v-7.7l5 7.7h4V5h-4.2v7.7z" />
          </svg>
          네이버 로 계속하기
        </Link>
        <Link href="/signup" className="social-btn apple">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Apple 로 계속하기
        </Link>
      </div>
      <div className="guest-link">
        <Link href="/home" style={{ cursor: "pointer", color: "inherit", textDecoration: "inherit" }}>
          로그인 없이 둘러보기
        </Link>
      </div>
    </section>
  );
}
