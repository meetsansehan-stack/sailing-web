// 제목 근접중복(near-dup) 판정 테스트.
// 러너 = Node 내장 node:test (새 의존성 0). 실행: `pnpm --filter @parenting-newsletter/shared test`
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTitle,
  titleSimilarity,
  isNearDuplicateTitle,
  TITLE_DUP_THRESHOLD,
} from './dedup.ts';

test('normalizeTitle: 말미 매체명·대괄호·공백·구두점 제거', () => {
  assert.equal(normalizeTitle('늘봄학교 전면 시행 - 베이비뉴스'), '늘봄학교전면시행');
  assert.equal(normalizeTitle('[단독] 늘봄학교 전면 시행'), '늘봄학교전면시행');
  assert.equal(normalizeTitle('늘봄학교(초1대상) 전면 시행'), '늘봄학교전면시행');
  assert.equal(normalizeTitle('늘봄학교, 전면 시행한다!'), '늘봄학교전면시행한다');
});

test('같은 사건 다른 매체(말미 매체명만 차이) → 근접중복', () => {
  const a = '2학기 늘봄학교 전면 시행, 초등 1학년부터 - 베이비뉴스';
  const b = '2학기 늘봄학교 전면 시행, 초등 1학년부터 | 연합뉴스';
  assert.ok(titleSimilarity(a, b) >= 0.9, `sim=${titleSimilarity(a, b)}`);
  assert.equal(isNearDuplicateTitle(a, b), true);
});

test('같은 사건 다른 표현(어순·조사 변화) → 근접중복(임계값 이상)', () => {
  const a = '초등 1학년 늘봄학교 전면 시행한다';
  const b = '늘봄학교 초등 1학년 전면 시행';
  assert.ok(titleSimilarity(a, b) >= TITLE_DUP_THRESHOLD, `sim=${titleSimilarity(a, b)}`);
});

test('서로 다른 사건 → 비중복(임계값 미만)', () => {
  const a = '늘봄학교 전면 시행, 초등 1학년부터';
  const b = '여름방학 무료 물놀이장 개장 안내';
  assert.ok(titleSimilarity(a, b) < TITLE_DUP_THRESHOLD, `sim=${titleSimilarity(a, b)}`);
  assert.equal(isNearDuplicateTitle(a, b), false);
});

test('같은 키워드 일부 공유하나 다른 기사 → 비중복', () => {
  // 둘 다 "초등"·"늘봄" 포함하지만 사건이 다름.
  const a = '초등 늘봄학교 신청 방법 안내';
  const b = '초등 입학준비물 체크리스트 공개';
  assert.ok(titleSimilarity(a, b) < TITLE_DUP_THRESHOLD, `sim=${titleSimilarity(a, b)}`);
});

test('빈 문자열·1글자 안전 처리', () => {
  assert.equal(titleSimilarity('', '무엇이든'), 0);
  assert.equal(titleSimilarity('가', '나'), 0);
  assert.equal(titleSimilarity('가', '가'), 1); // 정규화 동일 → 1
});

test('자기 자신과는 항상 1', () => {
  const t = '고교학점제 전면 도입, 무엇이 달라지나';
  assert.equal(titleSimilarity(t, t), 1);
});
