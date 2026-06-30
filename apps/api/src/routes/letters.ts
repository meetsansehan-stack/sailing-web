import { Hono } from 'hono';
import { prisma } from '@parenting-newsletter/db';

const app = new Hono();

// GET /api/letters — 발송 완료 목록 (공개)
app.get('/', async (c) => {
  const letters = await prisma.letter.findMany({
    where: { sentAt: { not: null } },
    select: {
      slug: true, subject: true, previewText: true, sentAt: true, sentCount: true,
      items: { select: { category: true }, orderBy: { order: 'asc' } },
    },
    orderBy: { sentAt: 'desc' },
  });
  return c.json(letters);
});

// GET /api/letters/admin — 전체 목록 초안 포함 (adminAuth in index.ts)
app.get('/admin', async (c) => {
  const letters = await prisma.letter.findMany({
    select: {
      id: true, slug: true, subject: true, previewText: true,
      sentAt: true, sentCount: true, createdAt: true, updatedAt: true,
      items: { select: { category: true }, orderBy: { order: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return c.json(letters);
});

// GET /api/letters/admin/:id — 단일 레터 전체 (admin, 초안 포함)
app.get('/admin/:id', async (c) => {
  const { id } = c.req.param();
  const letter = await prisma.letter.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  if (!letter) return c.json({ error: 'Not found' }, 404);
  return c.json(letter);
});

// GET /api/letters/:slug — 단일 레터 + 아이템 (발송 완료만 공개)
app.get('/:slug', async (c) => {
  const { slug } = c.req.param();
  const letter = await prisma.letter.findUnique({
    where: { slug },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  if (!letter || !letter.sentAt) return c.json({ error: 'Not found' }, 404);
  return c.json(letter);
});

type ItemInput = {
  id?: string;
  order: number;
  category: string;
  title: string;
  subtitle?: string;
  body: string;
  quote?: string;
  url?: string;
  articleId?: string;
};

type LetterInput = {
  slug: string;
  subject: string;
  previewText?: string;
  editorNote?: string;
  sentAt?: string | null;
  items?: ItemInput[];
};

// POST /api/letters — 새 레터 생성 (adminAuth)
app.post('/', async (c) => {
  const body = await c.req.json<LetterInput>();
  if (!body.slug || !body.subject) {
    return c.json({ error: 'slug, subject 필수' }, 400);
  }
  try {
    const letter = await prisma.letter.create({
      data: {
        slug: body.slug,
        subject: body.subject,
        previewText: body.previewText ?? null,
        editorNote: body.editorNote ?? null,
        sentAt: body.sentAt ? new Date(body.sentAt) : null,
        items: body.items?.length
          ? { create: body.items.map((it) => ({
              order: it.order,
              category: it.category,
              title: it.title,
              subtitle: it.subtitle ?? null,
              body: it.body,
              quote: it.quote ?? null,
              url: it.url ?? null,
              articleId: it.articleId ?? null,
            })) }
          : undefined,
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    return c.json(letter, 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Unique constraint')) return c.json({ error: '이미 존재하는 slug' }, 409);
    throw e;
  }
});

// PATCH /api/letters/:id — 수정 (아이템 전체 교체, adminAuth)
app.patch('/:id', async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json<Partial<LetterInput>>();

  await prisma.$transaction(async (tx) => {
    await tx.letter.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.previewText !== undefined && { previewText: body.previewText }),
        ...(body.editorNote !== undefined && { editorNote: body.editorNote }),
        ...(body.sentAt !== undefined && { sentAt: body.sentAt ? new Date(body.sentAt) : null }),
      },
    });

    if (body.items !== undefined) {
      await tx.letterItem.deleteMany({ where: { letterId: id } });
      if (body.items.length) {
        await tx.letterItem.createMany({
          data: body.items.map((it) => ({
            letterId: id,
            order: it.order,
            category: it.category,
            title: it.title,
            subtitle: it.subtitle ?? null,
            body: it.body,
            quote: it.quote ?? null,
            url: it.url ?? null,
            articleId: it.articleId ?? null,
          })),
        });
      }
    }
  });

  const updated = await prisma.letter.findUnique({
    where: { id },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  return c.json(updated);
});

// DELETE /api/letters/:id (adminAuth)
app.delete('/:id', async (c) => {
  const { id } = c.req.param();
  await prisma.letter.delete({ where: { id } });
  return c.json({ ok: true });
});

export default app;
