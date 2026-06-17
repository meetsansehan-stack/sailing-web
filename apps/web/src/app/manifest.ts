import type { MetadataRoute } from 'next';

// PWA·홈화면 추가용 웹 manifest. 아이콘은 app/icon.svg 재사용(any 용도).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '세일링 — 육아 정보 큐레이션',
    short_name: '세일링',
    description: '매일 아침, 우리 아이에게 필요한 육아 정보를 한눈에.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3182F6',
    lang: 'ko',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
