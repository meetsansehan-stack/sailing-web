const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // swcMinify: Next.js 15에서 제거됨 (기본 활성화)
  // 모노레포 워크스페이스 패키지는 raw TS로 import되므로 Next가 트랜스파일하도록 명시.
  // (apps/web는 런타임에 shared만 import — package.json deps 기준)
  transpilePackages: ['@parenting-newsletter/shared'],
};

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_WEB,
  // 소스맵 업로드 — SENTRY_AUTH_TOKEN 있을 때만 활성화 (CI/CD에서 설정)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // 소스맵을 번들에 포함시키지 않음 (업로드 후 삭제)
  hideSourceMaps: true,
  disableLogger: true,
});
