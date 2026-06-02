import { prisma } from '../src/client';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function main() {
  const articles = await prisma.article.findMany({ orderBy: { id: 'asc' } });
  const issues = await prisma.dailyIssue.findMany({
    orderBy: { issueDate: 'desc' },
    select: { issueDate: true, title: true, theme: true, summary: true },
  });
  const venues = await prisma.reservableVenue.findMany({ orderBy: { id: 'asc' } });

  const articlesData = articles.map((a) => ({
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
    publishedAt: a.publishedAt.toISOString().slice(0, 10),
    credibilityScore: a.credibilityScore,
    issueDate: a.issueDate.toISOString().slice(0, 10),
    eventStartDate: a.eventStartDate ? a.eventStartDate.toISOString().slice(0, 10) : undefined,
    eventEndDate: a.eventEndDate ? a.eventEndDate.toISOString().slice(0, 10) : undefined,
    deadline: a.deadline ? a.deadline.toISOString().slice(0, 10) : undefined,
    tags: a.tags,
  }));

  const issuesData = issues.map((i) => ({
    date: i.issueDate.toISOString().slice(0, 10),
    title: i.title,
    summary: i.summary,
    theme: i.theme,
  }));

  const venuesData = venues.map((v) => ({
    id: v.id,
    name: v.name,
    type: v.type,
    ageRange: v.ageRange,
    entryMinAge: v.entryMinAge ?? undefined,
    region: v.region,
    reservationUrl: v.reservationUrl,
    reservationChannel: v.reservationChannel,
    operator: v.operator,
    pricing: v.pricing,
    schedule: v.schedule ?? undefined,
    description: v.description,
    credibilityScore: v.credibilityScore,
    tags: v.tags,
  }));

  const base = resolve(__dirname, '..', 'prisma', 'data');
  writeFileSync(
    resolve(base, 'articles.ts'),
    `import type { Article } from '@parenting-newsletter/shared';\n\nexport const articles: Article[] = ${JSON.stringify(articlesData, null, 2)};\n`,
  );
  writeFileSync(
    resolve(base, 'issues.ts'),
    `type IssueRow = { date: string; title: string | null; summary: string | null; theme: string | null };\n\nexport const issues: IssueRow[] = ${JSON.stringify(issuesData, null, 2)};\n`,
  );
  writeFileSync(
    resolve(base, 'venues.ts'),
    `import type { ReservableVenue } from '@parenting-newsletter/shared';\n\nexport const venues: ReservableVenue[] = ${JSON.stringify(venuesData, null, 2)};\n`,
  );

  console.log(`Wrote:\n  articles: ${articles.length}\n  issues: ${issues.length}\n  venues: ${venues.length}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
