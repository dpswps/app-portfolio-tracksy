export type DateKey = string; // 'YYYY-MM-DD'

/**
 * 러닝 구간(스플릿) 정보. 보통 1km마다 또는 1마일마다 측정됨.
 */
export type RunningSplit = {
  /** 구간 번호 (1, 2, 3 ... 또는 "1km", "5km" 같은 라벨) */
  km: number;
  /** 그 구간에 걸린 시간 (예: "5:30") */
  time?: string;
  /** 그 구간의 페이스 (예: "5'30\"") */
  pace?: string;
  /** 그 구간 평균 심박 */
  bpm?: number;
};

/**
 * OCR(캡쳐 사진 스캔)으로 추출한 러닝 데이터.
 * scan 페이지 → store 임시 저장 → manual 페이지 prefill 흐름에 사용.
 */
export type ScanResult = {
  date: string | null;            // "YYYY-MM-DD"
  dist: string | null;            // "5.21"
  time: string | null;            // "MM:SS" 또는 "H:MM:SS"
  pace: string | null;            // "M'SS\""
  bpm: number | null;
  cadence: number | null;
  kcal: number | null;
  elev: string | null;            // "11 m"
  splits: RunningSplit[] | null;  // 구간 정보
  /** 클라이언트가 채우는 압축된 캡쳐 사진 (data URL). 서버 OCR 응답엔 안 옴. */
  screenshot?: string | null;
};

export type RunningRecord = {
  dist: string;
  pace: string;
  bpm?: number;
  time?: string;
  note?: string;
  /** 누적 상승 (예: "12 m") */
  elev?: string;
  /** 케이던스 (spm) */
  cadence?: number;
  /** 칼로리 */
  kcal?: number;
  /** 구간별 정보 */
  splits?: RunningSplit[];
  /** 캡쳐 사진 원본 (data URL, 압축됨). 지도 영역 표시용. */
  screenshot?: string;
};

export type ArchiveRecords = Record<DateKey, RunningRecord>;

export type Partner = {
  id: string;
  name: string;
  cls: string;
  initial: string;
  desc: string;
};

/**
 * 스튜디오에서 사용자가 편집한 카드의 전체 시각 스냅샷.
 * 갤러리에 저장될 때 함께 캡쳐되어, 갤러리 상세 페이지에서 편집한 그대로 다시 그릴 수 있도록 함.
 */
export type StudioCardSnapshot = {
  bg: string | null;
  themeOverlay: string | null;
  layoutId: string;
  ratio: string;
  rotate: number;
  flipH: boolean;
  flipV: boolean;
  crop: number;
  cardData: {
    weekTitle: string;
    distance: string;
    time: string;
    pace: string;
    calories: string;
    bubble: string;
  };
  cardTextColors: Record<string, string>;
  bubblePos: { x: number; y: number } | null;
  statsOffset: { x: number; y: number };
  texts: Array<{
    id: number;
    text: string;
    x: number;
    y: number;
    size: number;
    font: string;
    fontWeight?: number | string;
    fontStyle?: string;
    color: string;
  }>;
  stickers: Array<{ id: number; emoji: string; x: number; y: number }>;
  layerOrder: string[];
  layerOpacities: Record<string, number>;
  hiddenLayers: Record<string, boolean>;
};

export type GalleryCard = {
  id: number;
  /** Year of this run (used for filtering) */
  y: number;
  /** Month of this run, 1-12 (used for filtering) */
  m: number;
  date: string;
  title: string;
  dist: string;
  pace: string;
  time: string;
  kcal: number;
  elev: string;
  bpm: number;
  cadence: number;
  likes: number;
  comments: number;
  bg: string;
  /** 스튜디오에서 저장한 카드의 전체 시각 스냅샷 (있으면 갤러리 상세에서 그대로 재현). */
  snapshot?: StudioCardSnapshot;
};

export type StyleStat = { v: string; l: string };

export type StyleCard = {
  id: string;
  date: string;
  title: string;
  dist: string;
  distColor?: string;
  bg: string;
  stats: StyleStat[];
};

export type StyleCards = { saved: StyleCard[]; mine: StyleCard[] };

export type Inquiry = {
  id: number;
  type: "서비스 이용" | "계정/로그인" | "기타";
  title: string;
  date?: string;
  body: string;
  reply?: string;
  status: "wait" | "done";
};

export type AIMessage = { from: "bot" | "user"; text: string };
export type AIStep = "intro" | "chat" | "loading" | "result" | "skip";

export type CommunityPost = {
  id: number;
  type: "photo" | "stats";
  dist?: string;
  user?: string;
  time?: string;
  likes: number;
  brand?: string;
  bg: string;
  image?: string;
  tall?: boolean;
  avatarBg?: string;
  pace?: string;
  cal?: string;
  extra?: string;
  /** 게시글이 올라온 날짜 (YYYY-MM-DD). 상세 페이지에 표시. */
  date?: string;
  /** 작성자가 입력한 캡션 — 상세 페이지의 제목/본문에 노출. */
  caption?: string;
  /** 작성자가 입력한 해시태그 문자열 — 상세 페이지의 태그 영역에 노출. */
  tags?: string;
};
