// isEventExpired 경계 동작 테스트 (SPEC §9 아카이브 라이프사이클).
// 러너 = Node 내장 node:test (새 의존성 0). 실행: `pnpm --filter @parenting-newsletter/shared test`
import test from 'node:test';
import assert from 'node:assert/strict';
import { isEventExpired, type Article } from './article.ts';

// 최소 유효 Article — 케이스별로 contentType·날짜만 덮어씀.
function makeArticle(overrides: Partial<Article>): Article {
  return {
    id: 'a1',
    title: 't',
    summary: 's',
    body: 'b',
    url: 'https://example.com',
    category: 'play',
    contentType: 'Event',
    issueDate: '2026-06-13',
    source: 'src',
    publishedAt: '2026-06-13',
    credibilityScore: 0.9,
    ...overrides,
  };
}

// 기준 시각 = 2026-06-13 10:00 KST (결정론적).
const now = new Date('2026-06-13T10:00:00+09:00');

test('종료일이 어제(=cutoff 오늘 00:00 도달) → 만료(숨김)', () => {
  const a = makeArticle({ eventEndDate: '2026-06-12' });
  assert.equal(isEventExpired(a, now), true);
});

test('더 과거에 끝난 행사 → 만료', () => {
  const a = makeArticle({ eventEndDate: '2026-06-01' });
  assert.equal(isEventExpired(a, now), true);
});

test('오늘 종료하는 행사 → 유지(버퍼 1일이라 내일 00:00까지 노출)', () => {
  const a = makeArticle({ eventEndDate: '2026-06-13' });
  assert.equal(isEventExpired(a, now), false);
});

test('미래 행사 → 유지', () => {
  const a = makeArticle({ eventStartDate: '2026-06-20' });
  assert.equal(isEventExpired(a, now), false);
});

test('다일 행사: 시작은 과거지만 종료일이 미래 → 유지(종료일 우선)', () => {
  const a = makeArticle({ eventStartDate: '2026-06-10', eventEndDate: '2026-06-15' });
  assert.equal(isEventExpired(a, now), false);
});

test('종료일 없으면 시작일로 판정: 시작일이 과거 → 만료', () => {
  const a = makeArticle({ eventStartDate: '2026-06-01' });
  assert.equal(isEventExpired(a, now), true);
});

test('비-Event 타입은 날짜가 과거여도 만료 없음', () => {
  const a = makeArticle({ contentType: 'Policy', eventStartDate: '2020-01-01' });
  assert.equal(isEventExpired(a, now), false);
});

test('날짜 미상 Event → 유지(임의로 숨기지 않음)', () => {
  const a = makeArticle({ contentType: 'Event' });
  assert.equal(isEventExpired(a, now), false);
});

test('cutoff 정확 경계: 종료일 다음날 00:00 KST = 만료(>= 비교)', () => {
  const a = makeArticle({ eventEndDate: '2026-06-12' });
  const atCutoff = new Date('2026-06-13T00:00:00+09:00');
  assert.equal(isEventExpired(a, atCutoff), true);
});

test('cutoff 1초 전 = 유지', () => {
  const a = makeArticle({ eventEndDate: '2026-06-12' });
  const justBefore = new Date('2026-06-12T23:59:59+09:00');
  assert.equal(isEventExpired(a, justBefore), false);
});

test('bufferDays=0이면 종료일 자정부터 즉시 만료', () => {
  const a = makeArticle({ eventEndDate: '2026-06-13' });
  assert.equal(isEventExpired(a, now, 0), true);
});
