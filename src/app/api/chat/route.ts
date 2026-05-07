import { NextResponse } from "next/server";

type ChatMessage = { from: "bot" | "user"; text: string };
type Mode = "reply" | "summary";

const TOPICS = [
  { key: "distance", label: "거리 (얼마나 뛰었는지 km 단위로)" },
  { key: "pace", label: "페이스나 시간 (몇 분/km, 총 시간)" },
  { key: "place", label: "장소 (한강, 공원, 트랙, 동네 등)" },
  { key: "weather", label: "날씨 (더위/추위/비/바람 등)" },
  { key: "timeOfDay", label: "시간대 (아침/저녁/새벽/밤)" },
  { key: "body", label: "몸 상태 (다리·무릎·호흡·피로감)" },
  { key: "feelingReason", label: "오늘 기분이 그랬던 이유 / 인상적이었던 순간" },
  { key: "music", label: "음악·팟캐스트 (뭐 들으면서 뛰었는지)" },
  { key: "company", label: "함께 뛴 사람 (혼자/친구/모임)" },
  { key: "next", label: "다음 러닝 계획·목표" },
] as const;

export async function POST(req: Request) {
  let messages: ChatMessage[] = [];
  let mode: Mode = "reply";

  try {
    const body = await req.json();
    if (Array.isArray(body?.messages)) messages = body.messages;
    if (body?.mode === "summary" || body?.mode === "reply") mode = body.mode;
  } catch {
    /* ignore */
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      mode === "summary"
        ? { summary: pickFallbackSummary(messages), error: "no-key" }
        : { reply: pickFallbackReply([]), error: "no-key" },
      { status: 200 },
    );
  }

  const transcript = messages
    .map((m) => (m.from === "bot" ? `코치: ${m.text}` : `러너: ${m.text}`))
    .join("\n");

  const botUtterances = messages.filter((m) => m.from === "bot").map((m) => m.text);
  const userUtterances = messages.filter((m) => m.from === "user").map((m) => m.text);

  const baseSystem = `너는 트랙시(Tracksy) 러닝 앱의 친근한 AI 러닝 코치 "트랙시"야.
러너와 짧고 따뜻한 대화로 오늘의 러닝을 정리해줘.
항상 친근한 반말, 짧고 자연스럽게, 격려와 응원의 톤.`;

  let systemInstruction = "";
  let userPrompt = "";

  if (mode === "summary") {
    systemInstruction = `${baseSystem}

지금은 대화를 마치고 "한 줄 요약"을 만드는 단계야.

# 절대 규칙
- 두 줄 이내, 합쳐서 30자 이내
- 줄바꿈은 <br/>로 표시
- 끝에 어울리는 이모지 1~2개 (러닝/감정/날씨 등 대화 내용에 맞게)
- 따옴표/인사/부연설명/라벨 절대 없이 요약 한 줄만 출력
- **러너가 말한 구체적인 내용**(거리, 장소, 기분 키워드 등)을 반영해서 매번 다르게 표현해
- 일반적인 "오늘도 수고했어" 같은 뻔한 문장 금지

# 좋은 예시 (대화에 따라 다양하게)
- 러너가 한강에서 5km 좋게 뛰었으면: "한강에서 5km<br/>완벽한 하루였어 🌊✨"
- 러너가 비 오는데 뛰었으면: "비 속을 달린<br/>강한 너 🌧️💪"
- 러너가 힘들었다 했으면: "힘들어도 끝까지<br/>달려낸 오늘 🔥"
- 러너가 야간에 뛰었으면: "달빛 아래 한 걸음<br/>오늘도 잘했어 🌙✨"
- 러너가 친구랑 같이 뛰었으면: "함께 달린 즐거움<br/>최고의 하루 🤝💜"

위 예시는 형식 참고용이고, 실제 대화에 맞춰 새로운 표현을 만들어.`;

    userPrompt = `[지금까지 대화]
${transcript}

[러너가 말한 핵심 키워드들]
${userUtterances.join(" / ") || "(없음)"}

위 대화에서 러너의 구체적인 표현·상황을 살려서, 오늘 러닝을 한 줄로 따뜻하게 요약해줘. 똑같은 표현을 쓰지 말고 매번 새롭게 표현해.`;
  } else {
    const forbiddenList =
      botUtterances.length === 0
        ? "(아직 없음)"
        : botUtterances.map((u, i) => `${i + 1}. "${u}"`).join("\n");

    const usedTopics = detectUsedTopics(botUtterances);
    const remainingTopics = TOPICS.filter((t) => !usedTopics.has(t.key));
    const focusTopic = remainingTopics[0] ?? TOPICS[0];

    systemInstruction = `${baseSystem}

지금은 러너와 대화를 이어가는 단계야. 다음에 코치가 할 한 마디만 출력해.

# ⚠️ 절대 규칙
이미 한 질문을 또 묻지 마. 절대 비슷한 표현으로도 묻지 마.
**아래 "이번에 다룰 주제"에만 집중**해서 단 하나의 질문을 만들어.

# 형식
- 1~2문장, 50자 이내
- 구조: 짧은 응원/공감 한마디 + 새로운 질문 한 개
- 라벨("코치:" 같은 거) 없이 발화 내용만 출력
- 따옴표 금지`;

    userPrompt = `[지금까지 대화]
${transcript}

[이미 코치가 한 질문/발화 — 절대 또 하지 말 것]
${forbiddenList}

[이번에 다룰 주제 — 이것만 자연스럽게 물어볼 것]
${focusTopic.label}

이제 코치의 다음 한 마디를 출력해. 위 주제만 다루고, 이미 한 질문/발화는 절대 다시 하지 마.`;
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: mode === "summary" ? 120 : 120,
            topP: 0.95,
            topK: 40,
          },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error(`Gemini ${mode} error:`, upstream.status, t);
      return NextResponse.json(
        mode === "summary"
          ? { summary: pickFallbackSummary(messages), error: "upstream-failed" }
          : { reply: pickFallbackReply(botUtterances), error: "upstream-failed" },
        { status: 200 },
      );
    }

    const data = await upstream.json();
    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      (mode === "summary" ? pickFallbackSummary(messages) : pickFallbackReply(botUtterances));

    const cleaned = String(raw)
      .trim()
      .replace(/^["'“”]+|["'“”]+$/g, "")
      .replace(/^(요약|한 ?줄 ?요약|코치)[:：]\s*/i, "")
      .trim();

    if (mode === "summary") {
      return NextResponse.json({
        summary: cleaned || pickFallbackSummary(messages),
      });
    }

    if (cleaned && !isTooSimilarToPrevious(cleaned, botUtterances)) {
      return NextResponse.json({ reply: cleaned });
    }
    return NextResponse.json({ reply: pickFallbackReply(botUtterances) });
  } catch (err) {
    console.error(`Gemini ${mode} call failed:`, err);
    return NextResponse.json(
      mode === "summary"
        ? { summary: pickFallbackSummary(messages), error: "exception" }
        : { reply: pickFallbackReply(botUtterances), error: "exception" },
      { status: 200 },
    );
  }
}

function detectUsedTopics(botUtterances: string[]): Set<string> {
  const used = new Set<string>();
  const text = botUtterances.join(" ");
  const has = (re: RegExp) => re.test(text);

  if (has(/거리|얼마나|km|킬로|뛰었|뛰었어/)) used.add("distance");
  if (has(/페이스|시간|분|초|얼마나 걸/)) used.add("pace");
  if (has(/어디|장소|한강|공원|트랙|동네|코스/)) used.add("place");
  if (has(/날씨|더|추|바람|비|햇빛|습/)) used.add("weather");
  if (has(/아침|저녁|새벽|밤|언제|시간대/)) used.add("timeOfDay");
  if (has(/컨디션|몸|다리|무릎|호흡|숨|피로/)) used.add("body");
  if (has(/이유|왜|어떤 점|어떤 부분|인상|기억|기분이 좋/)) used.add("feelingReason");
  if (has(/음악|노래|팟캐스트|들었|들으면서/)) used.add("music");
  if (has(/혼자|친구|같이|모임|동행|누구/)) used.add("company");
  if (has(/다음|계획|목표|이번 주|이번주|시도/)) used.add("next");

  return used;
}

function isTooSimilarToPrevious(candidate: string, prev: string[]): boolean {
  const norm = (s: string) => s.replace(/\s+/g, "").replace(/[^\p{L}\p{N}]/gu, "");
  const a = norm(candidate);
  if (!a) return false;
  for (const p of prev) {
    const b = norm(p);
    if (!b) continue;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) {
      const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
      if (ratio > 0.7) return true;
    }
  }
  return false;
}

const FALLBACK_REPLIES = [
  "오! 어디서 뛰었어? 🏞️",
  "거리는 얼마나 뛰었어?",
  "페이스는 어땠어?",
  "오늘 날씨는 어땠어?",
  "혼자 뛰었어 같이 뛰었어?",
  "음악 들으면서 뛰었어? 🎧",
  "다음엔 뭘 시도해보고 싶어? ✨",
];

function pickFallbackReply(prev: string[]): string {
  const norm = (s: string) => s.replace(/\s+/g, "");
  const used = new Set(prev.map(norm));
  for (const f of FALLBACK_REPLIES) {
    if (!used.has(norm(f))) return f;
  }
  return FALLBACK_REPLIES[prev.length % FALLBACK_REPLIES.length];
}

const FALLBACK_SUMMARIES = [
  "오늘도 한 걸음 더<br/>나아간 너 🌟",
  "달리는 그 순간이<br/>가장 빛나 ✨",
  "오늘의 너,<br/>충분히 멋졌어 💜",
  "한 발 한 발이<br/>내일의 너를 만들어 🏃‍♀️",
  "달리는 사람,<br/>오늘도 너야 🔥",
  "꾸준함이 최고의 재능<br/>오늘도 잘했어 💪",
  "달림으로<br/>완성된 하루 🌈",
];

/** Pick a summary fallback that varies based on conversation length / time. */
function pickFallbackSummary(messages: ChatMessage[]): string {
  const seed =
    messages.reduce((s, m) => s + m.text.length, 0) + new Date().getMinutes();
  return FALLBACK_SUMMARIES[seed % FALLBACK_SUMMARIES.length];
}
