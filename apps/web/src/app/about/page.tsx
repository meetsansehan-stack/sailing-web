import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 소개',
  description:
    '세일링은 만 3~9세 자녀를 둔 부모를 위해 매일 아침 신뢰할 수 있는 육아 정보를 큐레이션합니다. 오늘의 좌표부터, 먼 수평선까지.',
};

const CONTACT_EMAIL = 'with.sailing@gmail.com';

// 세일링 소개 — 무엇을·누구를 위해·어떻게·어떤 톤으로. 브랜드 보이스(친근한 존대, 죄책감 금지).
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl py-14">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-h1">
          ⛵
        </div>
        <p className="text-small font-medium tracking-wider text-blue-600">세일링이 궁금해요</p>
        <h1 className="mt-2 text-h2 font-bold text-ink sm:text-h1">오늘의 좌표부터, 먼 수평선까지</h1>
        <p className="mt-3 text-body leading-relaxed text-ink-3">
          매일 아침, 우리 아이에게 필요한 육아 정보를
          <br className="hidden sm:block" /> 믿을 수 있는 출처에서 골라 한눈에 보여드려요.
        </p>
      </div>

      <div className="mt-12 space-y-10">
        <Section title="이런 분을 위해 만들었어요">
          <p>
            만 3~9세, 어린이집·유치원부터 초등 저학년 자녀를 키우는 부모님이요. 챙길 정보는
            쏟아지는데 시간은 없죠. 정책·신청 마감·행사·발달 이야기까지, 흩어진 소식을 매일
            정리해 &ldquo;내가 놓친 건 없나&rdquo;를 5분이면 확인할 수 있게 해드려요.
          </p>
        </Section>

        <Section title="이렇게 골라요">
          <p>
            공공기관·공영방송·검증된 전문가·평론처럼 신뢰할 수 있는 출처만 봐요. 자극적인 제목,
            광고성 콘텐츠, 출처 불명의 소문은 담지 않아요. 사교육·또래 비교처럼 민감한 주제도
            피하지 않되, 경쟁이나 불안이 아니라 <strong className="text-ink">차분한 이해와 발달</strong>의
            눈으로 전해드려요.
          </p>
        </Section>

        <Section title="아이 정보는 받지 않아요">
          <p>
            아이의 생일·지역·발달 같은 정보는 <strong className="text-ink">서버에 저장하지 않아요.</strong>{' '}
            개인화가 필요한 계산은 기기 안에서만 이뤄지도록 설계했어요. 이메일 구독을 하셔도 받는 건
            메일 주소와 수신 동의뿐이에요. 자세한 내용은{' '}
            <Link href="/privacy" className="text-blue-600 underline underline-offset-2 hover:text-blue-700">
              개인정보처리방침
            </Link>
            에서 확인하실 수 있어요.
          </p>
        </Section>

        <Section title="아직 베타예요">
          <p>
            세일링은 지금 베타 단계예요. 부족한 점이 있다면 솔직하게 들려주세요. 여러분의 한마디가
            방향을 잡는 가장 좋은 나침반이 돼요.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[세일링 베타 피드백]')}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-btn bg-blue px-5 py-2.5 text-card-title font-semibold text-white transition hover:bg-blue-600"
          >
            ✍️ 피드백 보내기
          </a>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-h3 font-bold text-ink">{title}</h2>
      <div className="mt-2 text-body leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}
