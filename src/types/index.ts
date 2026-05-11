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
};
