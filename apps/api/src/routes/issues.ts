import { Hono } from 'hono';
import { prisma } from '@parenting-newsletter/db';
import type { DateCheck } from '@parenting-newsletter/shared';
import { isPreview } from '../publish';

const app = new Hono();

// issueDate는 자정 UTC로 저장 — ISO의 앞 10자 = YYYY-MM-DD
function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// GET /api/issues?limit=30 - 이슈 목록 (최신순). 기본 published만, ?preview=토큰이면 draft 포함.
app.get('/', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') || 30), 100);
  const preview = isPreview(c);

  try {
    // 빈 이슈(기사 0개) 비노출 — SPEC §6.2-1. 시드는 IssueArticle 조인을 안 만들고
    // Article.issueDate로만 연결하므로, "기사 있는 날짜" 집합으로 필터.
    const datedArticles = await prisma.article.findMany({
      distinct: ['issueDate'],
      select: { issueDate: true },
    });
    const datesWithArticles = datedArticles.map((a) => a.issueDate);

    const issues = await prisma.dailyIssue.findMany({
      where: {
        issueDate: { in: datesWithArticles },
        ...(preview ? {} : { status: 'published' }), // 발행 게이트
      },
      orderBy: { issueDate: 'desc' },
      take: limit,
      select: {
        issueDate: true,
        title: true,
        summary: true,
        theme: true,
      },
    });

    return c.json({
      issues: issues.map((i) => ({
        date: toDateString(i.issueDate),
        title: i.title,
        summary: i.summary,
        theme: i.theme,
      })),
      total: issues.length,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch issues' }, 500);
  }
});

// GET /api/issues/:date - 특정 일자 이슈 (기사 포함). 기본 published만, ?preview=토큰이면 draft도.
app.get('/:date', async (c) => {
  const date = c.req.param('date');
  const preview = isPreview(c);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, 400);
  }

  const issueDate = new Date(date);
  if (Number.isNaN(issueDate.getTime())) {
    return c.json({ error: 'Invalid date' }, 400);
  }

  try {
    const issue = await prisma.dailyIssue.findUnique({
      where: { issueDate },
      select: {
        issueDate: true,
        status: true,
        title: true,
        summary: true,
        theme: true,
      },
    });

    // 발행 게이트: 미공개 이슈는 프리뷰가 아니면 없는 것처럼 처리.
    if (!issue || (!preview && issue.status !== 'published')) {
      return c.json({ error: 'Issue not found' }, 404);
    }

    const articles = await prisma.article.findMany({
      where: { issueDate },
      orderBy: { publishedAt: 'desc' },
    });

    return c.json({
      issue: {
        date: toDateString(issue.issueDate),
        title: issue.title,
        summary: issue.summary,
        theme: issue.theme,
      },
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        body: a.body,
        url: a.url,
        category: a.category,
        contentType: a.contentType,
        mediaType: a.mediaType ?? undefined,
        durationMin: a.durationMin ?? undefined,
        source: a.source,
        publishedAt: a.publishedAt.toISOString(),
        credibilityScore: a.credibilityScore,
        issueDate: toDateString(a.issueDate),
        eventStartDate: a.eventStartDate ? toDateString(a.eventStartDate) : undefined,
        eventEndDate: a.eventEndDate ? toDateString(a.eventEndDate) : undefined,
        deadline: a.deadline ? toDateString(a.deadline) : undefined,
        tags: a.tags,
        dateCheck: (a.dateCheck as DateCheck | null) ?? undefined,
      })),
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch issue' }, 500);
  }
});

export default app;
