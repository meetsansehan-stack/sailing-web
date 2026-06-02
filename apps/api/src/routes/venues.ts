import { Hono } from 'hono';
import { prisma } from '@parenting-newsletter/db';

const app = new Hono();

function serializeVenue(v: {
  id: string;
  name: string;
  type: string;
  ageRange: string;
  entryMinAge: number | null;
  region: string;
  reservationUrl: string;
  reservationChannel: string;
  operator: string;
  pricing: string;
  schedule: string | null;
  description: string;
  credibilityScore: number;
  tags: string[];
}) {
  return {
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
  };
}

// GET /api/venues?region=서울&type=museum&pricing=free&limit=50
app.get('/', async (c) => {
  const region = c.req.query('region');
  const type = c.req.query('type');
  const pricing = c.req.query('pricing');
  const limit = Math.min(Number(c.req.query('limit') || 50), 200);

  const where: Record<string, unknown> = {};
  // region은 첫 토큰 매칭 ("서울" → "서울 용산구"도 포함)
  if (region) where.region = { startsWith: region };
  if (type) where.type = type;
  if (pricing) where.pricing = pricing;

  try {
    const venues = await prisma.reservableVenue.findMany({
      where,
      orderBy: [{ credibilityScore: 'desc' }, { name: 'asc' }],
      take: limit,
    });

    return c.json({
      venues: venues.map(serializeVenue),
      total: venues.length,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch venues' }, 500);
  }
});

// GET /api/venues/:id
app.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const venue = await prisma.reservableVenue.findUnique({ where: { id } });
    if (!venue) {
      return c.json({ error: 'Venue not found' }, 404);
    }
    return c.json({ venue: serializeVenue(venue) });
  } catch (error) {
    return c.json({ error: 'Failed to fetch venue' }, 500);
  }
});

export default app;
