# TRACKSY

오늘의 러닝을, 나만의 이야기로.

러닝 기록을 한곳에 모으고 예쁜 러닝카드로 꾸며 저장/공유할 수 있는 앱의 프로토타입입니다.

## 기술 스택

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 3**
- **Zustand** (전역 상태 관리)
- **next/font/google** — Noto Sans KR

## 실행

```bash
npm install
npm run dev
# 브라우저에서 http://localhost:3000 접속
```

빌드:

```bash
npm run build
npm start
```

기타 스크립트:

- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript strict 체크

## 화면 구성

390×844 모바일 디바이스 프레임 안에 22개 화면이 렌더링됩니다.

- **Splash(`/`)** — 로고, 브랜드명, 슬로건
- **로그인(`/login`)** — Google / 카카오 / 네이버 / Apple 간편 로그인 + 둘러보기
- **정보 입력(`/signup`)** — 이름, 생년월일, 선호 러닝 스타일
- **홈(`/home`)** — 러닝 카드 만들기 CTA, 이번 주/달 통계, 90일 최고 페이스
- **프로필(`/profile`, `/profile/edit`)** — 내 정보 확인/수정
- **설정(`/settings`)** — 파트너 앱 연동, 고객 문의
- **파트너 앱(`/partners`, `/partners/[id]`)** — Nike / Garmin / Coros / Adidas / Health Connect 등 연동
- **이용 문의 / 나의 문의내역(`/inquiry`, `/inquiry/list`, `/inquiry/[id]`)** — 문의 작성·열람
- **개선사항(`/feedback`)** — 서비스 의견 보내기
- **스튜디오(`/studio`, `/studio/export`, `/studio/background`)** — 러닝 카드 편집/공유/배경
- **기록 추가(`/record`)** — 러닝 기록 등록
- **커뮤니티(`/community`, `/community/[id]`, `/community/compose`)** — 피드 / 상세 / 작성
- **보관함(`/archive`)** — 내 기록 / 갤러리 / 스타일 보관소
- **보관함 추가(`/archive/manual`, `/archive/sync`, `/archive/scan`)** — 직접 입력 / 타사앱 연동 / 캡쳐 스캔
- **AI 오늘의 러닝일지(`/archive/ai`)** — 대화형 요약 (intro → chat → loading → result / skip)

## 디렉토리 구조

```
src/
  app/                          # App Router 라우트 (22 화면)
  components/
    chrome/                     # DeviceFrame, BottomNav, StatusBar, ModalPortal
    ui/                         # AppHeader, ToastHost, Mascot
  features/                     # 화면별 컴포넌트
    archive/                    # Calendar, RecordsList, GalleryBody, StyleBody, GallerySheet, ...
    ai-journal/                 # AIHeader 외 (페이지 내 단계별 컴포넌트)
    community/                  # FeedCard
    studio/                     # RunningCard, StudioPanel
  data/                         # 정적 목 데이터 (TS)
  lib/                          # date 헬퍼
  stores/useAppStore.ts         # Zustand 전역 스토어
  types/                        # 공유 타입
public/
  mascot.svg
```
