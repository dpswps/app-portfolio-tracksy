import { NextResponse } from "next/server";

/**
 * 러닝 캡쳐 사진 OCR + 구조화 추출.
 * 클라이언트가 base64 data URL을 보내면 Groq vision 모델로 분석해서
 * 거리/시간/페이스/심박/케이던스/칼로리/누적상승/날짜를 JSON으로 반환.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// vision 가능한 Llama 4 Scout. 환경변수로 override 가능.
const VISION_MODEL =
  process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

type RunningSplit = {
  km: number;
  time?: string;
  pace?: string;
  bpm?: number;
};

type ScanResult = {
  date: string | null;
  dist: string | null;
  time: string | null;
  pace: string | null;
  bpm: number | null;
  cadence: number | null;
  kcal: number | null;
  elev: string | null;
  splits: RunningSplit[] | null;
};

const EMPTY_RESULT: ScanResult = {
  date: null,
  dist: null,
  time: null,
  pace: null,
  bpm: null,
  cadence: null,
  kcal: null,
  elev: null,
  splits: null,
};

export async function POST(req: Request) {
  let imageDataUrl = "";
  try {
    const body = await req.json();
    if (typeof body?.image === "string") imageDataUrl = body.image;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "no-image" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { result: EMPTY_RESULT, error: "no-key" },
      { status: 200 },
    );
  }

  const systemPrompt = `너는 러닝 기록 캡쳐 사진에서 정보를 추출하는 OCR 전문가야.
이미지에서 다음 항목들을 정확히 읽어서 JSON으로만 응답해.

응답 형식 (반드시 이 JSON 스키마 그대로, 다른 텍스트 절대 금지):
{
  "date": "YYYY-MM-DD" 또는 null,
  "dist": "5.21" 또는 null,
  "time": "30:05" 또는 "1:30:05" 또는 null,
  "pace": "5'56\\"" 또는 null,
  "bpm": 154 또는 null,
  "cadence": 173 또는 null,
  "kcal": 264 또는 null,
  "elev": "11 m" 또는 null,
  "splits": [
    { "km": 1, "time": "5:30", "pace": "5'30\\"", "bpm": 150 },
    { "km": 2, "time": "5:45", "pace": "5'45\\"", "bpm": 155 }
  ] 또는 null
}

기본 규칙:
- 사진에서 명확히 보이는 항목만. 보이지 않으면 null.
- JSON 외 설명·마크다운·코드블록 절대 출력하지 마.

각 필드 규칙:
- 거리(dist): 단위 없이 숫자 문자열. 사진이 mi(마일)이면 km로 변환 (1mi = 1.609km).
- 시간(time): "MM:SS" 또는 "H:MM:SS" 형식. "30분 5초" 같은 한국어면 "30:05"로.
- 페이스(pace): "M'SS\\"" 형식 (러닝 표준). /mi이면 /km로 변환.
- 심박(bpm)/케이던스(cadence)/칼로리(kcal): 정수 숫자만.
- 누적상승(elev): 단위 포함 문자열 (예: "11 m" 또는 "12m").
- 날짜(date): 사진에 표시된 운동 날짜. 추측 말고 명시되어 있을 때만.

구간(splits) 규칙 — 매우 중요:
- 사진에 구간별 페이스/시간 표(보통 "1km 5'30\"", "2km 5'45\"" 같이 행으로 나열)가 있으면 모두 추출.
- km 필드는 그 구간의 누적 거리(1, 2, 3...) 또는 마지막 구간이 부분구간이면 소수(예: 0.5).
- 각 구간 객체에 time/pace/bpm 중 보이는 것만 채우고 보이지 않으면 해당 키 생략.
- 구간 정보가 사진에 없으면 splits는 null.
- 구간이 마일 단위로 표기됐어도 km 필드에 숫자는 그대로 두고, time/pace는 사진 그대로 옮겨.`;

  try {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "이 캡쳐 사진의 러닝 기록을 위 스키마대로 JSON으로 추출해줘.",
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("[ocr] Groq HTTP error:", upstream.status, errText);
      return NextResponse.json(
        { result: EMPTY_RESULT, error: `http-${upstream.status}` },
        { status: 200 },
      );
    }

    const data = await upstream.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";

    console.log(`[ocr] raw response (len=${raw.length}):`, raw.slice(0, 300));

    // JSON parse
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // 모델이 ```json``` 같은 마크다운으로 감싼 경우 등 — JSON 부분만 추출
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          /* ignore */
        }
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { result: EMPTY_RESULT, error: "parse-failed", raw: raw.slice(0, 200) },
        { status: 200 },
      );
    }

    // splits 정규화: 배열인지 확인, 각 element 검사
    let splits: RunningSplit[] | null = null;
    if (Array.isArray(parsed.splits)) {
      splits = parsed.splits
        .map((sp): RunningSplit | null => {
          if (typeof sp !== "object" || sp == null) return null;
          const s = sp as Record<string, unknown>;
          const km =
            typeof s.km === "number"
              ? s.km
              : typeof s.km === "string"
                ? parseFloat(s.km)
                : NaN;
          if (!isFinite(km) || km <= 0) return null;
          const out: RunningSplit = { km };
          if (typeof s.time === "string") out.time = s.time;
          if (typeof s.pace === "string") out.pace = s.pace;
          if (typeof s.bpm === "number") out.bpm = s.bpm;
          return out;
        })
        .filter((x): x is RunningSplit => x !== null);
      if (splits.length === 0) splits = null;
    }

    // 안전한 normalization
    const result: ScanResult = {
      date: typeof parsed.date === "string" ? parsed.date : null,
      dist:
        typeof parsed.dist === "string"
          ? parsed.dist
          : typeof parsed.dist === "number"
            ? String(parsed.dist)
            : null,
      time: typeof parsed.time === "string" ? parsed.time : null,
      pace: typeof parsed.pace === "string" ? parsed.pace : null,
      bpm: typeof parsed.bpm === "number" ? parsed.bpm : null,
      cadence: typeof parsed.cadence === "number" ? parsed.cadence : null,
      kcal: typeof parsed.kcal === "number" ? parsed.kcal : null,
      elev:
        typeof parsed.elev === "string"
          ? parsed.elev
          : typeof parsed.elev === "number"
            ? `${parsed.elev} m`
            : null,
      splits,
    };

    return NextResponse.json({ result });
  } catch (err) {
    console.error("[ocr] exception:", err);
    return NextResponse.json(
      { result: EMPTY_RESULT, error: "exception" },
      { status: 200 },
    );
  }
}
