export const KO_DOW = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function parseKey(k: string): { y: number; m: number; d: number; dow: number } {
  const [y, m, d] = k.split("-").map(Number);
  return { y, m, d, dow: new Date(y, m - 1, d).getDay() };
}

export function formatKoreanDate(k: string): string {
  const { y, m, d, dow } = parseKey(k);
  return `${y}년 ${m}월 ${d}일 (${KO_DOW[dow]})`;
}
