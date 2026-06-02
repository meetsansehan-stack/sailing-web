/**
 * 초기 데이터 시드 — apps/web/src/data/*.ts 정적 모듈을 DB로 이관.
 *
 * 실행:
 *   1. .env에 DATABASE_URL + DIRECT_URL 설정
 *   2. cd packages/db && pnpm db:seed
 *
 * 안전성:
 *   - upsert 기반 (반복 실행해도 중복 생성 없음)
 *   - issue·article·venue 순서로 처리 (참조 무결성)
 *   - 트랜잭션 미사용 — Prisma 5에서 upsert는 개별 atomic이라 부분 실패 시 재실행 가능
 */

import { prisma } from '../src/client';
import { articles } from './data/articles';
import { issues } from './data/issues';
import { venues } from './data/venues';
// 데이터 스냅샷은 packages/db/scripts/dump-db.ts 로 DB에서 재생성 가능.

async function seedIssues() {
  console.log(`\n📰 Seeding ${issues.length} issues...`);
  for (const i of issues) {
    await prisma.dailyIssue.upsert({
      where: { issueDate: new Date(i.date) },
      update: {
        title: i.title,
        status: 'published', // 시드는 데모/로컬용 — 공개 상태로 (발행 게이트는 파이프라인 신규분에 적용)
        // theme/hookingCopy 등 V2 필드는 비워둠
      },
      create: {
        issueDate: new Date(i.date),
        title: i.title,
        status: 'published',
      },
    });
  }
  console.log(`   ✓ issues done`);
}

async function seedArticles() {
  console.log(`\n📄 Seeding ${articles.length} articles...`);
  for (const a of articles) {
    await prisma.article.upsert({
      where: { id: a.id },
      update: {
        title: a.title,
        summary: a.summary,
        body: a.body,
        url: a.url,
        category: a.category,
        contentType: a.contentType,
        mediaType: a.mediaType ?? null,
        durationMin: a.durationMin ?? null,
        source: a.source,
        publishedAt: new Date(a.publishedAt),
        credibilityScore: a.credibilityScore,
        issueDate: new Date(a.issueDate),
        eventStartDate: a.eventStartDate ? new Date(a.eventStartDate) : null,
        eventEndDate: a.eventEndDate ? new Date(a.eventEndDate) : null,
        deadline: a.deadline ? new Date(a.deadline) : null,
        tags: a.tags ?? [],
      },
      create: {
        id: a.id,
        title: a.title,
        summary: a.summary,
        body: a.body,
        url: a.url,
        category: a.category,
        contentType: a.contentType,
        mediaType: a.mediaType ?? null,
        durationMin: a.durationMin ?? null,
        source: a.source,
        publishedAt: new Date(a.publishedAt),
        credibilityScore: a.credibilityScore,
        issueDate: new Date(a.issueDate),
        eventStartDate: a.eventStartDate ? new Date(a.eventStartDate) : null,
        eventEndDate: a.eventEndDate ? new Date(a.eventEndDate) : null,
        deadline: a.deadline ? new Date(a.deadline) : null,
        tags: a.tags ?? [],
      },
    });
  }
  console.log(`   ✓ articles done`);
}

async function seedVenues() {
  console.log(`\n🏛  Seeding ${venues.length} venues...`);
  for (const v of venues) {
    await prisma.reservableVenue.upsert({
      where: { id: v.id },
      update: {
        name: v.name,
        type: v.type,
        ageRange: v.ageRange,
        entryMinAge: v.entryMinAge ?? null,
        region: v.region,
        reservationUrl: v.reservationUrl,
        reservationChannel: v.reservationChannel,
        operator: v.operator,
        pricing: v.pricing,
        schedule: v.schedule ?? null,
        description: v.description,
        credibilityScore: v.credibilityScore,
        tags: v.tags ?? [],
      },
      create: {
        id: v.id,
        name: v.name,
        type: v.type,
        ageRange: v.ageRange,
        entryMinAge: v.entryMinAge ?? null,
        region: v.region,
        reservationUrl: v.reservationUrl,
        reservationChannel: v.reservationChannel,
        operator: v.operator,
        pricing: v.pricing,
        schedule: v.schedule ?? null,
        description: v.description,
        credibilityScore: v.credibilityScore,
        tags: v.tags ?? [],
      },
    });
  }
  console.log(`   ✓ venues done`);
}

async function main() {
  console.log('🌱 Starting seed...');

  try {
    await seedIssues();
    await seedArticles();
    await seedVenues();

    console.log('\n✅ Seed completed successfully');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
