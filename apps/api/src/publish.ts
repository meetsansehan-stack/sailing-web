import type { Context } from 'hono';
import { prisma } from '@parenting-newsletter/db';

// 발행 게이트 헬퍼.
// 기본: published 이슈(+그 날짜의 기사)만 공개. 운영자 검수는 ?preview=<PREVIEW_TOKEN>로 draft까지 노출.

export function isPreview(c: Context): boolean {
  const token = process.env.PREVIEW_TOKEN;
  return Boolean(token) && c.req.query('preview') === token;
}

// 공개(published) 상태인 이슈의 날짜 목록. 기사는 issueDate로 이슈에 묶이므로 이 집합으로 필터.
export async function getPublishedIssueDates(): Promise<Date[]> {
  const rows = await prisma.dailyIssue.findMany({
    where: { status: 'published' },
    select: { issueDate: true },
  });
  return rows.map((r) => r.issueDate);
}
