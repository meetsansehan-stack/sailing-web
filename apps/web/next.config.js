/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: Next.js 15에서 제거됨 (기본 활성화)
  // 모노레포 워크스페이스 패키지는 raw TS로 import되므로 Next가 트랜스파일하도록 명시.
  // (apps/web는 런타임에 shared만 import — package.json deps 기준)
  transpilePackages: ['@parenting-newsletter/shared'],
};

module.exports = nextConfig;
