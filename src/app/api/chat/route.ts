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

  // 대화 분리 — fallback 응답도 토픽 인지로 동작하려면 apiKey 체크보다 먼저 계산.
  const transcript = messages
    .map((m) => (m.from === "bot" ? `코치: ${m.text}` : `러너: ${m.text}`))
    .join("\n");

  const botUtterances = messages.filter((m) => m.from === "bot").map((m) => m.text);
  const userUtterances = messages.filter((m) => m.from === "user").map((m) => m.text);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      mode === "summary"
        ? { summary: pickFallbackSummary(messages), error: "no-key" }
        : { reply: pickFallbackReply(botUtterances, userUtterances), error: "no-key" },
      { status: 200 },
    );
  }

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
      great:
        "객관적으로 정말 잘 뛴 기록이야 (페이스가 빠르거나, 거리가 충분히 길거나).\n2줄차는 진심 어린 칭찬·감탄. 다양한 표현으로: 오늘 폼이 살아있었어 / 이 페이스 진짜 무시 못해 / 한 챕터를 끝낸 것 같아 / 너의 베스트가 갱신된 날이네 / 진짜 단단해졌어 / 페이스에 자신감이 묻어나.\n수고했어 같은 무난한 멘트 X.",
      good:
        "평균 이상의 좋은 러닝이었어. 꾸준함과 결과 둘 다 칭찬할 만함.\n2줄차는 잔잔한 칭찬. 다양하게: 페이스가 안정적이었어 / 이 정도면 진짜 잘 한 거야 / 너에게 맞는 리듬 찾았네 / 오늘의 너 충분히 멋졌어 / 흐트러짐 없이 잘 갔어.",
      ok:
        "보통 수준의 러닝. 잘했다고 띄우기보다는 꾸준함 자체를 인정해주는 톤.\n2줄차는 담담한 응원. 다양하게: 한 발 더 디뎠네 / 꾸준히 가는 게 결국 실력이야 / 오늘도 빠뜨리지 않은 게 멋져 / 이런 날이 쌓여서 너를 만들어 / 무리 없이 잘 마쳤네.\n컨디션 좋았네 같은 과한 칭찬은 금지.",
      tough:
        "짧거나 힘들었던 러닝. 사용자가 지치거나 만족 못 했을 가능성.\n2줄차는 위로/격려. 다양하게: 일단 신발 신은 게 어려운데 그걸 해냈어 / 오늘은 이 정도면 충분해 / 짧아도 너의 의지가 보였어 / 이런 날도 분명 도움이 돼 / 내일은 더 가볍게 뛰어보자 / 오늘은 쉬는 것도 훈련이야.\n절대 금지: 컨디션 좋았네, 최고였어 같은 과장된 칭찬.",
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
- "신발 신은 너가 멋져" — 이 표현은 너무 자주 등장하니까 다른 위로 표현 사용

[다양성 — 가장 중요]
아래 예시들은 톤만 참고용. 표현·문장 구조·이모지 모두 베끼지 마.
매번 다른 어휘·다른 비유·다른 이모지로. 같은 사용자라도 매번 다르게 표현해.
1줄차의 어순도 다양하게: 거리·장소 → 시간 / 시간 → 거리 / 장소만 강조 / 페이스만 강조 등.

[좋은 예시 풀 — 톤만 참고, 그대로 베끼지 마]
잘 뛴 날 (5km, 25분, 페이스 5분/km):
  한강에서 5km를 25분만에<br/>이 페이스 진짜 무시 못해 💪
  25분간 5km 깔끔하게<br/>너의 베스트가 갱신된 날 🔥
  새벽 5km, 평균 5분 페이스<br/>오늘 폼이 살아있었어 ✨
  5km를 단숨에<br/>한 챕터를 끝낸 기분이지 🚀

보통 날 (3km, 25분, 페이스 8분/km):
  오늘은 천천히 3km<br/>이런 날도 결국 다 쌓이는 거야 🌿
  3km, 무리 없이 마무리<br/>꾸준히 가는 게 결국 실력이야 🌤️
  한강 3km 산책 같은 러닝<br/>오늘도 빠뜨리지 않은 게 멋져 🍀
  3km를 가볍게<br/>너에게 맞는 리듬 찾았네 🌙

힘든 날 (2km만 뛰고 그만, 사용자 힘들었어):
  오늘은 2km로 짧게<br/>이 정도면 충분해, 내일 더 가볍게 가자 🌙
  2km 살짝 뛰고 마무리<br/>짧아도 너의 의지가 보였어 ☁️
  2km로 끝낸 오늘<br/>이런 날도 분명 도움이 돼 🌧️
  무리 안 하고 2km<br/>쉬는 것도 훈련이야 🌿

비 오는 중 무리해서 뛴 날:
  비 오는데도 3km<br/>그 의지 자체가 멋있어 🌧️
  궂은 날씨에도 3km 완주<br/>오늘 너 진짜 단단했어 ⛅

[필수 — 매번 새 표현 만들기]
- 위 예시 중 어느 것도 표현 그대로 가져오지 마. 톤만 참고.
- 이모지도 같은 걸 반복 사용하지 말고 매번 새로 골라.`;

    userPrompt = `[러너가 한 말]
${userUtterances.map((u, i) => `${i + 1}. ${u}`).join("\n") || "(없음)"}

[전체 대화]
${transcript}

[추출된 객관 데이터]
${statsLine}

[필수 — 매번 다르게]
위 [좋은 예시 풀]에 있는 표현은 어느 것도 그대로 쓰지 마.
이전에 봤을 법한 흔한 표현("신발 신은 너가 멋져", "수고했어", "컨디션 좋았네" 등)도 금지.
어휘·문장구조·이모지 모두 새로 만들어. 1줄차 어순도 다양하게 (거리→장소, 시간→거리, 장소만 강조 등).

위 데이터의 종합 평가에 맞는 톤으로, 두 줄 요약을 만들어.
1줄차는 사용자가 실제로 말한 내용(장소·거리·시간 등) 중에서 가져와 사실대로.
2줄차는 톤 가이드대로. 무조건 컨디션 좋았네 같은 자동 칭찬 금지.
결과 텍스트만 출력. 한글 외 글자 절대 금지.`;
    maxTokens = 240;
    // 다양성을 위해 temperature를 살짝 올림 (대화 길이에 따라 미세 변동)
    temperature = 0.95 + (messages.length % 3) * 0.03;
  } else {
    const forbiddenList =
      botUtterances.length === 0
        ? "(아직 없음)"
        : botUtterances.map((u, i) => `${i + 1}. ${u}`).join("\n");

    const usedTopics = detectUsedTopics(botUtterances, userUtterances);
    const remainingTopics = TOPICS.filter((t) => !usedTopics.has(t.key));
    // 모든 화제가 소진됐을 때는 cycling 하지 말고 wrap-up 모드로 전환.
    // (이전에는 `?? TOPICS[0]` 로 첫 토픽을 다시 골랐기 때문에 대화 끝에
    //  처음 했던 질문이 다시 나오는 현상이 있었음.)
    const focusTopic = remainingTopics[0] ?? null;
    const lastUser = userUtterances[userUtterances.length - 1] ?? "";

    // 토픽 라벨 모음 — 프롬프트에 "이미 다룬 화제" / "남은 화제" 를 명시적으로
    // 보여줘서 모델이 토픽 단위로 반복하지 않도록 한다.
    const usedTopicLabels = TOPICS.filter((t) => usedTopics.has(t.key))
      .map((t) => `- ${t.desc}`)
      .join("\n") || "(아직 없음)";
    const remainingTopicLabels = remainingTopics.map((t) => `- ${t.desc}`).join("\n");

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

[가장 중요한 원칙 — 같은 화제 두 번 금지]
이미 다룬 화제(거리·페이스·장소·날씨·시간대·몸 상태·인상 깊은 순간·음악·동행·다음 계획)는
표현을 바꿔서라도 다시 묻지 마. "이미 다룬 화제" 목록과 "남은 화제" 목록을 매번 확인하고,
반드시 "남은 화제" 중에서만 새 질문을 골라. 남은 화제가 하나도 없으면 새 질문은 절대
던지지 말고, 짧은 코멘트로 자연스럽게 대화를 닫아.

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
- 기계 톤(정말 대단해요 같은) 절대 금지. 친구 톤만.
- 라벨/따옴표 금지. 한 마디만.`;

    // 남은 화제가 하나도 없으면 wrap-up 모드 — 새 질문 없이 따뜻하게 마무리.
    const wrapUpInstruction = focusTopic === null
      ? `[남은 화제 없음 — 마무리]
이미 거리·페이스·장소·시간대·동행 등 주요 화제는 다 다뤘어.
이번 답변은 새 질문 없이, 1~2문장으로 자연스럽게 대화를 닫아.
- 짧은 리액션 + 따뜻한 마무리. 새 질문(?)은 절대 붙이지 마.
- 예: "오 좋네. 오늘 얘기 잘 들었어." / "그랬구나. 오늘 한 줄로 정리해보자."
- 예: "와 멋지다. 이 정도면 오늘 얘기는 충분한 것 같아."`
      : `[다음에 풀어갈 화제]
${focusTopic.desc}
이 화제를 다음처럼 물을 수 있어 (베끼지 말고 자연스럽게 변형해서):
- ${focusTopic.examples.join("\n- ")}

❗ "남은 화제" 목록에 있는 화제 중 위 화제 하나만 골라서 물어. 다른 화제로 새지 마.`;

    userPrompt = `[지금까지 대화]
${transcript}

[러너의 마지막 말]
${lastUser}

[이미 네가 한 말 — 절대 또 하지 말 것]
${forbiddenList}

[이미 다룬 화제 — 표현을 바꿔도 다시 묻지 마]
${usedTopicLabels}

[남은 화제]
${remainingTopicLabels || "(없음 — 마무리 멘트만 하기)"}

${wrapUpInstruction}

규칙:
- 반드시 짧은 리액션으로 시작 (와, 오, 아, 헐 등).
- 사용자가 말 안 한 정보를 단정해서 묻지 마.
- 러너 마지막 말의 정보(숫자/장소 등)를 따라 말하지 마.
- "이미 다룬 화제"는 표현을 바꿔서라도 다시 묻지 마.
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
          : { reply: pickFallbackReply(botUtterances, userUtterances), error: `http-${upstream.status}` },
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
          : { reply: pickFallbackReply(botUtterances, userUtterances), error: "non-korean" },
        { status: 200 },
      );
    }

    if (isTooShort(cleaned)) {
      console.warn(`[chat:${mode}] response too short after sanitize. raw="${raw}"`);
      return NextResponse.json(
        mode === "summary"
          ? { summary: pickFallbackSummary(messages), error: "too-short" }
          : { reply: pickFallbackReply(botUtterances, userUtterances), error: "too-short" },
        { status: 200 },
      );
    }

    if (mode === "reply" && hasOrphanParticleSentence(cleaned)) {
      console.warn(`[chat:reply] response started a sentence with a particle. raw="${raw}"`);
      return NextResponse.json({ reply: pickFallbackReply(botUtterances, userUtterances), error: "broken-grammar" });
    }

    if (mode === "reply" && isEchoOfUser(cleaned, userUtterances)) {
      console.warn(`[chat:reply] response echoed user's last message. raw="${raw}"`);
      return NextResponse.json({ reply: pickFallbackReply(botUtterances, userUtterances), error: "echo" });
    }

    // 마지막 안전장치 — 모델이 프롬프트를 무시하고 이미 다룬 화제를 또 물어봤다면
    // reject하고 fallback. 다음 3가지 검사:
    // (a) 정확히 같은 문장(공백/구두점 무시)이 이미 봇 발화에 있는지 — exact dup
    // (b) 응답이 used topic을 다시 묻는지 — topic-level repeat
    // (c) 봇이 한 질문(? 로 끝)이 이미 비슷한 형태로 있었는지 — fuzzy similarity
    if (mode === "reply") {
      // (a) 정확 중복
      const normForDup = (s: string) =>
        s.replace(/\s+/g, "").replace(/[?!.…]/g, "");
      const cleanedNorm = normForDup(cleaned);
      const isExactDup = botUtterances.some(
        (b) => normForDup(b) === cleanedNorm,
      );
      if (isExactDup) {
        console.warn(`[chat:reply] response is byte-exact duplicate of prior bot msg. raw="${raw}"`);
        return NextResponse.json({
          reply: pickFallbackReply(botUtterances, userUtterances),
          error: "exact-duplicate",
        });
      }

      // (b) 토픽 단위 중복
      const usedTopicsForCheck = detectUsedTopics(botUtterances, userUtterances);
      const askedTopicsInReply = detectUsedTopics([cleaned], []);
      const repeatedTopic = [...askedTopicsInReply].find((t) =>
        usedTopicsForCheck.has(t),
      );
      if (repeatedTopic) {
        console.warn(
          `[chat:reply] response re-asked topic '${repeatedTopic}'. raw="${raw}"`,
        );
        return NextResponse.json({
          reply: pickFallbackReply(botUtterances, userUtterances),
          error: `repeat-topic-${repeatedTopic}`,
        });
      }
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
    return NextResponse.json({ reply: pickFallbackReply(botUtterances, userUtterances) });
  } catch (err) {
    console.error(`[chat:${mode}] exception:`, err);
    return NextResponse.json(
      mode === "summary"
        ? { summary: pickFallbackSummary(messages), error: "exception" }
        : { reply: pickFallbackReply(botUtterances, userUtterances), error: "exception" },
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

/**
 * 봇이 이미 물어본 화제를 추정.
 *
 * 핵심 원칙: 봇이 "질문" 한 토픽만 used로 표시한다. 봇의 일반 코멘트에 단어가
 * 살짝 스쳐 지나간 정도로는 used로 잡지 않는다. 이전 구현은 패턴이 너무 느슨해서
 * (예: "다음엔 뭐 해보고 싶어?" 라는 next 질문 하나로 "뛰었어" 같은 단어가 다른
 * 봇 발화에 들어가면 distance를 used로 잘못 표시하는 식) — 결과적으로 토픽이 잘못
 * 소진된 것처럼 보이거나, 반대로 누락되어 같은 질문을 또 던지는 일이 있었음.
 *
 * 새 규칙:
 * 1) 발화 단위로 보고, 각 발화에서 "이 토픽을 진짜로 물어본" 흔적이 명시적으로
 *    있을 때만 used에 추가.
 * 2) 토픽 사이 겹침 단어("뛰었어", "다음에" 등)는 두 토픽 모두에 들어가지 않도록
 *    더 한정된 question-form 패턴 사용.
 * 3) 사용자 직답(예: "한강", "5km") 도 토픽 답변으로 인정. 봇이 직접 묻지는
 *    않았어도 이미 정보가 나왔으면 다시 물을 필요는 없으니 used로 표시.
 */
function detectUsedTopics(
  botUtterances: string[],
  userUtterances: string[] = [],
): Set<string> {
  const used = new Set<string>();

  // 봇 발화별 — 명시적 question-form만 매칭
  for (const text of botUtterances) {
    if (
      /(?:몇\s*(?:km|키로|킬로))|얼마나\s*(?:뛰|달|갔|됐)|거리(?:는|가)?\s*(?:얼마|어느|어땠|어때)/u.test(
        text,
      )
    )
      used.add("distance");

    if (
      /페이스(?:는|가)?\s*(?:어땠|어떄|어떠|어때|괜찮)|시간(?:은|이|이?\s*얼마)?\s*(?:얼마|어땠|걸렸)|얼마나\s*걸렸/u.test(
        text,
      )
    )
      used.add("pace");

    if (
      /어디(?:서|에|를|에서)?\s*(?:뛰|달|갔)|장소(?:는|가)?\s*어|코스(?:는|가)?\s*(?:어|어땠|어디)/u.test(
        text,
      )
    )
      used.add("place");

    if (/날씨(?:는|가)?\s*(?:어땠|어떄|어때)|덥지\s*않|춥지\s*않|비\s*왔/u.test(text))
      used.add("weather");

    if (
      /언제\s*(?:뛰|달|갔)|아침에\s*뛰|저녁에\s*뛰|밤에\s*뛰|새벽에\s*뛰|시간대(?:는|가)?\s*어/u.test(
        text,
      )
    )
      used.add("timeOfDay");

    if (
      /다리(?:는|가)?\s*(?:괜찮|어땠|아파|아프|편)|무릎(?:은|이|는)?\s*(?:괜찮|아파)|호흡(?:은|이)?\s*(?:편|괜찮|어땠)|숨(?:은|이)?\s*(?:편|차|괜찮)|몸\s*상태|컨디션(?:은|이)?\s*어/u.test(
        text,
      )
    )
      used.add("body");

    if (
      /어떤\s*점(?:이|을|에서)|왜\s*그렇|왜\s*힘|왜\s*좋|인상\s*깊|가장\s*기억|기억\s*나는\s*순간/u.test(
        text,
      )
    )
      used.add("feelingReason");

    if (/음악|노래|팟캐스트|뭐\s*들으면서|뭐\s*들었/u.test(text))
      used.add("music");

    if (
      /혼자\s*(?:뛰|달|갔)|같이\s*(?:뛰|달|갔)|누구랑|동행|친구랑\s*(?:뛰|같이)/u.test(
        text,
      )
    )
      used.add("company");

    if (
      /다음(?:에는|에|엔)\s*(?:뭐|어떤|뭘)|다음\s*러닝|다음\s*목표|다음\s*번엔|이번\s*주\s*안에/u.test(
        text,
      )
    )
      used.add("next");
  }

  // 사용자가 이미 그 토픽에 대한 정보를 줬으면 다시 묻지 않도록 used에 포함.
  // (봇이 직접 묻지 않았더라도 사용자가 자발적으로 말한 경우 — 예: 첫 메시지에서
  //  "오늘 한강에서 5km 뛰었어" 라고 하면 distance/place 둘 다 답변된 상태)
  //
  // 짧은 답변도 잡기 위해 단어 단위로 검사. "혼자" 한 단어 답변 → company,
  // "아침" 한 단어 답변 → timeOfDay 식으로 인정한다.
  const userText = userUtterances.join(" ");
  const lastUserTrim = (userUtterances[userUtterances.length - 1] ?? "").trim();

  if (/\d+(?:\.\d+)?\s*(?:km|키로|킬로)/i.test(userText)) used.add("distance");
  if (/\d+\s*(?:분|시간)|['′]\d{2}["″]?|페이스\s*\d/u.test(userText))
    used.add("pace");
  if (/한강|공원|트랙|러닝머신|산책로|운동장|동네\s*한바퀴|반포|올림픽|학교|회사\s*근처/u.test(userText))
    used.add("place");
  if (/덥|춥|선선|쌀쌀|시원|날씨\s*(?:좋|괜찮)|비\s*(?:오|왔)|햇빛|미세먼지|맑/u.test(userText))
    used.add("weather");
  if (/아침|저녁|새벽|밤에?\s|점심|오후|오전/u.test(userText)) used.add("timeOfDay");
  if (/다리\s*(?:아파|괜찮|좋)|무릎|호흡|숨\s*차|컨디션|괜찮았어|괜찮아|편했어/u.test(userText))
    used.add("body");
  if (/혼자(?:서|만)?(?:\s|$)|같이\s*뛰|친구랑|동행|모임|친구\s*(?:랑|와|이|이랑)/u.test(userText))
    used.add("company");
  if (/노래|음악|팟캐스트|들으면서|들었어/u.test(userText)) used.add("music");
  if (/다음(?:엔|에는|에)\s*(?:뭐|어떤|뭘)|다음\s*(?:엔|에는)?\s*해보|이번\s*주\s*안에|다음\s*목표/u.test(userText))
    used.add("next");

  // 추가 — 마지막 답변이 한 단어인 경우 (예: "혼자", "아침", "한강") 도 잡기.
  // 봇 질문의 직전 토픽을 기반으로 판단할 수도 있지만, 더 간단하게 키워드 매칭.
  if (lastUserTrim) {
    if (/^혼자(?:서|만)?\.?$/.test(lastUserTrim)) used.add("company");
    if (/^(?:같이|친구랑?|동행)\.?$/.test(lastUserTrim)) used.add("company");
    if (/^(?:아침|저녁|새벽|밤|점심|오후|오전)\.?$/.test(lastUserTrim))
      used.add("timeOfDay");
    if (/^(?:한강|공원|트랙|동네|러닝머신)\.?$/.test(lastUserTrim)) used.add("place");
    if (/^(?:덥|춥|선선|시원|맑)\w*\.?$/.test(lastUserTrim)) used.add("weather");
    if (/^(?:괜찮|좋아|좋았|편했|아팠)\w*\.?$/.test(lastUserTrim)) used.add("body");
  }

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

/** 각 fallback 멘트에 어떤 토픽을 물어보는지 labeling — 토픽 중복 회피용. */
const FALLBACK_REPLIES: { topic: string; text: string }[] = [
  { topic: "place", text: "오 좋네. 어디서 뛰었어?" },
  { topic: "distance", text: "와 잘했네. 거리는 얼마나 됐어?" },
  { topic: "pace", text: "오 그랬구나. 페이스는 어땠어?" },
  { topic: "weather", text: "오늘 날씨는 어땠어?" },
  { topic: "company", text: "혼자 뛴 거야 아니면 같이?" },
  { topic: "music", text: "와 멋지다. 뭐 들으면서 뛰었어?" },
  { topic: "next", text: "다음엔 뭐 해보고 싶어?" },
  { topic: "body", text: "오 그랬구나. 다리는 좀 괜찮아?" },
  { topic: "timeOfDay", text: "오 좋네. 오늘 언제 뛰었어?" },
];

/** 마무리 멘트 — 남은 토픽이 하나도 없을 때 새 질문 없이 대화를 닫음. */
const WRAP_UP_REPLIES = [
  "오늘 얘기 잘 들었어. 이제 한 줄로 정리해볼까?",
  "그랬구나. 오늘 얘기 충분한 것 같아.",
  "오 좋네. 이 정도면 오늘 러닝 잘 그려져.",
];

/**
 * 봇이 다음에 던질 fallback 답변을 고른다.
 *
 * 우선순위:
 * 1) 아직 다루지 않은 토픽 (usedTopics에 없는) 중에서 고르고
 * 2) 모두 다뤘으면 wrap-up 멘트로 마무리.
 *
 * 이전 구현은 단순히 "previous bot 발화 문자열과 정확히 일치하지 않은 fallback"
 * 만 골랐기 때문에, 봇이 표현을 살짝 바꿔 같은 토픽을 또 물었으면 fallback도
 * 같은 토픽을 골라 반복되는 문제가 있었다. 이제는 토픽 기반으로 회피한다.
 */
function pickFallbackReply(
  botUtterances: string[],
  userUtterances: string[] = [],
): string {
  const usedTopics = detectUsedTopics(botUtterances, userUtterances);
  for (const f of FALLBACK_REPLIES) {
    if (!usedTopics.has(f.topic)) return f.text;
  }
  // 모든 토픽 소진 → 마무리 멘트
  const seed =
    (botUtterances.join("").length + userUtterances.join("").length) %
    WRAP_UP_REPLIES.length;
  return WRAP_UP_REPLIES[seed];
}

const FALLBACK_SUMMARIES_BY_TONE: Record<RunStats["effortLevel"], string[]> = {
  great: [
    "오늘 진짜 잘 달렸네<br/>이 페이스면 진짜 대단해 💪",
    "오늘의 러닝, 폼이 살아있었어<br/>이 컨디션 계속 가자 🔥",
    "한 챕터 끝낸 기분이지<br/>너의 베스트가 갱신된 날 ✨",
    "페이스에 자신감이 묻어났어<br/>오늘 너 진짜 멋있었어 🚀",
    "단숨에 끊어낸 오늘<br/>여기서 한 단계 또 올라가는 거야 ⭐",
    "오늘 너의 흐름이 진짜 좋았어<br/>이 감각 잊지 마 💜",
  ],
  good: [
    "오늘도 안정적으로 한 바퀴<br/>이 정도면 진짜 잘한 거야 🌟",
    "꾸준한 페이스로 잘 마쳤네<br/>오늘 너 충분히 멋졌어 💜",
    "너에게 맞는 리듬 찾은 날<br/>흐트러짐 없이 잘 갔어 🍀",
    "단단하게 한 걸음 더<br/>이게 너의 페이스야 🌤️",
    "오늘도 너의 라인을 잘 그렸어<br/>이 흐름 계속 가자 🌟",
  ],
  ok: [
    "오늘은 가볍게 한 걸음 더<br/>이렇게 쌓이는 게 결국 실력이야 🌿",
    "무리 없이 마친 오늘<br/>이런 날도 분명 도움이 돼 🌤️",
    "오늘도 빠뜨리지 않은 게 멋져<br/>꾸준함이 너의 무기야 🍃",
    "한 발 더 디뎠다는 게 중요해<br/>이게 너의 일상이 되는 거야 ☀️",
    "오늘은 담담하게 한 바퀴<br/>이런 날이 너를 만들어 🌱",
  ],
  tough: [
    "쉽지 않은 날에도 일단 뛴 너<br/>그게 제일 멋져 🌙",
    "오늘은 짧게, 그래도 충분해<br/>내일 더 가볍게 뛰어보자 🌧️",
    "버거운 날에도 한 발 디뎠어<br/>오늘은 이 정도면 충분해 ☁️",
    "짧아도 너의 의지가 보였어<br/>쉬는 것도 훈련이야 🌙",
    "힘든 날에 일단 시작한 게 대단해<br/>내일은 더 가볍게 가자 🌒",
  ],
};

/**
 * 같은 톤 안에서도 매번 다른 멘트가 나오도록, 봇 발화에 이미 들어간 멘트는
 * 제외하고 고른다. seed는 대화 길이 + 분 단위 시각 + Math.random 살짝.
 */
function pickFallbackSummary(messages: ChatMessage[]): string {
  const userTexts = messages.filter((m) => m.from === "user").map((m) => m.text);
  const stats = extractRunStats(userTexts);
  const pool = FALLBACK_SUMMARIES_BY_TONE[stats.effortLevel];
  const seed =
    messages.reduce((s, m) => s + m.text.length, 0) +
    new Date().getMinutes() +
    Math.floor(Math.random() * pool.length);
  return pool[seed % pool.length];
}
