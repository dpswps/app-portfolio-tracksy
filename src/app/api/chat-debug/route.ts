import { NextResponse } from "next/server";

/**
 * GET /api/chat-debug
 *
 * Diagnostic endpoint — tells you whether GOOGLE_API_KEY is configured,
 * its length (for sanity check), and tries a tiny call to Gemini to
 * verify the key actually works. Visit it in your browser.
 *
 * Never returns the actual key value.
 */
export async function GET() {
  const key = process.env.GOOGLE_API_KEY;

  if (!key) {
    return NextResponse.json({
      keyPresent: false,
      message:
        "❌ GOOGLE_API_KEY 환경변수가 안 보여요. .env.local 파일이 프로젝트 루트에 있는지, 변수명이 정확한지 확인하고 dev 서버를 재시작하세요.",
    });
  }

  const result: {
    keyPresent: boolean;
    keyLength: number;
    keyStartsWith: string;
    geminiCall?: { ok: boolean; status?: number; error?: string; sample?: string };
    message: string;
  } = {
    keyPresent: true,
    keyLength: key.length,
    keyStartsWith: key.slice(0, 6) + "...",
    message: "키는 보이는데 실제로 Gemini 호출이 되는지 시험해볼게요...",
  };

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "안녕! 한 단어로 인사해줘." }] }],
          generationConfig: { maxOutputTokens: 20 },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!upstream.ok) {
      const t = await upstream.text();
      result.geminiCall = { ok: false, status: upstream.status, error: t.slice(0, 500) };
      result.message = `❌ Gemini 호출 실패: HTTP ${upstream.status}. error 필드 확인.`;
    } else {
      const data = await upstream.json();
      const sample = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "(빈 응답)";
      result.geminiCall = { ok: true, sample: String(sample).slice(0, 100) };
      result.message =
        "✅ Gemini가 정상적으로 응답해요! 만약 채팅이 여전히 같은 답만 나오면 dev 서버 재시작이 안 된 거예요.";
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    result.geminiCall = { ok: false, error: msg };
    result.message = `❌ Gemini 호출 중 예외: ${msg}`;
  }

  return NextResponse.json(result);
}
