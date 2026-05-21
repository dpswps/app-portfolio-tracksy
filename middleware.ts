import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Next.js 미들웨어 — Supabase 세션 쿠키를 매 요청마다 refresh. */
export async function middleware(req: NextRequest) {
  return updateSession(req);
}

export const config = {
  matcher: [
    /*
     * 모든 경로에 적용하되 정적/이미지/파비콘 요청은 제외.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
