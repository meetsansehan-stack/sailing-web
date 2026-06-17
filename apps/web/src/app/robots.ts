import type { MetadataRoute } from 'next';

// 크롤러 정책. 운영자·개발용 경로는 색인 제외.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/style', '/login'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
