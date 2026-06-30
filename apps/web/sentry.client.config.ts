import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // 프로덕션에서만 에러 전송 (개발 중 노이즈 방지)
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
});
