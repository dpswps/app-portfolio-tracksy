import { NextResponse } from "next/server";

/**
 * GET /api/chat-debug
 *
 * Diagnostic endpoint for the Groq integration. Confirms whether
 * GROQ_API_KEY is set and runs a tiny live call to Groq to verify it works.
 * Never returns the actual key value.
 */
export async function GET() {
  const key = process.env.GROQ_API_KEY;

  if (!key) {
    return NextResponse.json({
      keyPresent: false,
      message:
        "❌ GROQ_API_KEY 환경변수가 안 보여요. .env.local 파일이 프로젝트 루트에 있는지, 변수명이 정확한지 확인하고 dev 서버를 재시작하세요.",
    });
  }

  const result: {
    keyPresent: boolean;
    keyLength: number;
    keyStartsWith: string;
    groqCall?: { ok: boolean; status?: number; error?: string; sample?: string };
    message: string;
  } = {
    keyPresent: true,
    keyLength: key.length,
    keyStartsWith: key.slice(0, 6) + "...",
    message: "키는 보이는데 실제로 Groq 호출이 되는지 시험해볼게요...",
  };

  try {
    const upstream = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "안녕! 한 단어로 인사해줘." }],
          max_tokens: 20,
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!upstream.ok) {
      const t = await upstream.text();
      result.groqCall = { ok: false, status: upstream.status, error: t.slice(0, 500) };
      result.message = `❌ Groq 호출 실패: HTTP ${upstream.status}. error 필드 확인.`;
    } else {
      const data = await upstream.json();
      const sample = data?.choices?.[0]?.message?.content ?? "(빈 응답)";
      result.groqCall = { ok: true, sample: String(sample).slice(0, 100) };
      result.message =
        "✅ Groq이 정상적으로 응답해요! 채팅이 여전히 fallback이면 dev 서버 재시작이 안 된 거예요.";
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    result.groqCall = { ok: false, error: msg };
    result.message = `❌ Groq 호출 중 예외: ${msg}`;
  }

  return NextResponse.json(result);
}
