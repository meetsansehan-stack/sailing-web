import { cache } from 'react';
import type { Book } from '@parenting-newsletter/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';
const BOOKS_LIMIT = 500;

export const getAllBooks = cache(async (): Promise<Book[]> => {
  const res = await fetch(`${API_BASE}/api/books?limit=${BOOKS_LIMIT}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch books: ${res.status}`);
  }
  const data = (await res.json()) as { books: Book[] };
  return data.books;
});

export async function getBookById(id: string): Promise<Book | undefined> {
  const all = await getAllBooks();
  return all.find((b) => b.id === id);
}

export type BookCollection = {
  name: string;
  collectionDate: string;
  books: Book[];
};

// 컬렉션 단위로 묶기 (최신 컬렉션 먼저). 브라우즈 페이지의 섹션 단위.
export async function getBookCollections(): Promise<BookCollection[]> {
  const all = await getAllBooks();
  const map = new Map<string, BookCollection>();
  for (const b of all) {
    const existing = map.get(b.collection);
    if (existing) existing.books.push(b);
    else map.set(b.collection, { name: b.collection, collectionDate: b.collectionDate, books: [b] });
  }
  return Array.from(map.values()).sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));
}

// 특정 기사가 출처인 책들 (기사 상세 ↔ 컬렉션 역링크용).
export async function getBooksByArticle(articleId: string): Promise<Book[]> {
  const all = await getAllBooks();
  return all.filter((b) => b.sourceArticleIds.includes(articleId));
}
