import { Hono } from 'hono';

// V2 — 이메일 뉴스레터는 MVP 제외. Subscriber 모델도 미정의 상태.
// 라우트 본문은 501 Not Implemented로 통일. 모델·인프라 정해진 후 본문 채우기.

const app = new Hono();

const V2_NOTICE = {
  error: 'Not implemented',
  reason: 'Email newsletter is planned for V2. See CLAUDE.md "V2 후보" section.',
};

app.post('/', (c) => c.json(V2_NOTICE, 501));
app.delete('/:id', (c) => c.json(V2_NOTICE, 501));
app.patch('/:id', (c) => c.json(V2_NOTICE, 501));

export default app;
