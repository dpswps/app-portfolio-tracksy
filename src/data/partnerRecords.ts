import type { ArchiveRecords } from "@/types";

/**
 * 각 파트너 앱이 보유한 러닝 기록 (mock).
 * 사용자가 해당 앱과 연결한 뒤 "기록 동기화 및 가져오기"를 누르면
 * 이 데이터가 보관함의 내 기록 보관소로 import 된다.
 */
export const partnerRecords: Record<string, ArchiveRecords> = {
  ntc: {
    "2026-04-02": {
      dist: "5.32",
      pace: "6'10\"",
      bpm: 145,
      time: "00:32:50",
      note: "Nike Training Club · 한강 코스",
    },
    "2026-04-09": {
      dist: "8.15",
      pace: "5'42\"",
      bpm: 156,
      time: "00:46:32",
      note: "Nike Training Club · 올림픽 공원",
    },
    "2026-04-16": {
      dist: "6.20",
      pace: "5'58\"",
      bpm: 150,
      time: "00:36:55",
      note: "Nike Training Club · 동네 한바퀴",
    },
    "2026-04-23": {
      dist: "7.40",
      pace: "5'50\"",
      bpm: 152,
      time: "00:43:10",
      note: "Nike Training Club · 야간 러닝",
    },
  },
  garmin: {
    "2026-04-05": {
      dist: "10.21",
      pace: "5'30\"",
      bpm: 162,
      time: "00:56:18",
      note: "Garmin Connect · 장거리 러닝",
    },
    "2026-04-12": {
      dist: "12.45",
      pace: "5'22\"",
      bpm: 168,
      time: "01:06:44",
      note: "Garmin Connect · 인터벌",
    },
    "2026-04-19": {
      dist: "8.93",
      pace: "5'48\"",
      bpm: 158,
      time: "00:51:42",
      note: "Garmin Connect · 회복 러닝",
    },
    "2026-04-26": {
      dist: "15.30",
      pace: "5'15\"",
      bpm: 172,
      time: "01:20:18",
      note: "Garmin Connect · 하프 마라톤 훈련",
    },
  },
  coros: {
    "2026-04-03": {
      dist: "6.80",
      pace: "5'45\"",
      bpm: 154,
      time: "00:39:06",
      note: "Coros · 새벽 러닝",
    },
    "2026-04-10": {
      dist: "9.10",
      pace: "5'40\"",
      bpm: 160,
      time: "00:51:34",
      note: "Coros · 페이스 러닝",
    },
    "2026-04-17": {
      dist: "5.55",
      pace: "6'05\"",
      bpm: 148,
      time: "00:33:46",
      note: "Coros · 가벼운 조깅",
    },
  },
  adidas: {
    "2026-04-06": {
      dist: "4.20",
      pace: "6'20\"",
      bpm: 140,
      time: "00:26:36",
      note: "Adidas Running · 가벼운 산책 러닝",
    },
    "2026-04-13": {
      dist: "7.80",
      pace: "5'52\"",
      bpm: 155,
      time: "00:45:46",
      note: "Adidas Running · 한강 야경",
    },
    "2026-04-20": {
      dist: "6.50",
      pace: "5'58\"",
      bpm: 151,
      time: "00:38:47",
      note: "Adidas Running · 친구와 함께",
    },
  },
  hc: {
    "2026-04-07": {
      dist: "3.50",
      pace: "6'30\"",
      bpm: 138,
      time: "00:22:45",
      note: "Health Connect · 회복 산책",
    },
    "2026-04-14": {
      dist: "5.00",
      pace: "6'12\"",
      bpm: 146,
      time: "00:31:00",
      note: "Health Connect · 일반 러닝",
    },
    "2026-04-21": {
      dist: "8.20",
      pace: "5'55\"",
      bpm: 157,
      time: "00:48:31",
      note: "Health Connect · 장거리",
    },
  },
  google: {
    "2026-04-11": {
      dist: "5.80",
      pace: "6'00\"",
      bpm: 149,
      time: "00:34:48",
      note: "Google 피트니스 · 오후 러닝",
    },
    "2026-04-18": {
      dist: "7.10",
      pace: "5'48\"",
      bpm: 153,
      time: "00:41:11",
      note: "Google 피트니스 · 점심 러닝",
    },
    "2026-04-25": {
      dist: "9.50",
      pace: "5'35\"",
      bpm: 161,
      time: "00:53:03",
      note: "Google 피트니스 · 주말 장거리",
    },
  },
  apple: {
    "2026-04-01": {
      dist: "4.80",
      pace: "6'15\"",
      bpm: 144,
      time: "00:30:00",
      note: "Apple 건강 · 새벽 조깅",
    },
    "2026-04-08": {
      dist: "6.90",
      pace: "5'52\"",
      bpm: 154,
      time: "00:40:29",
      note: "Apple 건강 · 평일 러닝",
    },
    "2026-04-15": {
      dist: "10.50",
      pace: "5'30\"",
      bpm: 165,
      time: "00:57:45",
      note: "Apple 건강 · 장거리 러닝",
    },
    "2026-04-22": {
      dist: "5.30",
      pace: "6'08\"",
      bpm: 147,
      time: "00:32:30",
      note: "Apple 건강 · 회복",
    },
  },
};
