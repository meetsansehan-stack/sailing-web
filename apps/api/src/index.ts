import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN_API,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
});

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';

const app = new Hono();

// CORS — 웹·모바일·외부 클라이언트 진입 허용
// CORS_ALLOWED_ORIGINS 환경변수에 콤마로 구분된 origin 리스트 지정 가능 (예: "https://example.com,https://app.example.com")
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',');
app.use(
  '/*',
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
import articlesRoute from './routes/articles';
import issuesRoute from './routes/issues';
import agentsRoute from './routes/agents';
import pipelineRoute from './routes/pipeline';
import venuesRoute from './routes/venues';
import booksRoute from './routes/books';
import subscribersRoute from './routes/subscribers';
import analyticsRoute from './routes/analytics';
import qaRoute from './routes/qa';
import lettersRoute from './routes/letters';

// 운영·뮤테이션 엔드포인트 = admin 인증(fail-closed). 비용 DoS·무단 트리거 차단.
// 라우트 마운트보다 먼저 등록해야 적용됨. 공개 GET·구독/분석 POST는 게이트 밖.
import { adminAuth } from './middleware/admin';
app.use('/api/pipeline/*', adminAuth);
app.use('/api/agents/*', adminAuth);
app.use('/api/qa/*', adminAuth);
app.use('/api/letters/admin', adminAuth);
app.use('/api/letters/admin/*', adminAuth);
app.use('/api/letters', async (c, next) => {
  if (c.req.method !== 'GET') return adminAuth(c, next);
  return next();
});
app.use('/api/letters/*', async (c, next) => {
  if (c.req.method !== 'GET') return adminAuth(c, next);
  return next();
});

app.route('/api/articles', articlesRoute);
app.route('/api/issues', issuesRoute);
app.route('/api/agents', agentsRoute);
app.route('/api/pipeline', pipelineRoute);
app.route('/api/venues', venuesRoute);
app.route('/api/books', booksRoute);
app.route('/api/subscribers', subscribersRoute);
app.route('/api/analytics', analyticsRoute);
app.route('/api/qa', qaRoute);
app.route('/api/letters', lettersRoute);

// 처리되지 않은 에러를 Sentry에 캡처
app.onError((err, c) => {
  Sentry.captureException(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// 직접 실행되면 (tsx watch / node) HTTP 서버 시작.
// API_DISABLE_LISTEN=1 이면 listen 생략(테스트/serverless에서 default export만 사용).
// 포트 우선순위: PORT(Railway 등 PaaS 주입) → API_PORT(로컬) → 3001.
if (process.env.API_DISABLE_LISTEN !== '1') {
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`[api] listening on http://localhost:${info.port}`);
  });

  // 데일리 파이프라인 크론 (PIPELINE_CRON_ENABLED=true 일 때만 활성)
  // KST 00:00 = UTC 15:00 전날 → "0 15 * * *"
  if (process.env.PIPELINE_CRON_ENABLED === 'true') {
    void (async () => {
      const cron = await import('node-cron');
      const { runFullPipeline } = await import('./pipeline');
      const { prisma } = await import('@parenting-newsletter/db');
      const runAndPublish = async (): Promise<boolean> => {
        const result = await runFullPipeline();
        const ds = result.issueDate.toISOString().slice(0, 10);
        console.log(`[cron] 파이프라인 완료 issueDate=${ds} stopped=${result.stopped}`);
        if (result.stopped) return false;

        const issue = await prisma.dailyIssue.findFirst({ where: { issueDate: result.issueDate } });
        if (!issue) { console.error('[cron] 이슈 레코드 없음 — 발행 건너뜀'); return true; }
        const count = await prisma.article.count({ where: { issueDate: result.issueDate } });
        if (count === 0) { console.warn('[cron] 기사 0건 — 발행 건너뜀'); return true; }
        if (issue.status === 'published') { console.log(`[cron] ${ds} 이미 published`); return true; }
        await prisma.dailyIssue.update({ where: { id: issue.id }, data: { status: 'published' } });
        console.log(`[cron] 자동 발행 완료: ${ds} (기사 ${count}건)`);
        return true;
      };

      const RETRY_DELAY_MS = 30 * 60 * 1000;

      cron.schedule('0 15 * * *', async () => {
        console.log('[cron] 데일리 파이프라인 시작 (KST 00:00)');
        let ok = false;
        try {
          ok = await runAndPublish();
        } catch (err) {
          console.error('[cron] 파이프라인/발행 실패', err);
        }
        if (!ok) {
          console.warn(`[cron] 실패 — ${RETRY_DELAY_MS / 60000}분 후 1회 재시도`);
          setTimeout(async () => {
            console.log('[cron] 재시도 시작');
            try {
              await runAndPublish();
            } catch (err) {
              console.error('[cron] 재시도 실패', err);
            }
          }, RETRY_DELAY_MS);
        }
      }, { timezone: 'UTC' });
      console.log('[cron] 데일리 파이프라인 스케줄 등록 완료 (매일 KST 00:00, 자동 발행 포함)');
    })();
  }
}

export default app;
