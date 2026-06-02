// 발행일(issueDate) 키 계산 — 모든 에이전트·쿼리 공용 단일 소스.
// KST(UTC+9) 일자의 자정을 UTC로 환산한 값. KST 00:00 = UTC 15:00 전날.

/** 주어진 시각(기본 now)이 속한 KST 일자의 UTC 자정 Date. */
export function kstIssueDate(date: Date = new Date()): Date {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
}

/** issueDate Date → 'YYYY-MM-DD' 문자열. */
export function issueDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
