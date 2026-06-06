import { Hono } from 'hono';
import { prisma } from '@parenting-newsletter/db';

const app = new Hono();

function serializeBook(b: {
  id: string;
  isbn: string | null;
  title: string;
  author: string;
  publisher: string | null;
  pubYear: number | null;
  ageRange: string;
  coverImageUrl: string | null;
  whyRecommended: string;
  themes: string[];
  collection: string;
  collectionDate: string;
  links: unknown;
  sourceArticleIds: string[];
  credibilityScore: number;
}) {
  return {
    id: b.id,
    isbn: b.isbn ?? undefined,
    title: b.title,
    author: b.author,
    publisher: b.publisher ?? undefined,
    pubYear: b.pubYear ?? undefined,
    ageRange: b.ageRange,
    coverImageUrl: b.coverImageUrl ?? undefined,
    whyRecommended: b.whyRecommended,
    themes: b.themes,
    collection: b.collection,
    collectionDate: b.collectionDate,
    links: b.links ?? undefined,
    sourceArticleIds: b.sourceArticleIds,
    credibilityScore: b.credibilityScore,
  };
}

// GET /api/books?collection=...&limit=200
app.get('/', async (c) => {
  const collection = c.req.query('collection');
  const limit = Math.min(Number(c.req.query('limit') || 200), 500);

  const where: Record<string, unknown> = {};
  if (collection) where.collection = collection;

  try {
    const books = await prisma.book.findMany({
      where,
      // 최신 컬렉션 먼저, 컬렉션 내에선 신뢰도순
      orderBy: [{ collectionDate: 'desc' }, { credibilityScore: 'desc' }, { title: 'asc' }],
      take: limit,
    });

    return c.json({
      books: books.map(serializeBook),
      total: books.length,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch books' }, 500);
  }
});

// GET /api/books/:id
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return c.json({ error: 'Book not found' }, 404);
    }
    return c.json({ book: serializeBook(book) });
  } catch (error) {
    return c.json({ error: 'Failed to fetch book' }, 500);
  }
});

export default app;
