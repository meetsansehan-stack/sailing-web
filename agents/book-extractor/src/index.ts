import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateStructured, AGENT_MODELS } from '@parenting-newsletter/agents-core';
import { prisma } from '@parenting-newsletter/db';
import {
  BookExtractOutputSchema,
  BOOK_EXTRACT_JSON_SCHEMA,
  type BookExtractOutput,
} from '../schema';

function loadPrompt(): string {
  return readFileSync(resolve(__dirname, '..', 'prompt.md'), 'utf-8');
}

// 기존 시드와 동일한 id 규칙: "book-" + 공백 제거 제목.
function slugId(title: string): string {
  return 'book-' + title.replace(/\s+/g, '');
}

export type BookBuildOptions = { commit?: boolean };

export type BookBuildResult = {
  articleId: string;
  collection: string;
  collectionDate: string; // YYYY-MM
  extracted: BookExtractOutput['books'];
  created: string[]; // 신규 저장된 Book id
  skipped: string[]; // 이미 존재해 스킵된 id
  committed: boolean;
};

/**
 * 추천도서 목록 기사 한 건 → 개별 책 추출 + whyRecommended 초안 (SPEC §12).
 * commit=false(기본) = dry-run: 추출만 하고 DB 저장 안 함(검수용).
 * commit=true = 검수 후 저장: Book 행 생성(중복 id는 스킵, 멱등).
 */
export async function runBookExtraction(
  articleId: string,
  opts: BookBuildOptions = {},
): Promise<BookBuildResult> {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error(`기사 없음: ${articleId}`);
  if (article.category !== 'books') {
    console.warn(`⚠️ 기사 카테고리가 'books'가 아님(${article.category}) — 추천도서 목록 기사인지 확인하세요.`);
  }
  if (!article.body || article.body.trim().length < 50) {
    throw new Error(`기사 본문이 비었거나 너무 짧음: ${articleId} (writer 미완?)`);
  }

  const collectionDate = article.issueDate.toISOString().slice(0, 7); // YYYY-MM

  const userPrompt = [
    `기사 제목: ${article.title}`,
    `카테고리: ${article.category} / 출처: ${article.source}`,
    '',
    '본문:',
    article.body,
  ].join('\n');

  const { data } = await generateStructured<BookExtractOutput>({
    systemPrompt: loadPrompt(),
    userPrompt,
    outputSchema: BookExtractOutputSchema,
    outputJsonSchema: BOOK_EXTRACT_JSON_SCHEMA,
    allowedTools: [], // 본문을 직접 주므로 외부 도구 불필요
    model: AGENT_MODELS.writer,
  });

  const created: string[] = [];
  const skipped: string[] = [];

  if (opts.commit) {
    for (const b of data.books) {
      const id = slugId(b.title);
      const exists = await prisma.book.findUnique({ where: { id }, select: { id: true } });
      if (exists) {
        skipped.push(id);
        continue;
      }
      await prisma.book.create({
        data: {
          id,
          title: b.title,
          author: b.author,
          publisher: b.publisher ?? null,
          ageRange: b.ageRange,
          whyRecommended: b.whyRecommended,
          themes: b.themes,
          collection: data.collection,
          collectionDate,
          sourceArticleIds: [articleId],
          credibilityScore: article.credibilityScore || 0.8,
        },
      });
      created.push(id);
    }
  }

  return {
    articleId,
    collection: data.collection,
    collectionDate,
    extracted: data.books,
    created,
    skipped,
    committed: !!opts.commit,
  };
}
