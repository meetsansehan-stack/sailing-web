import { z } from 'zod';

// 추출된 개별 책. publisher는 본문에 없으면 생략(enrichment가 채움). isbn·표지·링크도 enrichment 담당.
export const BookExtractItemSchema = z.object({
  title: z.string(),
  author: z.string(),
  publisher: z.string().optional(),
  ageRange: z.string(), // "5-7" 형식 (만 나이)
  themes: z.array(z.string()),
  whyRecommended: z.string(), // 세일링 보이스 추천 이유
});

export const BookExtractOutputSchema = z.object({
  collection: z.string(), // 이 묶음의 컬렉션 이름
  books: z.array(BookExtractItemSchema),
});

export type BookExtractItem = z.infer<typeof BookExtractItemSchema>;
export type BookExtractOutput = z.infer<typeof BookExtractOutputSchema>;

// generateStructured outputJsonSchema (Zod와 동기 유지).
export const BOOK_EXTRACT_JSON_SCHEMA = {
  type: 'object',
  required: ['collection', 'books'],
  properties: {
    collection: { type: 'string', description: '컬렉션 이름 (기사 주제 반영)' },
    books: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'author', 'ageRange', 'themes', 'whyRecommended'],
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          publisher: { type: 'string' },
          ageRange: { type: 'string', description: '"5-7" 형식 만 나이' },
          themes: { type: 'array', items: { type: 'string' } },
          whyRecommended: { type: 'string', description: '세일링 보이스 추천 이유 2~3문장' },
        },
      },
    },
  },
} as const;
