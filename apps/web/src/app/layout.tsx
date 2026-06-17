import type { Metadata } from 'next';
import Link from 'next/link';
import { Arvo } from 'next/font/google';
import { WeeklyHero } from '@/src/components/WeeklyHero';
import { CalendarGate } from '@/src/components/CalendarGate';
import { MainContainer } from '@/src/components/MainContainer';
import { MobileNav } from '@/src/components/MobileNav';
import AnalyticsTracker from '@/src/components/AnalyticsTracker';
import './globals.css';

// 로고 워드마크 전용 폰트 (라틴 전용 → 영문 "Sailing"에 적용)
const arvo = Arvo({ subsets: ['latin'], weight: '700', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_DESC = '매일 아침, 우리 아이에게 필요한 육아 정보를 한눈에.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '세일링 — 육아 정보 큐레이션',
    template: '%s — 세일링', // 하위 페이지가 title 문자열만 주면 자동으로 " — 세일링" 붙음
  },
  description: SITE_DESC,
  authors: [{ name: '세일링 팀' }],
  applicationName: '세일링',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: '세일링',
    locale: 'ko_KR',
    url: SITE_URL,
    title: '세일링 — 육아 정보 큐레이션',
    description: SITE_DESC,
  },
  twitter: {
    card: 'summary_large_image',
    title: '세일링 — 육아 정보 큐레이션',
    description: SITE_DESC,
  },
};

const NAV = [
  { href: '/', label: '최신 뉴스' },
  { href: '/radar', label: '미리 준비' },
  { href: '/collections', label: '세일링 책장' },
  { href: '/reservations', label: '예약 정보' },
];

const FOOTER_SERVICE = [
  { href: '/', label: '홈' },
  { href: '/issues', label: '아카이브' },
  { href: '/collections', label: '세일링 책장' },
  { href: '/reservations', label: '예약' },
  { href: '/letter', label: '세일링 레터' },
];

const FOOTER_INFO = [
  { href: '/about', label: '서비스 소개' },
  { href: '/privacy', label: '개인정보처리방침' },
  { href: '/terms', label: '이용약관' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white">
        <AnalyticsTracker />
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <nav className="relative max-w-container mx-auto px-5 sm:px-6 h-[80px] flex items-center justify-between gap-4">
            {/* 좌측: 소개 말풍선 + 세일링 레터 */}
            <div className="hidden items-center gap-3 sm:flex">
              <Link href="/about" className="group flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-lg">
                  ⛵
                </span>
                <span className="relative rounded-card bg-grey-100 px-3 py-1.5 text-small font-medium text-ink-2 transition group-hover:bg-grey-200">
                  세일링이 궁금해요
                  <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-grey-100 transition group-hover:bg-grey-200" />
                </span>
              </Link>
              <Link
                href="/letter"
                className="rounded-full px-3 py-1.5 text-body font-medium text-ink-2 transition hover:bg-grey-100"
              >
                세일링 레터
              </Link>
            </div>

            {/* 중앙: 로고 */}
            <Link
              href="/"
              className={`${arvo.className} absolute left-1/2 -translate-x-1/2 text-h1 font-bold leading-none tracking-tight text-black`}
            >
              Sailing
            </Link>

            {/* 우측(데스크탑): 메뉴 + 로그인(면 버튼) — 모바일은 햄버거로 대체 */}
            <div className="ml-auto hidden items-center gap-1 text-body md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 font-medium text-ink-2 transition hover:bg-grey-100"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="ml-2 rounded-full bg-grey-900 px-4 py-1.5 font-semibold text-white transition hover:bg-grey-700"
              >
                로그인
              </Link>
            </div>

            {/* 우측(모바일 <md): 햄버거 드롭다운 */}
            <MobileNav items={NAV} />
          </nav>
        </header>
        {/* GNB 하단 전폭 배너 — 이번 주 키데이트 (collapse/expand). 날짜 맥락 경로(미리 준비·예약 정보) 상단에서만 노출 */}
        <CalendarGate>
          <WeeklyHero />
        </CalendarGate>
        <MainContainer>{children}</MainContainer>
        <footer className="bg-white border-t mt-12">
          <div className="max-w-container mx-auto px-5 sm:px-6 py-10">
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <p className={`${arvo.className} text-h3 font-bold text-black`}>Sailing</p>
                <p className="mt-2 text-body text-ink-3">
                  매일 아침, 우리 아이에게 필요한
                  <br />
                  육아 정보를 한눈에.
                </p>
              </div>
              <div>
                <p className="mb-3 text-small font-bold tracking-wider text-ink-3">서비스</p>
                <ul className="space-y-2 text-body text-ink-2">
                  {FOOTER_SERVICE.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="hover:text-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-small font-bold tracking-wider text-ink-3">정보</p>
                <ul className="space-y-2 text-body text-ink-2">
                  {FOOTER_INFO.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="hover:text-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-6 text-small text-ink-3">
              <p>&copy; 2026 Sailing. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
