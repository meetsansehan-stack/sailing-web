import type { Metadata } from 'next';
import Link from 'next/link';
import { Arvo } from 'next/font/google';
import { WeeklyHero } from '@/src/components/WeeklyHero';
import { CalendarGate } from '@/src/components/CalendarGate';
import { MainContainer } from '@/src/components/MainContainer';
import { MobileNav } from '@/src/components/MobileNav';
import AnalyticsTracker from '@/src/components/AnalyticsTracker';
import MicroSurvey from '@/src/components/MicroSurvey';
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
  { href: '/radar', label: '미리 준비' },
  { href: '/collections', label: '세일링 책장' },
  { href: '/letter', label: '세일링 레터' },
];

const MOBILE_NAV = [
  { href: '/', label: '홈' },
  { href: '/radar', label: '미리 준비' },
  { href: '/collections', label: '세일링 책장' },
  { href: '/letter', label: '세일링 레터' },
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

// 문의·피드백 접점. 베타 동안은 전용 메일을 직접 노출(폼은 후속).
// 도메인 확보 후 hello@세일링도메인으로 교체 가능 — [[project_ops_account_convention]].
const CONTACT_EMAIL = 'with.sailing@gmail.com';
const FEEDBACK_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[세일링 베타 피드백]')}`;

// 사업자 정보 — 정보통신망법·전자상거래법 표기. 푸터 하단 노출.
const BIZ = {
  name: '산세한 (Sansehan)',
  owner: '한송희',
  regNo: '733-23-02000',
  address: '서울특별시 송파구 법원로8길 8 문정역 2차 SK V1 408호',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white">
        <AnalyticsTracker />
        <MicroSurvey />
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <nav className="max-w-container mx-auto px-5 sm:px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center">
            {/* 좌측: ⛵ 아이콘 + 말풍선 (데스크탑) / 아이콘만 (모바일) */}
            <div className="flex items-center">
              <Link href="/about" className="group flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-lg">
                  ⛵
                </span>
                <span className="relative hidden rounded-card bg-grey-100 px-3 py-1.5 text-small font-medium text-ink-2 transition group-hover:bg-grey-200 md:inline-block">
                  세일링이 궁금해요
                  <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-grey-100 transition group-hover:bg-grey-200" />
                </span>
              </Link>
            </div>

            {/* 중앙: 로고 */}
            <Link
              href="/"
              className={`${arvo.className} text-[1.8rem] font-bold leading-none tracking-tight text-black`}
            >
              Sailing
            </Link>

            {/* 우측: 데스크탑 메뉴 + 로그인 / 모바일 햄버거 */}
            <div className="flex items-center justify-end gap-1 text-body">
              <div className="hidden items-center gap-1 md:flex">
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
              <MobileNav items={MOBILE_NAV} />
            </div>
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
                <div className="mt-4 space-y-1.5 text-small text-ink-2">
                  <p>
                    문의:{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-ink">
                      {CONTACT_EMAIL}
                    </a>
                  </p>
                  <a
                    href={FEEDBACK_MAILTO}
                    className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
                  >
                    ✍️ 베타 피드백 보내기
                  </a>
                </div>
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
            <div className="mt-8 space-y-1 border-t pt-6 text-small text-ink-3">
              <p className="flex flex-wrap gap-x-3 gap-y-1">
                <span>상호 {BIZ.name}</span>
                <span>대표 {BIZ.owner}</span>
                <span>사업자등록번호 {BIZ.regNo}</span>
              </p>
              <p>주소 {BIZ.address}</p>
              <p>
                문의{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2 hover:text-ink">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="pt-2">&copy; 2026 Sailing. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
