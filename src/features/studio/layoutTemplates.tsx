/**
 * Studio 카드 레이아웃 템플릿.
 *
 * 각 레이아웃은:
 * - id: 식별자 (selectedLayoutId 와 매칭)
 * - name: 사용자 표시용 이름
 * - preview: 썸네일에 그릴 React 노드 (자리표시자 텍스트)
 * - renderType: RunningCard 가 어떤 JSX 템플릿을 그릴지 분기하는 키
 *
 * RunningCard 의 메인 통계 영역(.rc-stats-group)이 selectedLayoutId 에 따라
 * 완전히 다른 JSX 로 교체됩니다.
 */

import type { ReactNode } from "react";

export type LayoutRenderType =
  | "layout-1"
  | "layout-2"
  | "layout-3"
  | "layout-4"
  | "layout-5"
  | "layout-6"
  | "layout-7"
  | "layout-8";

export type LayoutTemplate = {
  id: LayoutRenderType;
  name: string;
  preview: ReactNode;
  renderType: LayoutRenderType;
  /** 1줄 설명 — 패널/툴팁용 */
  desc: string;
};

export const layoutTemplates: LayoutTemplate[] = [
  {
    id: "layout-1",
    name: "거리 중심",
    renderType: "layout-1",
    desc: "거리만 큼지막하게 가운데",
    preview: (
      <>
        <span className="lyp-distance">5.21km</span>
      </>
    ),
  },
  {
    id: "layout-2",
    name: "시간 중심",
    renderType: "layout-2",
    desc: "운동 시간을 가운데에 크게",
    preview: <span className="lyp-time">00:32:45</span>,
  },
  {
    id: "layout-3",
    name: "날짜+거리",
    renderType: "layout-3",
    desc: "날짜를 위, 거리를 아래에",
    preview: (
      <>
        <span className="lyp-date">YYYY.MM.DD</span>
        <span className="lyp-small">5.21km</span>
      </>
    ),
  },
  {
    id: "layout-4",
    name: "시간 / 거리",
    renderType: "layout-4",
    desc: "시간과 거리를 한 줄로",
    preview: <span className="lyp-small">00:32:45 / 5.21km</span>,
  },
  {
    id: "layout-5",
    name: "거리+페이스",
    renderType: "layout-5",
    desc: "거리와 평균 페이스",
    preview: (
      <>
        <span className="lyp-small">5.21km</span>
        <span className="lyp-small">6&apos;12&quot;</span>
      </>
    ),
  },
  {
    id: "layout-6",
    name: "아이콘형",
    renderType: "layout-6",
    desc: "텍스트 없이 아이콘만 하단에",
    preview: <span className="lyp-icons">🏃 ❤️</span>,
  },
  {
    id: "layout-7",
    name: "세로 통계",
    renderType: "layout-7",
    desc: "시간·거리·페이스 세로 정렬",
    preview: (
      <>
        <span className="lyp-tiny">00:32:45</span>
        <span className="lyp-tiny">5.21km</span>
        <span className="lyp-tiny">6&apos;12&quot;</span>
      </>
    ),
  },
  {
    id: "layout-8",
    name: "상세 기록",
    renderType: "layout-8",
    desc: "시간·거리·페이스·칼로리 풀 셋",
    preview: (
      <>
        <span className="lyp-tiny">00:32:45</span>
        <span className="lyp-tiny">5.21km</span>
        <span className="lyp-tiny">6&apos;12&quot;</span>
        <span className="lyp-tiny">368kcal</span>
      </>
    ),
  },
];
