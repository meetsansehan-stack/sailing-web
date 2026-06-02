import { Hono } from 'hono';
import { runFactCheckForIssue } from '../factcheck';

const app = new Hono();

// POST /api/qa/run/:date - 해당 일자 기사들의 날짜를 원문 대조 검증 (qa v0, LLM 없음).
// 결과를 Article.dateCheck에 기록. 운영자 프리뷰에서 ✅/⚠️ 배지로 표시됨.
app.post('/run/:date', async (c) => {
  const date = c.req.param('date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return c.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, 400);
  }
  try {
    const result = await runFactCheckForIssue(date);
    return c.json(result);
  } catch (error) {
    return c.json({ error: 'Fact-check failed', detail: String(error) }, 500);
  }
});

export default app;
