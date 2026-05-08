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

// Groq is OpenAI-compatible.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

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

  const apiKey = process.env.GROQ_API_KEY;
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

  const baseSystem = `너는 트랙시 러닝 앱의 친근한 AI 러닝 코치야.
짧고 따뜻한 반말, 격려와 응원의 톤.`;

  let systemPrompt = "";
  let userPrompt = "";
  let maxTokens = 200;
  let temperature = 0.85;

  if (mode === "summary") {
    systemPrompt = `${baseSystem}

너의 임무: 러너의 오늘 러닝 대화를 보고, **러너가 실제로 말한 사실을 활용한** 한 줄 요약을 만들어.

# 절차
1단계: 대화에서 사실을 추출 (장소/거리/시간대/날씨/기분/동행 — 러너가 말한 것만)
2단계: 위 사실 1~2개로 한 줄 요약 작성

# 출력 형식
- 두 줄 이내, 합쳐서 30자 내외
- 줄바꿈은 <br/>
- 끝에 어울리는 이모지 1~2개
- 결과 텍스트만 출력 (라벨/설명/따옴표 절대 금지)

# 좋은 예시
러너: 한강, 5km, 좋아 → 한강에서 5km<br/>완벽한 하루였어 🌊✨
러너: 비, 힘들었어 → 비를 뚫고 달린<br/>강한 너 🌧️💪
러너: 야간, 혼자 → 달빛 아래 혼자<br/>묵묵히 달린 밤 🌙
러너: 친구, 10km → 친구와 함께 10km<br/>웃으며 달린 하루 🤝💜

# 나쁜 예시 (금지)
- "오늘도 수고했어!" (대화 무시)
- "달리는 사람, 오늘도 너야 🔥" (구체적 사실 없음)`;

    userPrompt = `[러너가 한 말 — 꼭 활용]
${userUtterances.map((u, i) => `${i + 1}. "${u}"`).join("\n") || "(없음)"}

[전체 대화]
${transcript}

자, 위 키워드를 살려서 한 줄 요약 텍스트만 출력해.`;
    maxTokens = 200;
    temperature = 0.85;
  } else {
    const forbiddenList =
      botUtterances.length === 0
        ? "(아직 없음)"
        : botUtterances.map((u, i) => `${i + 1}. "${u}"`).join("\n");

    const usedTopics = detectUsedTopics(botUtterances);
    const remainingTopics = TOPICS.filter((t) => !usedTopics.has(t.key));
    const focusTopic = remainingTopics[0] ?? TOPICS[0];

    systemPrompt = `${baseSystem}

지금은 러너와 대화 중이야. 코치의 다음 한 마디를 출력해.

⚠️ 절대 규칙:
- 이미 한 질문 또 묻지 마
- 아래 "이번 주제"에만 집중

형식: 1~2문장 50자 이내, 응원/공감 + 새 질문 1개. 라벨/따옴표 금지.`;

    userPrompt = `[지금까지 대화]
${transcript}

[이미 한 발화 — 또 하지 말 것]
${forbiddenList}

[이번 주제]
${focusTopic.label}

코치의 다음 한 마디만 출력.`;
    maxTokens = 150;
    temperature = 1.0;
  }

  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
        top_p: 0.95,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      console.error(`[chat:${mode}] Groq HTTP error:`, upstream.status, t);
      return NextResponse.json(
        mode === "summary"
          ? { summary: pickFallbackSummary(messages), error: `http-${upstream.status}` }
          : { reply: pickFallbackReply(botUtterances), error: `http-${upstream.status}` },
        { status: 200 },
      );
    }

    const data = await upstream.json();
    const choice = data?.choices?.[0];
    const finishReason: string | undefined = choice?.finish_reason;
    const raw: string = choice?.message?.content ?? "";

    console.log(
      `[chat:${mode}] finish=${finishReason} len=${raw.length} preview=${raw.slice(0, 80).replace(/\n/g, "\\n")}`,
    );

    const cleaned = sanitize(raw);

    if (mode === "summary") {
      if (cleaned) {
        return NextResponse.json({ summary: cleaned });
      }
      console.warn(`[chat:summary] empty after clean — finish=${finishReason}, raw="${raw}"`);
      return NextResponse.json({
        summary: pickFallbackSummary(messages),
        error: `empty-${finishReason ?? "unknown"}`,
      });
    }

    if (cleaned && !isTooSimilarToPrevious(cleaned, botUtterances)) {
      return NextResponse.json({ reply: cleaned });
    }
    return NextResponse.json({ reply: pickFallbackReply(botUtterances) });
  } catch (err) {
    console.error(`[chat:${mode}] exception:`, err);
    return NextResponse.json(
      mode === "summary"
        ? { summary: pickFallbackSummary(messages), error: "exception" }
        : { reply: pickFallbackReply(botUtterances), error: "exception" },
      { status: 200 },
    );
  }
}

function sanitize(raw: string): string {
  let s = String(raw).trim();
  if (!s) return "";
  s = s.replace(/^(?:한 ?줄 ?요약|요약|코치|답변)\s*[:：]\s*/i, "");
  if (/^["'“”].*["'“”]$/.test(s)) {
    s = s.replace(/^["'“”]+|["'“”]+$/g, "");
  }
  return s.trim();
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

function pickFallbackSummary(messages: ChatMessage[]): string {
  const seed =
    messages.reduce((s, m) => s + m.text.length, 0) + new Date().getMinutes();
  return FALLBACK_SUMMARIES[seed % FALLBACK_SUMMARIES.length];
}
