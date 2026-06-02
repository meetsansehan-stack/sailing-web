import type { Config } from 'tailwindcss';

/**
 * Sailing 디자인 시스템 토큰 (단일 소스)
 * = Toss Feed(toss.im/tossfeed) 계승 — 실측 CSS 기반.
 *   에디토리얼 매거진 결: 먹색 텍스트 중심 · 15px 본문 · LH 1.6 · 블루 절제(링크/라벨) · 작은 radius.
 * Feed에 없는 컴포넌트(버튼/인풋/아코디언/셀렉트)는 Toss DS(TDS) 폴백.
 * 폰트 'Toss Product Sans'는 비공개 → 무료 대체 Pretendard.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 포인트 — Toss Blue (Feed: 링크·라벨·포커스에 절제 사용)
        blue: {
          50: '#E8F3FF',
          100: '#C9E2FF',
          200: '#A9CDFF',
          300: '#90C2FF',
          400: '#5491F5',
          500: '#3182F6',
          DEFAULT: '#3182F6',
          600: '#1B64DA',
          700: '#1750B0', // active/pressed — hover(600)보다 한 단계 진함
        },
        // Toss 그레이스케일
        grey: {
          50: '#F9FAFB',
          100: '#F2F4F6',
          200: '#E5E8EB',
          300: '#D1D6DB',
          400: '#B0B8C1',
          500: '#8B95A1',
          600: '#6B7684',
          700: '#4E5968',
          800: '#333D4B',
          900: '#191F28',
        },
        // 의미색 (Feed 실측)
        red: { DEFAULT: '#F04452', bg: '#FFEEEE' },
        green: '#029359',
        // 시맨틱 별칭 — ink = Feed 에디토리얼 먹색 램프(중성 near-black)
        primary: '#3182F6',
        ink: {
          DEFAULT: '#17171C', // 헤드라인 먹색
          2: '#4E5968', // 본문 (grey-700)
          3: '#8B95A1', // 메타 (grey-500)
        },
        line: '#E5E8EB',
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          'Toss Product Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'sans-serif',
        ],
      },
      fontSize: {
        // Toss Feed 실측 스케일(px) — 본문 15, LH 1.6, weight 600 위주
        display: ['3rem', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '700' }], // 48
        h1: ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '700' }], // 36
        h2: ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '700' }], // 24
        h3: ['1.1875rem', { lineHeight: '1.4', fontWeight: '600' }], // 19
        headline: ['1.5rem', { lineHeight: '1.4', fontWeight: '600' }], // 24 — 카드/리스트 기본 제목(Toss Feed 실측). h2(24/700/1.3)와 구분: 더 가볍고 lh 넓음
        'card-title': ['1.0625rem', { lineHeight: '1.45', fontWeight: '600' }], // 17 — 버튼·섹션 소제목·featured 요약 등 강조 텍스트(이름과 달리 카드 제목 아님)
        body: ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }], // 15
        meta: ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }], // 13
        small: ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }], // 12
        micro: ['0.6875rem', { lineHeight: '1.3', fontWeight: '500' }], // 11 — 밀도용(캘린더 dot·미니칩)
      },
      borderRadius: {
        card: '1rem', // 16px — Feed 실측
        btn: '0.5rem', // 8px — Feed 실측
      },
      maxWidth: {
        container: '1120px', // Feed 실측 — 리스트/그리드 컨테이너
        article: '720px', // Feed 실측 — 아티클 리딩 칼럼(640~810 중간)
      },
      boxShadow: {
        card: '0 1px 3px rgba(23,23,28,0.04)',
        'card-hover': '0 6px 20px rgba(23,23,28,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
