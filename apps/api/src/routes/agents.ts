import { Hono } from 'hono';
import { prisma } from '@parenting-newsletter/db';
import { runResearch } from '@parenting-newsletter/agent-research';

const app = new Hono();

const VALID_AGENTS = new Set(['research', 'curation', 'writer', 'editor', 'hooking']);
const VALID_STATUS = new Set(['pending', 'processing', 'success', 'failed']);

// POST /api/agents/research/run - 리서치 에이전트 수동 트리거.
// curation/editor/hooking은 후속 세션에 추가.
app.post('/research/run', async (c) => {
  let body: { date?: string; categories?: string[] } = {};
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
    const { runResearch } = await import('@parenting-newsletter/agent-research');
    const result = await runResearch({ date, categories: body.categories as never });
    return c.json({
      logId: result.logId,
      processingTimeMs: result.processingTimeMs,
      candidateCount: result.output.articles.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: 'Research agent failed', message }, 500);
  }
});

// GET /api/agents/:name/logs?status=success&issueDate=2026-05-12&limit=50
app.get('/:name/logs', async (c) => {
  const name = c.req.param('name');

  if (!VALID_AGENTS.has(name)) {
    return c.json(
      { error: `Unknown agent. Expected one of: ${[...VALID_AGENTS].join(', ')}` },
      400,
    );
  }

  const statusFilter = c.req.query('status');
  const issueDateStr = c.req.query('issueDate');
  const limit = Math.min(Number(c.req.query('limit') || 50), 200);

  const where: Record<string, unknown> = { agentName: name };

  if (statusFilter) {
    if (!VALID_STATUS.has(statusFilter)) {
      return c.json({ error: 'Invalid status' }, 400);
    }
    where.status = statusFilter;
  }

  if (issueDateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDateStr)) {
      return c.json({ error: 'Invalid issueDate format. Use YYYY-MM-DD.' }, 400);
    }
    where.issue = { issueDate: new Date(issueDateStr) };
  }

  try {
    const logs = await prisma.agentLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        agentName: true,
        status: true,
        articleId: true,
        errorMessage: true,
        processingTimeMs: true,
        createdAt: true,
        issue: { select: { issueDate: true } },
      },
    });

    return c.json({
      logs: logs.map((l) => ({
        id: l.id,
        agentName: l.agentName,
        status: l.status,
        articleId: l.articleId ?? undefined,
        errorMessage: l.errorMessage ?? undefined,
        processingTimeMs: l.processingTimeMs ?? undefined,
        issueDate: l.issue.issueDate.toISOString().slice(0, 10),
        createdAt: l.createdAt.toISOString(),
      })),
      total: logs.length,
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch logs' }, 500);
  }
});

export default app;
