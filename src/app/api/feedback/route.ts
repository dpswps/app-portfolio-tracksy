import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { body: text, category, email } = body ?? {};
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "내용을 입력해주세요" }, { status: 400 });
    }
    const sb = await getSupabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    const { error } = await sb.from("feedback").insert({
      user_id: user?.id ?? null,
      email: email ?? user?.email ?? null,
      category: category ?? "etc",
      body: text.trim(),
      user_agent: req.headers.get("user-agent"),
    });
    if (error) {
      // feedback 테이블이 아직 없으면 fail-soft.
      if (process.env.NODE_ENV !== "production") {
        console.warn("[api/feedback]", error.message);
      }
      return NextResponse.json({ ok: false, warn: error.message }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
