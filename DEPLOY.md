# Tracksy 배포 가이드

## 환경 변수 (Vercel Project Settings → Environment Variables)

```
GROQ_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://fnhzahqkibtzjcixesyf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sb_publishable_... 또는 anon JWT>
SUPABASE_SERVICE_ROLE_KEY=<service_role JWT>
```

- 3가지 환경(Preview / Production / Development) 모두에 추가.
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 브라우저로 노출되면 안 됨. `NEXT_PUBLIC_` 접두사 절대 붙이지 말 것.

## GitHub 연결

`Vercel user not found (dpswps)` 문제 — 이전에 사용하던 GitHub 계정이 Vercel에 미연결 상태.

해결 방법 (둘 중 하나):

1. **기존 GitHub 계정 → Vercel 연결**
   - Vercel 대시보드 → Settings → Login Connections → Connect GitHub
   - 이미 다른 GitHub 계정으로 로그인 중이면 그 계정에 권한 추가

2. **새 Vercel 프로젝트 만들기 (간단)**
   - https://vercel.com/new 접속
   - "Import Git Repository" → 현재 repo가 push되어 있는 GitHub repo 선택
   - 환경변수 입력
   - Deploy

## Supabase Auth Redirect URL 설정

배포 후 Supabase 대시보드 → Auth → URL Configuration 에서:
- **Site URL**: `https://<your-vercel-domain>.vercel.app` (또는 커스텀 도메인)
- **Redirect URLs**:
  - `https://<your-vercel-domain>.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (개발)

## OAuth Provider 활성화 (선택)

카카오/구글 로그인 사용하려면:
- Supabase 대시보드 → Authentication → Providers
- Google: OAuth Client ID/Secret 입력 (Google Cloud Console에서 발급)
- Kakao: REST API Key + Redirect URI (Kakao Developers에서 발급)

## 배포 후 확인 사항

- [ ] `/api/chat-debug` 가 200을 반환하고 Groq API key 정상
- [ ] 이메일+비밀번호로 신규 가입 가능
- [ ] 로그인 후 /home 진입
- [ ] 새로고침해도 세션 유지
- [ ] 러닝 기록 추가 → DB에 저장 → 다른 브라우저로 로그인해도 보임

## 모니터링·분석 통합 (선택)

### Sentry (에러 트래킹) — 무료 5,000건/월
```
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
DSN을 `NEXT_PUBLIC_SENTRY_DSN` 환경변수로.

### Vercel Analytics (트래픽) — 무료 2,500 PV/월
```
npm install @vercel/analytics
```
`app/layout.tsx` 에서:
```tsx
import { Analytics } from "@vercel/analytics/react";
// body 안에 <Analytics /> 추가
```

### Web Push (푸시 알림)

VAPID 키 생성:
```
npx web-push generate-vapid-keys
```
출력된 두 키를 환경변수로:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (클라이언트)
- `VAPID_PRIVATE_KEY` (서버, 발송용)

알림 발송 백엔드는 Supabase Edge Function 으로:
```ts
// supabase/functions/send-push/index.ts
import webpush from "web-push";
// service role 키로 push_subscriptions 조회 → webpush.sendNotification 반복
```
