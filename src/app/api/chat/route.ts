import { NextResponse } from "next/server";

type ChatMessage = { from: "bot" | "user"; text: string };
type Mode = "reply" | "summary";

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

  const baseSystem = `너는 트랙시(Tracksy)라는 러닝 기록 앱의 친근한 AI 챗봇이야. 친한 러닝 친구처럼 가볍게 대화해.

[언어 규칙 — 가장 중요]
- 출력은 오직 한국어 한글만. 자연스러운 반말.
- 영어 알파벳, 라틴 확장(악센트 글자, IPA 음성 기호 등), 키릴, 그리스, 한자, 일본 가나, 아랍, 히브리 등 한글 외 모든 문자 절대 금지.
- 외래어를 쓸 거면 한글로만 ("페이스" O / "pace" X).
- 코드 토큰이나 플레이스홀더 (퍼센트 s, 중괄호 0 등) 절대 금지.
- 다정하고 가볍게. 기계적/번역체/존댓말 금지.
- 한 답변은 짧게: 1~3문장. 보통은 1~2문장.
- 이모지는 거의 안 써 (0개가 기본, 4번 중 1번 정도만 1개).

[문법 규칙 — 매우 중요]
- 모든 문장은 문법적으로 완전해야 해. 주어/명사 없이 조사로 시작하지 마.
- 예: "거리는 얼마나 됐어?" / "오늘 페이스는 어땠어?"`;

  let systemPrompt = "";
  let userPrompt = "";
  let maxTokens = 220;
  let temperature = 0.85;

  if (mode === "summary") {
    const stats = extractRunStats(userUtterances);
    const statsLine = describeStats(stats);

    const toneGuides: Record<RunStats["effortLevel"], string> = {
      great: "객관적으로 정말 잘 뛴 기록이야 (페이스가 빠르거나, 거리가 충분히 길거나).\n2줄차는 진심 어린 칭찬·감탄. 예: 오늘 폼 진짜 살아있었네 / 이 페이스면 진짜 대단한 거야.\n수고했어 같은 무난한 멘트 X. 실제로 잘한 점을 짚어줘.",
      good: "평균 이상의 좋은 러닝이었어. 꾸준함과 결과 둘 다 칭찬할 만함.\n2줄차는 잔잔한 칭찬. 예: 오늘 페이스 안정적이었어 / 이 정도면 진짜 잘 뛴 거야.",
      ok: "보통 수준의 러닝. 잘했다고 띄우기보다는 꾸준함 자체를 인정해주는 톤.\n2줄차는 담담한 응원. 예: 오늘도 한 발 더 디뎠네 / 이렇게 꾸준히 가는 게 결국 실력이야.\n컨디션 좋았네 같은 과한 칭찬은 금지.",
      tough: "짧거나 힘들었던 러닝. 사용자가 지치거나 만족 못 했을 가능성.\n2줄차는 위로/격려. 예: 힘든 날에도 일단 신발 신은 너가 멋져 / 오늘은 이 정도면 충분해, 내일 더 가볍게 뛰자.\n절대 금지: 컨디션 좋았네, 최고였어 같은 과장된 칭찬.",
    };

    systemPrompt = `${baseSystem}

[지금 할 일]
러너와 나눈 대화를 보고, 오늘의 러닝을 두 줄로 정리해줘.

[형식 — 두 줄 구성]
1줄차: 러너가 실제로 한 일 (장소·거리·시간·날씨 중 사실 기반, 사용자가 말한 내용에서 가져와)
2줄차: 그 기록 수준에 맞는 응원/칭찬/위로 한마디 (톤 가이드 참고)
- 줄바꿈은 <br/>로 표시
- 두 줄 합쳐서 25~45자 정도
- 끝에 톤에 어울리는 이모지 1개
- 라벨/따옴표/설명 없이 결과 텍스트만
- 문법적으로 완전한 문장이어야 해

[톤 가이드 — 오늘은 이렇게]
${toneGuides[stats.effortLevel]}

[2줄차에서 절대 쓰지 말 것]
- 오늘 컨디션 좋았네 (분석 없이 자동 칭찬)
- 오늘도 수고했어 (러너 얘기 무시한 일반 멘트)
- 꾸준함이 최고의 재능 (구체성 없음)

[좋은 예시 — 결과 수준별]
잘 뛴 날 (5km, 25분, 페이스 5분/km):
한강에서 5km를 25분만에<br/>이 페이스 진짜 무시 못해 💪
보통 날 (3km, 25분, 페이스 8분/km):
오늘은 천천히 3km<br/>이런 날도 결국 다 쌓이는 거야 🌿
힘든 날 (2km만 뛰고 그만, 사용자 힘들었어):
오늘은 2km로 짧게<br/>그래도 신발 신은 너가 멋져 🌙
비 오는 중 무리해서 뛴 날:
비 오는데도 3km<br/>그 의지 자체가 멋있어 🌧️`;

    userPrompt = `[러너가 한 말]
${userUtterances.map((u, i) => `${i + 1}. ${u}`).join("\n") || "(없음)"}

[전체 대화]
${transcript}

[추출된 객관 데이터]
${statsLine}

위 데이터의 종합 평가에 맞는 톤으로, 두 줄 요약을 만들어.
1줄차는 사용자가 실제로 말한 내용(장소·거리·시간 등) 중에서 가져와 사실대로.
2줄차는 톤 가이드대로. 무조건 컨디션 좋았네 같은 자동 칭찬 금지.
결과 텍스트만 출력. 한글 외 글자 절대 금지.`;
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
    const lastUser = userUtterances[userUtterances.length - 1] ?? "";

    systemPrompt = `${baseSystem}

[지금 할 일]
러너와 카톡으로 수다 떨듯이 자연스럽게 대화 중이야. 너의 다음 한 마디를 만들어.

[필수 — 매 답변은 리액션부터 시작]
사용자가 방금 한 말에 자연스럽게 반응하는 한 마디로 시작해. 그다음 (필요하면) 가벼운 의견이나 새 질문을 붙여.
- 사용자: 별이 예뻤어 → 와 그 순간 좋았겠다. 음악 같이 들었어?
- 사용자: 한강 → 아 한강 좋지. 페이스는 어땠어?
- 사용자: 힘들었어 → 오늘 좀 힘드셨구나. 다리는 괜찮아?
- 사용자: 혼자 → 혼자 달리는 맛도 있지. 다음엔 뭐 해보고 싶어?

리액션 단어 풀 (자유롭게 변형):
와 / 오 / 아 / 오 진짜? / 헐 / 대박 / 와 진짜? / 음 그렇구나 / 아 그래? / 오 좋네 / 그랬구나 / 운치있네 / 재밌네 / 그 기분 알지 / 괜찮았어? / 오 멋지다

[가장 중요한 원칙 — 메아리(echo) 금지]
사용자가 방금 말한 정보를 그대로 다시 따라 말하지 마.
- ❌ 러너 3km → 3km나 뛰었구나 (정보 반복)
- ❌ 러너 한강 → 한강에서 뛰었구나 (정보 반복)
- ✅ 러너 3km → 오 좋네. 어디서?
- ✅ 러너 한강 → 한강 좋지. 페이스 어땠어?

[추측·예측·단정 질문 금지]
사용자가 말 안 한 정보를 미리 단정해서 묻지 마. 부정 의문 금지.
- ❌ 오늘은 비도 오지 않았어? (사용자가 비 얘기 안 했는데 단정)
- ❌ 혼자 갔지? (단정)
- ❌ 아침에 뛴 거야? (사용자가 시간 얘기 안 했을 때 단정)
- ✅ 오늘 날씨는 어땠어?
- ✅ 혼자 뛴 거야 아니면 같이?
- ✅ 오늘 언제 뛰었어?

[응답 패턴 — 매번 똑같이 하지 마, 다양하게 섞어]
1) 짧은 리액션 + 다음 질문   (예: 와 좋네. 어디서?)
2) 너의 의견/맞장구 + 질문    (예: 한강 코스 진짜 좋지. 페이스 어땠어?)
3) 공감 + 짧은 follow-up      (예: 그 기분 알지. 다리는 괜찮아?)
4) 가끔은 칭찬·감탄만         (예: 와, 비 오는데도 대단하다.)  ← 이건 어쩌다 한 번

[가이드]
- 매 답변마다 칭찬을 끼얹지 마. 진짜 칭찬할 만한 일에만 자연스럽게.
- 사용자가 힘들었다고 하면 무리해서 칭찬하지 말고 공감/위로 위주로.
- 같은 토픽(거리/페이스/장소 등)을 두 번 묻지 마.
- 기계 톤(정말 대단해요 같은) 절대 금지. 친구 톤만.
- 라벨/따옴표 금지. 한 마디만.`;

    userPrompt = `[지금까지 대화]
${transcript}

[러너의 마지막 말]
${lastUser}

[이미 네가 한 말 — 절대 또 하지 말 것]
${forbiddenList}

[다음에 풀어갈 화제]
${focusTopic.desc}
이 화제를 다음처럼 물을 수 있어 (베끼지 말고 자연스럽게 변형해서):
- ${focusTopic.examples.join("\n- ")}

규칙:
- 반드시 짧은 리액션으로 시작 (와, 오, 아, 헐 등).
- 사용자가 말 안 한 정보를 단정해서 묻지 마.
- 러너 마지막 말의 정보(숫자/장소 등)를 따라 말하지 마.
- 1~2문장이 기본. 길어도 3문장.
- 한국어 한글만. 영어/한자/아랍/IPA/플레이스홀더 절대 금지.
- 한 마디만 출력. 라벨·따옴표 금지.`;
    maxTokens = 180;
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

    if (containsNonKoreanLetter(cleaned)) {
      console.warn(`[chat:${mode}] response had non-Korean letters, falling back. raw="${raw}"`);
      return NextResponse.json(
        mode === "summary"
          ? { summary: pickFallbackSummary(messages), error: "non-korean" }
          : { reply: pickFallbackReply(botUtterances), error: "non-korean" },
        { status: 200 },
      );
    }

    if (isTooShort(cleaned)) {
      console.warn(`[chat:${mode}] response too short after sanitize. raw="${raw}"`);
      return NextResponse.json(
        mode === "summary"
          ? { summary: pickFallbackSummary(messages), error: "too-short" }
          : { reply: pickFallbackReply(botUtterances), error: "too-short" },
        { status: 200 },
      );
    }

    if (mode === "reply" && hasOrphanParticleSentence(cleaned)) {
      console.warn(`[chat:reply] response started a sentence with a particle. raw="${raw}"`);
      return NextResponse.json({ reply: pickFallbackReply(botUtterances), error: "broken-grammar" });
    }

    if (mode === "reply" && isEchoOfUser(cleaned, userUtterances)) {
      console.warn(`[chat:reply] response echoed user's last message. raw="${raw}"`);
      return NextResponse.json({ reply: pickFallbackReply(botUtterances), error: "echo" });
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

/**
 * 모델 응답에서 한글 외 모든 letter + placeholder 토큰을 제거.
 * IPA, 아랍, 한자, 일본 가나 등 비-한글 letter를 일괄 차단.
 */
function sanitize(raw: string): string {
  let s = String(raw).trim();
  if (!s) return "";

  // 라벨 prefix 제거
  s = s.replace(/^(?:한 ?줄 ?요약|요약|코치|답변)\s*[:：]\s*/i, "");

  // 양 끝 직선 따옴표 제거
  if (/^["'].*["']$/.test(s)) {
    s = s.replace(/^["']+|["']+$/g, "");
  }

  // <br/> 태그를 sentinel로 보존
  const SENTINEL = "줄바꿈자리표시자";
  s = s.replace(/<br\s*\/?>/gi, SENTINEL);

  // placeholder/포맷 토큰 제거 (예: %s, %d, {0}, {name}, <foo>)
  s = s.replace(/%[a-zA-Z]/g, "");
  s = s.replace(/\{[a-zA-Z0-9_]*\}/g, "");
  s = s.replace(/<[a-zA-Z][^>]*>/g, "");

  // 모든 Letter 중 한글이 아닌 것은 모두 제거 (IPA, 라틴, 아랍 등 일괄 차단)
  s = s.replace(/\p{L}/gu, (ch) => (/\p{Script=Hangul}/u.test(ch) ? ch : ""));

  // sentinel 복원
  s = s.replace(new RegExp(SENTINEL, "g"), "<br/>");

  // 공백 정리
  s = s.replace(/\s+([,.!?…])/g, "$1");
  s = s.replace(/\s{2,}/g, " ").trim();

  return s;
}

/** sanitize 후에도 한글이 아닌 letter가 남아있는지 (이중 안전망) */
function containsNonKoreanLetter(s: string): boolean {
  const stripped = s.replace(/<br\s*\/?>/gi, " ");
  for (const ch of stripped) {
    if (/\p{L}/u.test(ch) && !/\p{Script=Hangul}/u.test(ch)) return true;
  }
  return false;
}

/** sanitize 후 한글 글자 수가 너무 적으면 (잡문자 응답) */
function isTooShort(s: string): boolean {
  const koreanChars = s.replace(/<br\s*\/?>/gi, " ").match(/\p{Script=Hangul}/gu);
  return !koreanChars || koreanChars.length < 2;
}

/** 조사로 문장 시작했는지 검사 */
function hasOrphanParticleSentence(s: string): boolean {
  if (!s) return false;
  const parts = s
    .replace(/<br\s*\/?>/gi, ".")
    .split(/(?<=[.!?。…])\s+|\.\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  const orphanRe = /^(?:는|은|을|를|이|가|과|와|도|만|에|의|로|으로)(?:\s|$)/;
  return parts.some((p) => orphanRe.test(p));
}

/** 사용자 마지막 발언을 봇이 그대로 따라 말했는지 (echo) */
function isEchoOfUser(botReply: string, userUtterances: string[]): boolean {
  const last = userUtterances[userUtterances.length - 1];
  if (!last) return false;
  const u = last.trim();
  if (!u) return false;

  const numUnit = u.match(/(\d+(?:\.\d+)?)\s*(km|키로|킬로|분|시간)/i);
  if (numUnit) {
    const num = numUnit[1];
    const unit = numUnit[2];
    const re = new RegExp(`${num}\\s*${unit}`, "i");
    if (re.test(botReply)) return true;
  }

  const trimmed = u.replace(/[\s.!?…]/g, "");
  if (trimmed.length >= 2 && trimmed.length <= 6) {
    if (botReply.includes(trimmed)) return true;
  }

  return false;
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

type RunStats = {
  distanceKm?: number;
  timeMinutes?: number;
  paceMinPerKm?: number;
  mood?: "good" | "ok" | "bad";
  hadComplaint?: boolean;
  effortLevel: "great" | "good" | "ok" | "tough";
};

function extractRunStats(userUtterances: string[]): RunStats {
  const text = userUtterances.join(" ");

  let distanceKm: number | undefined;
  const distMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:km|키로|킬로|키로미터|킬로미터)/i);
  if (distMatch) distanceKm = parseFloat(distMatch[1]);

  let timeMinutes: number | undefined;
  const hmMatch = text.match(/(\d+)\s*시간\s*(\d+)\s*분/);
  const hMatch = text.match(/(\d+)\s*시간/);
  const mMatch = text.match(/(\d+)\s*분/);
  if (hmMatch) {
    timeMinutes = parseInt(hmMatch[1], 10) * 60 + parseInt(hmMatch[2], 10);
  } else if (hMatch && /시간/.test(text)) {
    timeMinutes = parseInt(hMatch[1], 10) * 60;
  } else if (mMatch) {
    timeMinutes = parseInt(mMatch[1], 10);
  }

  let paceMinPerKm: number | undefined;
  if (distanceKm && timeMinutes && distanceKm > 0) {
    paceMinPerKm = timeMinutes / distanceKm;
  }

  let mood: RunStats["mood"];
  if (/좋아|좋았|굿|최고|개운|상쾌|컨디션\s*좋/.test(text)) mood = "good";
  else if (/그냥그래|보통|그저그|쏘쏘/.test(text)) mood = "ok";
  else if (/힘들|지침|피곤|버거|무리|안좋|별로|못뛰|헐떡/.test(text)) mood = "bad";

  const hadComplaint = /힘들|아파|아프|다리|무릎|숨|지침|피곤|무리|버거/.test(text);

  let effortLevel: RunStats["effortLevel"] = "ok";

  if (paceMinPerKm !== undefined) {
    if (paceMinPerKm <= 5.5) effortLevel = "great";
    else if (paceMinPerKm <= 6.5) effortLevel = "good";
    else if (paceMinPerKm <= 8) effortLevel = "ok";
    else effortLevel = "tough";
  } else if (distanceKm !== undefined) {
    if (distanceKm >= 10) effortLevel = "great";
    else if (distanceKm >= 5) effortLevel = "good";
    else if (distanceKm >= 3) effortLevel = "ok";
    else effortLevel = "tough";
  }

  if (mood === "bad" || hadComplaint) {
    if (effortLevel === "great") effortLevel = "good";
    else if (effortLevel === "good") effortLevel = "ok";
    else effortLevel = "tough";
  }
  if (mood === "good" && effortLevel === "ok") {
    effortLevel = "good";
  }

  return { distanceKm, timeMinutes, paceMinPerKm, mood, hadComplaint, effortLevel };
}

function describeStats(s: RunStats): string {
  const parts: string[] = [];
  if (s.distanceKm !== undefined) parts.push(`거리: ${s.distanceKm}km`);
  if (s.timeMinutes !== undefined) parts.push(`시간: ${s.timeMinutes}분`);
  if (s.paceMinPerKm !== undefined)
    parts.push(`페이스: 약 ${s.paceMinPerKm.toFixed(1)}분/km`);
  if (s.mood) parts.push(`사용자 기분: ${s.mood}`);
  if (s.hadComplaint) parts.push(`힘들어함: 예`);
  parts.push(`종합 평가: ${s.effortLevel}`);
  return parts.join(" / ");
}

const FALLBACK_REPLIES = [
  "오 좋네. 어디서 뛰었어?",
  "와 잘했네. 거리는 얼마나 됐어?",
  "오 그랬구나. 페이스는 어땠어?",
  "오늘 날씨는 어땠어?",
  "혼자 뛴 거야 아니면 같이?",
  "와 멋지다. 뭐 들으면서 뛰었어?",
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

const FALLBACK_SUMMARIES_BY_TONE: Record<RunStats["effortLevel"], string[]> = {
  great: [
    "오늘 진짜 잘 달렸네<br/>이 페이스면 진짜 대단해 💪",
    "오늘의 러닝, 폼이 살아있었어<br/>이 컨디션 계속 가자 🔥",
  ],
  good: [
    "오늘도 안정적으로 한 바퀴<br/>이 정도면 진짜 잘한 거야 🌟",
    "꾸준한 페이스로 잘 마쳤네<br/>오늘 너 충분히 멋졌어 💜",
  ],
  ok: [
    "오늘은 가볍게 한 걸음 더<br/>이렇게 쌓이는 게 결국 실력이야 🌿",
    "무리 없이 마친 오늘<br/>이런 날도 분명 도움이 돼 🌤️",
  ],
  tough: [
    "쉽지 않은 날에도 일단 뛴 너<br/>그게 제일 멋져 🌙",
    "오늘은 짧게, 그래도 충분해<br/>내일 더 가볍게 뛰어보자 🌧️",
  ],
};

function pickFallbackSummary(messages: ChatMessage[]): string {
  const userTexts = messages.filter((m) => m.from === "user").map((m) => m.text);
  const stats = extractRunStats(userTexts);
  const pool = FALLBACK_SUMMARIES_BY_TONE[stats.effortLevel];
  const seed =
    messages.reduce((s, m) => s + m.text.length, 0) + new Date().getMinutes();
  return pool[seed % pool.length];
}
