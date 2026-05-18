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

/**
 * "스타일" 의 본체 — 유저가 스튜디오에서 배치한 텍스트와 스티커의 좌표/스타일.
 *
 * 좌표 시스템: x, y 모두 카드 영역 기준의 백분율(0~100). 중앙 = (50, 50).
 * 스튜디오 캔버스의 텍스트/스티커 렌더링과 동일한 좌표계.
 *
 * 스타일은 "겉모습 카드(StyleCard)" 와 분리된 개념 — 카드는 보관함에서 미리
 * 보여줄 프리뷰용 메타데이터(배경/제목/거리/통계 등) 를 들고 있고, template 은
 * 실제로 스튜디오에 적용될 때 추가되는 텍스트/스티커 레이아웃이다.
 */
export type StyleTemplate = {
  texts: Array<{
    text: string;
    x: number;
    y: number;
    size: number;
    font: string;
    fontWeight?: number | string;
    fontStyle?: string;
    color: string;
  }>;
  stickers: Array<{ emoji: string; x: number; y: number }>;
};

export type StyleCard = {
  id: string;
  date: string;
  title: string;
  dist: string;
  distColor?: string;
  bg: string;
  stats: StyleStat[];
  /**
   * 스튜디오에 적용될 텍스트/스티커 레이아웃. 적용 시 기존 배경/텍스트/스티커는
   * 보존되고 이 template 의 항목들이 새 id 로 추가된다. (옵션이라 기존 데이터
   * 호환 — template 이 없는 스타일은 카드 외형만 미리보고 텍스트/스티커는
   * 적용되지 않음.)
   */
  template?: StyleTemplate;
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
