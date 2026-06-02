import { Hono } from 'hono';
import { prisma } from '@parenting-newsletter/db';
import type { DateCheck } from '@parenting-newsletter/shared';
import { isPreview, getPublishedIssueDates } from '../publish';

const app = new Hono();

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function serializeArticle(a: {
  id: string;
  title: string;
  summary: string;
  body: string;
  url: string;
  category: string;
  contentType: string;
  mediaType: string | null;
  durationMin: number | null;
  source: string;
  publishedAt: Date;
  credibilityScore: number;
  issueDate: Date;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  deadline: Date | null;
  tags: string[];
  imageUrl: string | null;
  dateCheck?: unknown;
}) {
  return {
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
    imageUrl: a.imageUrl ?? undefined,
    dateCheck: (a.dateCheck as DateCheck | null) ?? undefined,
  };
}

// GET /api/articles?category=policy&contentType=Policy&issueDate=2026-05-12&limit=20
app.get('/', async (c) => {
  const category = c.req.query('category');
  const contentType = c.req.query('contentType');
  const issueDateStr = c.req.query('issueDate');
  const limit = Math.min(Number(c.req.query('limit') || 20), 100);

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (contentType) where.contentType = contentType;
  if (issueDateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDateStr)) {
      return c.json({ error: 'Invalid issueDate format. Use YYYY-MM-DD.' }, 400);
    }
    where.issueDate = new Date(issueDateStr);
  }

  // 발행 게이트: 기본은 published 이슈의 날짜에 속한 기사만. ?preview=토큰이면 전체.
  const preview = isPreview(c);
  if (!preview) {
    const publishedDates = await getPublishedIssueDates();
    if (issueDateStr) {
      // 특정 날짜 요청인데 그 이슈가 미공개면 빈 결과.
      const reqTime = new Date(issueDateStr).getTime();
      if (!publishedDates.some((d) => d.getTime() === reqTime)) {
        return c.json({ articles: [], total: 0 });
      }
    } else {
      where.issueDate = { in: publishedDates };
    }
  }

  try {
    const articles = await prisma.article.findMany({
      where,
      orderBy: [{ issueDate: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
    });

    return c.json({
      articles: articles.map(serializeArticle),
      total: articles.length,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch articles' }, 500);
  }
});

// GET /api/articles/:id - 기사 상세. 기본은 published 이슈의 기사만, ?preview=토큰이면 draft도.
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const preview = isPreview(c);

  try {
    const article = await prisma.article.findUnique({ where: { id } });

    if (!article) {
      return c.json({ error: 'Article not found' }, 404);
    }

    // 발행 게이트: 미공개 이슈의 기사는 프리뷰가 아니면 없는 것처럼 처리.
    if (!preview) {
      const publishedDates = await getPublishedIssueDates();
      if (!publishedDates.some((d) => d.getTime() === article.issueDate.getTime())) {
        return c.json({ error: 'Article not found' }, 404);
      }
    }

    return c.json({ article: serializeArticle(article) });
  } catch (error) {
    return c.json({ error: 'Failed to fetch article' }, 500);
  }
});

export default app;
