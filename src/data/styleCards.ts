import type { StyleCards } from "@/types";

/**
 * 스타일 카드 시드 데이터.
 *
 * 각 카드는:
 *  - 보관함에서 미리보여줄 외형 정보 (bg, title, dist, stats)
 *  - 스튜디오에 적용될 실제 텍스트/스티커 레이아웃 (template)
 * 을 함께 담고 있다.
 *
 * 좌표 시스템: x, y 모두 카드 영역 기준 백분율(0~100, 중앙 = 50,50).
 * 스튜디오의 TextOverlay 와 PlacedStickers 가 사용하는 좌표계와 동일.
 *
 * 좌표는 모두 15~85 범위 안쪽으로 배치 — 텍스트 박스/스티커가 translate(-50%,-50%)
 * 로 중심 정렬되기 때문에, 가장자리 가까이(예: 10 이하 / 90 이상) 두면 카드 밖으로
 * 살짝 비져나갈 수 있음. 안전 마진을 두어 카드 안쪽에 깔끔히 자리잡도록 했다.
 *
 * "스타일 사용하기" 를 누르면 store 의 applyStudioStyle 이 호출되어,
 * 기존 배경/텍스트/스티커는 보존하고 template 의 텍스트·스티커가 새 id 로
 * 덧붙여진다.
 */

// 한글 본문 폰트 — 스튜디오의 addStudioText 기본값과 동일하게 맞춤.
const FONT_KR =
  "var(--font-noto-kr), 'Noto Sans KR', system-ui, sans-serif";
// 영문 헤드라인용 sans-serif.
const FONT_DISPLAY =
  "var(--font-noto-kr), 'Helvetica Neue', system-ui, sans-serif";

export const styleCards: StyleCards = {
  saved: [
    {
      id: "s1",
      date: "오늘 · 5.21 (화)",
      title: "올림픽 공원 러닝",
      dist: "6.06",
      distColor: "#1F1F23",
      bg: "linear-gradient(180deg,#A8D8B9 0%,#7FB68C 35%,#5C8A6E 70%,#3F5E55 100%)",
      stats: [
        { v: "7'43\"", l: "평균 페이스" },
        { v: "46:45", l: "시간" },
        { v: "154", l: "BPM" },
        { v: "25m", l: "누적 상승" },
        { v: "152", l: "평균 케이던스" },
        { v: "173", l: "칼로리" },
      ],
      // "올림픽 공원 러닝" — 상단 영문 타이틀 + 하단 거리/시간 + 양 측 스티커.
      template: {
        texts: [
          {
            text: "Olympic Park Run",
            x: 50,
            y: 18,
            size: 20,
            font: FONT_DISPLAY,
            fontWeight: 700,
            color: "#FFFFFF",
          },
          {
            text: "6.06 km · 46:45",
            x: 50,
            y: 82,
            size: 14,
            font: FONT_KR,
            fontWeight: 500,
            color: "#F8FAFC",
          },
        ],
        stickers: [
          { emoji: "/stickers/cool.png", x: 22, y: 28 },
          { emoji: "/stickers/excited.png", x: 78, y: 72 },
        ],
      },
    },
    {
      id: "s2",
      date: "2024. 04. 02 (화)",
      title: "벚꽃 러닝",
      dist: "10.02",
      distColor: "#E11D48",
      bg: "linear-gradient(180deg,#FFD7E1 0%,#F5A6BB 40%,#D87693 70%,#9C5670 100%)",
      stats: [
        { v: "6'12\"", l: "평균 페이스" },
        { v: "1:02:15", l: "시간" },
        { v: "632", l: "칼로리" },
        { v: "45m", l: "누적 상승" },
        { v: "148", l: "평균 케이던스" },
        { v: "160", l: "평균 심박" },
      ],
      // "벚꽃 러닝" — 중앙 정렬된 시적인 카피 + 양 측 스티커.
      template: {
        texts: [
          {
            text: "🌸 봄날의 러닝",
            x: 50,
            y: 22,
            size: 22,
            font: FONT_KR,
            fontWeight: 700,
            color: "#FFFFFF",
          },
          {
            text: "한 걸음 한 걸음,\n꽃잎과 함께",
            x: 50,
            y: 74,
            size: 13,
            font: FONT_KR,
            fontWeight: 400,
            fontStyle: "italic",
            color: "#FFE4EC",
          },
        ],
        stickers: [
          { emoji: "/stickers/happy.png", x: 22, y: 50 },
          { emoji: "/stickers/kissing.png", x: 78, y: 50 },
        ],
      },
    },
  ],
  mine: [
    {
      id: "m1",
      date: "2024. 03. 18 (월)",
      title: "야간 러닝",
      dist: "5.23",
      distColor: "#BEF264",
      bg: "linear-gradient(180deg,#1F2937 0%,#0F172A 50%,#020617 100%)",
      stats: [
        { v: "6'35\"", l: "평균 페이스" },
        { v: "34:20", l: "시간" },
        { v: "278", l: "칼로리" },
        { v: "18m", l: "누적 상승" },
        { v: "142", l: "평균 케이던스" },
        { v: "165", l: "평균 심박" },
      ],
      // "야간 러닝" — 상단 큰 타이틀 + 우상단 라이트닝 스티커 강조.
      template: {
        texts: [
          {
            text: "NIGHT RUN",
            x: 50,
            y: 18,
            size: 26,
            font: FONT_DISPLAY,
            fontWeight: 800,
            color: "#BEF264",
          },
          {
            text: "달빛 아래,\n나만의 페이스로",
            x: 50,
            y: 80,
            size: 13,
            font: FONT_KR,
            fontWeight: 400,
            color: "#E2E8F0",
          },
        ],
        stickers: [
          { emoji: "/stickers/cool.png", x: 78, y: 28 },
          { emoji: "/stickers/sleepy.png", x: 22, y: 72 },
        ],
      },
    },
    {
      id: "m2",
      date: "2024. 05. 12 (일)",
      title: "한강 러닝 10K",
      dist: "5.23",
      distColor: "#1F1F23",
      bg: "linear-gradient(180deg,#FCD9A4 0%,#E89E7A 40%,#9C6B82 70%,#3D3548 100%)",
      stats: [
        { v: "6'35\"", l: "평균 페이스" },
        { v: "34:20", l: "시간" },
        { v: "278", l: "칼로리" },
        { v: "18m", l: "누적 상승" },
        { v: "142", l: "평균 케이던스" },
        { v: "165", l: "평균 심박" },
      ],
      // "한강 러닝 10K" — 좌측 정렬 타이틀 + 우하단 도장.
      template: {
        texts: [
          {
            text: "한강 10K",
            x: 35,
            y: 18,
            size: 24,
            font: FONT_KR,
            fontWeight: 800,
            color: "#FFFFFF",
          },
          {
            text: "sunset run",
            x: 35,
            y: 26,
            size: 12,
            font: FONT_DISPLAY,
            fontWeight: 500,
            fontStyle: "italic",
            color: "#FFEDD5",
          },
          {
            text: "10K · 1H02M",
            x: 65,
            y: 82,
            size: 12,
            font: FONT_KR,
            fontWeight: 600,
            color: "#FFEDD5",
          },
        ],
        stickers: [
          { emoji: "/stickers/excited.png", x: 78, y: 72 },
        ],
      },
    },
    {
      id: "m3",
      date: "2024. 05. 18 (토)",
      title: "심플 미니멀",
      dist: "5.21",
      distColor: "#FFFFFF",
      bg: "linear-gradient(180deg,#0F172A 0%,#1E293B 50%,#334155 100%)",
      stats: [
        { v: "5'45\"", l: "평균 페이스" },
        { v: "30:01", l: "시간" },
        { v: "289", l: "칼로리" },
      ],
      // 미니멀 스타일 — 가운데 한 줄 텍스트만, 스티커는 코너 한 개. 가장 깔끔.
      template: {
        texts: [
          {
            text: "keep running.",
            x: 50,
            y: 50,
            size: 24,
            font: FONT_DISPLAY,
            fontWeight: 300,
            fontStyle: "italic",
            color: "#FFFFFF",
          },
        ],
        stickers: [
          { emoji: "/stickers/happy.png", x: 80, y: 20 },
        ],
      },
    },
    {
      id: "m4",
      date: "2024. 05. 17 (금)",
      title: "에너지 폭발",
      dist: "8.40",
      distColor: "#FBBF24",
      bg: "linear-gradient(135deg,#F97316 0%,#EF4444 50%,#7C2D12 100%)",
      stats: [
        { v: "5'02\"", l: "평균 페이스" },
        { v: "42:18", l: "시간" },
        { v: "521", l: "칼로리" },
        { v: "180", l: "평균 심박" },
      ],
      // 강렬한 스티커 4종 코너 배치 + 중앙 큰 타이틀.
      template: {
        texts: [
          {
            text: "GO!",
            x: 50,
            y: 45,
            size: 48,
            font: FONT_DISPLAY,
            fontWeight: 900,
            color: "#FBBF24",
          },
          {
            text: "한계 너머로",
            x: 50,
            y: 60,
            size: 14,
            font: FONT_KR,
            fontWeight: 700,
            color: "#FFFFFF",
          },
        ],
        stickers: [
          { emoji: "/stickers/furious.png", x: 22, y: 20 },
          { emoji: "/stickers/excited.png", x: 78, y: 20 },
          { emoji: "/stickers/cool.png", x: 22, y: 80 },
          { emoji: "/stickers/laughing.png", x: 78, y: 80 },
        ],
      },
    },
  ],
};
