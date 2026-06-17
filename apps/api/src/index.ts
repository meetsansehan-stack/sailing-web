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

// 운영·뮤테이션 엔드포인트 = admin 인증(fail-closed). 비용 DoS·무단 트리거 차단.
// 라우트 마운트보다 먼저 등록해야 적용됨. 공개 GET·구독/분석 POST는 게이트 밖.
import { adminAuth } from './middleware/admin';
app.use('/api/pipeline/*', adminAuth);
app.use('/api/agents/*', adminAuth);
app.use('/api/qa/*', adminAuth);

app.route('/api/articles', articlesRoute);
app.route('/api/issues', issuesRoute);
app.route('/api/agents', agentsRoute);
app.route('/api/pipeline', pipelineRoute);
app.route('/api/venues', venuesRoute);
app.route('/api/books', booksRoute);
app.route('/api/subscribers', subscribersRoute);
app.route('/api/analytics', analyticsRoute);
app.route('/api/qa', qaRoute);

// 직접 실행되면 (tsx watch / node) HTTP 서버 시작.
// API_DISABLE_LISTEN=1 이면 listen 생략(테스트/serverless에서 default export만 사용).
// 포트 우선순위: PORT(Railway 등 PaaS 주입) → API_PORT(로컬) → 3001.
if (process.env.API_DISABLE_LISTEN !== '1') {
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`[api] listening on http://localhost:${info.port}`);
  });
}

export default app;
