import { NextResponse } from "next/server";

type ChatMessage = { from: "bot" | "user"; text: string };
type Mode = "reply" | "summary";

// Each topic has both a description AND a few example questions in natural Korean,
// so the model can pick a natural phrasing instead of awkwardly quoting the label.
const TOPICS = [
  {
    key: "distance",
    desc: "오늘 뛴 거리",
    examples: ["오늘 몇 km 뛰었어?", "거리는 어느 정도 됐어?"],
  },
  {
    key: "pace",
    desc: "페이스나 시간",
    examples: ["페이스는 어땠어?", "시간은 얼마나 걸렸어?"],
  },
  {
    key: "place",
    desc: "어디서 뛰었는지 (장소)",
    examples: ["어디서 뛰었어?", "오늘 코스는 어디였어?"],
  },
  {
    key: "weather",
    desc: "오늘 날씨",
    examples: ["오늘 날씨는 어땠어?", "덥지 않았어?"],
  },
  {
    key: "timeOfDay",
    desc: "언제 뛰었는지 (아침/저녁/밤)",
    examples: ["오늘 언제 뛰었어?", "아침에 뛴 거야?"],
  },
  {
    key: "body",
    desc: "몸 상태 (다리, 무릎, 호흡)",
    examples: ["다리는 좀 괜찮아?", "호흡은 편했어?"],
  },
  {
    key: "feelingReason",
    desc: "그렇게 느낀 이유나 인상 깊은 순간",
    examples: ["어떤 점이 그랬어?", "오늘 가장 기억나는 순간이 있어?"],
  },
  {
    key: "music",
    desc: "음악이나 팟캐스트",
    examples: ["뭐 들으면서 뛰었어?", "음악 같이 들었어?"],
  },
  {
    key: "company",
    desc: "혼자 뛰었는지 누구랑 같이 뛰었는지",
    examples: ["혼자 뛰었어 아니면 누구랑?", "오늘은 혼자 뛴 거야?"],
  },
  {
    key: "next",
    desc: "다음 러닝에서 해보고 싶은 것",
    examples: ["다음엔 뭐 해보고 싶어?", "다음 목표는 정해뒀어?"],
  },
] as const;

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

  const baseSystem = `너는 트랙시(Tracksy)라는 러닝 기록 앱의 친근한 AI 챗봇이야.

[말투 규칙]
- 반드시 자연스러운 한국어 반말로만.
- 영어 글자(a-z, A-Z) 절대 금지. 라틴 확장(à, æ, é) 절대 금지. 한자 절대 금지.
- 외래어를 쓸 거면 한글로만 ("페이스" O / "pace" X).
- 다정하고 가볍게. 기계적/번역체/존댓말 금지.
- 사용자 러닝을 자연스럽게 칭찬해줘.
- 한 답변은 2~4문장 안. 이모지는 가끔 (0~1개).

[문법 규칙 — 매우 중요]
- 모든 문장은 문법적으로 완전해야 해. 주어/명사 없이 조사로 시작하지 마.
- ❌ "는 얼마나 뛰었어?" (앞에 명사가 빠짐)
- ❌ "은 어땠어?"
- ✅ "거리는 얼마나 됐어?"
- ✅ "오늘 페이스는 어땠어?"
- 문장 단위로 점검하고 어색한 부분이 있으면 자연스러운 표현으로 바꿔서 출력해.

[자연스러운 예시]
- "오 진짜? 멋지다. 어디서 뛰었어?"
- "와, 그 시간이면 정말 잘 뛴 거야. 다리는 괜찮아?"
- "비 오는데도 뛰었구나. 대단하네."`;

  let systemPrompt = "";
  let userPrompt = "";
  let maxTokens = 220;
  let temperature = 0.85;

  if (mode === "summary") {
    systemPrompt = `${baseSystem}

[지금 할 일]
러너와 나눈 대화를 보고, 오늘의 러닝을 따뜻하게 정리해줘.

[형식 — 두 줄 구성]
1줄차: 러너가 실제로 한 일 (장소, 거리, 날씨 등 사실 기반)
2줄차: 그에 어울리는 응원/감탄/느낌 한마디
- 줄바꿈은 <br/>로 표시
- 두 줄 합쳐서 25~40자 정도
- 끝에 어울리는 이모지 1개
- 라벨/따옴표/설명 없이 결과 텍스트만
- 문법적으로 완전한 문장이어야 해

[좋은 예시]
한강에서 5km 좋게 뛰었으면 → "한강에서 5km<br/>오늘 컨디션 진짜 좋았네 💪"
비 오는데 3km 뛰었으면 → "비 오는데 3km<br/>그 의지가 진짜 멋있어 🌧️"
야간에 혼자 뛰었으면 → "고요한 밤에 혼자<br/>차분하게 잘 달렸어 🌙"
힘들었지만 끝까지 뛰었으면 → "힘들어도 끝까지 달린 너<br/>오늘 진짜 잘했어 🔥"

[금지 예시]
- "오늘도 수고했어!" (러너 얘기 무시)
- "꾸준함이 최고의 재능 💪" (구체적 내용 없음)`;

    userPrompt = `[러너가 한 말]
${userUtterances.map((u, i) => `${i + 1}. ${u}`).join("\n") || "(없음)"}

[전체 대화]
${transcript}

위 대화에서 러너가 실제로 한 일 + 응원/감탄 한마디를 두 줄로 만들어. 결과 텍스트만 출력. 문법 깨진 문장 절대 금지.`;
    maxTokens = 220;
    temperature = 0.85;
  } else {
    const forbiddenList =
      botUtterances.length === 0
        ? "(아직 없음)"
        : botUtterances.map((u, i) => `${i + 1}. ${u}`).join("\n");

    const usedTopics = detectUsedTopics(botUtterances);
    const remainingTopics = TOPICS.filter((t) => !usedTopics.has(t.key));
    const focusTopic = remainingTopics[0] ?? TOPICS[0];

    systemPrompt = `${baseSystem}

[지금 할 일]
러너와 자연스럽게 대화 중이야. 코치(=너)의 다음 한 마디를 만들어.

[형식]
- 2~4문장 안으로 짧게
- 러너의 마지막 말에 대한 가벼운 칭찬이나 공감 한마디 + 새로운 질문 한 개
- 이미 한 질문은 절대 다시 묻지 마
- 라벨/따옴표 금지
- 모든 문장이 문법적으로 완전해야 해 (조사로 문장 시작 금지)

[좋은 흐름 예시]
러너: "5km" → "5km나 뛰었구나. 멋지다. 어디서 뛰었어?"
러너: "한강" → "한강은 진짜 뛰기 좋지. 페이스는 어땠어?"
러너: "좋아" → "오 다행이다. 다리는 좀 괜찮아? 무리 안 갔어?"
러너: "힘들었어" → "힘들었구나. 그래도 끝까지 뛴 거 진짜 대단해. 오늘 몇 km 뛴 거야?"

[부자연스러운 예시 — 절대 금지]
- "는 얼마나 뛰었어?" (조사로 시작, 명사 빠짐)
- "은 어땠어?" (조사로 시작)
- "거리 얼마나 뛰었어?" (조사 빠짐)`;

    userPrompt = `[지금까지 대화]
${transcript}

[이미 코치가 한 말 — 절대 또 하지 말 것]
${forbiddenList}

[이번에 자연스럽게 풀어가야 할 화제]
"${focusTopic.desc}"
참고로 이 화제는 다음과 같이 물을 수 있어 (그대로 베끼지 말고 흐름에 맞게 자연스럽게 변형해서 써):
- ${focusTopic.examples.join("\n- ")}

코치의 다음 한 마디만 출력. 문법적으로 완전한 문장으로. 영어/한자/라틴확장 글자 금지.`;
    maxTokens = 220;
    temperature = 0.95;
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

    if (containsLatinScript(cleaned)) {
      console.warn(`[chat:${mode}] response had non-Korean letters, falling back. raw="${raw}"`);
      return NextResponse.json(
        mode === "summary"
          ? { summary: pickFallbackSummary(messages), error: "non-korean" }
          : { reply: pickFallbackReply(botUtterances), error: "non-korean" },
        { status: 200 },
      );
    }

    if (mode === "reply" && hasOrphanParticleSentence(cleaned)) {
      console.warn(`[chat:reply] response started a sentence with a particle. raw="${raw}"`);
      return NextResponse.json({ reply: pickFallbackReply(botUtterances), error: "broken-grammar" });
    }

    if (mode === "summary") {
      if (cleaned) {
        return NextResponse.json({ summary: cleaned });
      }
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

  const SENTINEL = "BR";
  s = s.replace(/<br\s*\/?>/gi, SENTINEL);
  s = s.replace(/[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}\p{Script=Han}]/gu, "");
  s = s.replace(new RegExp(SENTINEL, "g"), "<br/>");

  s = s.replace(/\s{2,}/g, " ").trim();
  return s;
}

function containsLatinScript(s: string): boolean {
  const stripped = s.replace(/<br\s*\/?>/gi, " ");
  return /\p{Script=Latin}/u.test(stripped);
}

/**
 * Detect "broken grammar" — a sentence that starts with a particle like
 * "는", "은", "을", "를", "이", "가", "과", "와" (which only attach to a noun).
 * Splits the reply into sentences first.
 */
function hasOrphanParticleSentence(s: string): boolean {
  if (!s) return false;
  // Split on sentence-final punctuation OR <br/> tags.
  const parts = s
    .replace(/<br\s*\/?>/gi, ".")
    .split(/(?<=[.!?。…])\s+|\.\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  // Korean particles that should never start a clause/sentence.
  const orphanRe = /^(?:는|은|을|를|이|가|과|와|도|만|에|의|로|으로)(?:\s|$)/;
  return parts.some((p) => orphanRe.test(p));
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
  "오 멋지다. 오늘 어디서 뛰었어?",
  "잘했네. 거리는 얼마나 됐어?",
  "그렇구나. 페이스는 어땠어?",
  "오늘 날씨는 어땠어?",
  "혼자 뛰었어 아니면 같이 뛰었어?",
  "음악 들으면서 뛰었어?",
  "다음엔 뭐 해보고 싶어?",
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
  "오늘도 한 걸음 더<br/>꾸준한 너 진짜 멋져 🌟",
  "달리는 그 순간이<br/>오늘도 빛났어",
  "오늘의 너,<br/>충분히 멋졌어 💜",
  "한 발 한 발이<br/>내일을 만들어 가는 중",
  "달리는 사람,<br/>오늘도 너가 자랑스러워",
  "꾸준함이 최고의 재능<br/>오늘도 정말 잘했어",
  "달림으로 채운 하루<br/>오늘 너 진짜 좋았어 🌈",
];

function pickFallbackSummary(messages: ChatMessage[]): string {
  const seed =
    messages.reduce((s, m) => s + m.text.length, 0) + new Date().getMinutes();
  return FALLBACK_SUMMARIES[seed % FALLBACK_SUMMARIES.length];
}
