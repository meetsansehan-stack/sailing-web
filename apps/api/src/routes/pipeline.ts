import { Hono } from 'hono';
import { runFullPipeline } from '../pipeline';

const app = new Hono();

// POST /api/pipeline/run - 전체 파이프라인 수동 트리거 (research→curation→writer→editor→hooking).
app.post('/run', async (c) => {
  let body: { date?: string } = {};
  try {
    body = await c.req.json().catch(() => ({}));
  } catch {
    // 빈 body 허용
  }

  const date = body.date ? new Date(body.date) : undefined;
  if (body.date && Number.isNaN(date?.getTime() ?? NaN)) {
    return c.json({ error: 'Invalid date' }, 400);
  }

  try {
    const result = await runFullPipeline(date);
    return c.json({
      issueDate: result.issueDate.toISOString().slice(0, 10),
      stopped: result.stopped,
      stages: result.stages,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: 'Pipeline failed', message }, 500);
  }
});

export default app;
