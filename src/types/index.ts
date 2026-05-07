export type DateKey = string; // 'YYYY-MM-DD'

export type RunningRecord = {
  dist: string;
  pace: string;
  bpm?: number;
  time?: string;
  note?: string;
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
  tall?: boolean;
  avatarBg?: string;
  pace?: string;
  cal?: string;
  extra?: string;
};
