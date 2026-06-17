import type { Metadata } from 'next';

// 이용약관 — 초안. ⚠️ 출시 전 1회 법무 검토 필요(CLAUDE.md).
// 핵심: 정보제공(큐레이션) 매체 = 콘텐츠 정확성·외부 링크 면책, 의료·법률 자문 아님.

export const metadata: Metadata = {
  title: '이용약관 — 세일링',
  description: '세일링 서비스 이용에 관한 약관입니다.',
};

const UPDATED = '2026년 6월 17일';

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-h3 font-bold text-ink">
        제{n}조 ({title})
      </h2>
      <div className="mt-3 space-y-3 text-body leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <article>
      <header className="border-b border-line pb-6">
        <h1 className="text-h2 font-bold text-ink sm:text-h1">이용약관</h1>
        <p className="mt-2 text-meta text-ink-3">시행일 {UPDATED}</p>
      </header>

      <Section n={1} title="목적">
        <p>
          본 약관은 세일링(이하 “회사”)이 제공하는 육아 정보 큐레이션 서비스(이하 “서비스”)의 이용
          조건과 회사·이용자의 권리·의무를 정함을 목적으로 합니다.
        </p>
      </Section>

      <Section n={2} title="서비스의 성격">
        <p>
          서비스는 공개된 출처의 육아 관련 정보를 선별·요약하여 제공하는 <strong className="text-ink">정보
          제공 매체</strong>입니다. 서비스가 제공하는 정보는 일반적 참고용이며,{' '}
          <strong className="text-ink">의료·법률·교육에 관한 전문가의 자문을 대체하지 않습니다.</strong>{' '}
          중요한 결정을 내리기 전에는 원문 및 관계 기관의 공식 안내를 직접 확인하시기 바랍니다.
        </p>
      </Section>

      <Section n={3} title="콘텐츠의 정확성과 책임의 한계">
        <p>
          회사는 정확하고 신뢰할 수 있는 정보를 제공하기 위해 노력하나, 정보의 완전성·정확성·최신성을
          보증하지 않습니다. 정책·행사·신청 일정 등은 변경될 수 있으므로 이용자는 원문 출처에서 최종
          내용을 확인할 책임이 있습니다. 정보의 이용으로 발생한 결과에 대해 회사는 고의 또는 중대한
          과실이 없는 한 책임을 지지 않습니다.
        </p>
      </Section>

      <Section n={4} title="외부 링크">
        <p>
          서비스는 외부 기관·매체의 원문으로 연결되는 링크를 포함합니다. 외부 사이트의 콘텐츠·운영·
          개인정보 처리에 대해 회사는 책임지지 않으며, 해당 사이트의 정책이 적용됩니다.
        </p>
      </Section>

      <Section n={5} title="지식재산권">
        <p>
          서비스의 선별·편집·요약·디자인 등 회사가 창작한 부분에 대한 권리는 회사에 귀속됩니다. 인용된
          원문 및 출처의 저작권은 각 권리자에게 있습니다. 이용자는 회사의 사전 동의 없이 서비스 콘텐츠를
          상업적으로 복제·배포할 수 없습니다.
        </p>
      </Section>

      <Section n={6} title="이용자의 의무">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>서비스의 정상적 운영을 방해하는 행위(과도한 자동 요청 등)</li>
          <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
          <li>법령 또는 본 약관에 위반되는 행위</li>
        </ul>
      </Section>

      <Section n={7} title="서비스의 변경·중단">
        <p>
          회사는 운영상·기술상 필요에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있으며, 이
          경우 사전에 서비스 내 공지합니다(긴급한 경우 사후 공지할 수 있습니다).
        </p>
      </Section>

      <Section n={8} title="개인정보의 보호">
        <p>
          회사는 이용자의 개인정보를 관계 법령과{' '}
          <a href="/privacy" className="text-blue underline underline-offset-2 hover:text-blue-600">
            개인정보처리방침
          </a>
          에 따라 보호합니다.
        </p>
      </Section>

      <Section n={9} title="준거법 및 관할">
        <p>
          본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련한 분쟁은 관계 법령이 정한 절차에
          따릅니다.
        </p>
      </Section>

      <Section n={10} title="약관의 변경">
        <p>
          회사는 필요 시 본 약관을 변경할 수 있으며, 변경 시 시행 최소 7일 전부터 서비스 내 공지합니다.
        </p>
      </Section>

      <p className="mt-10 text-meta text-ink-3">본 약관은 {UPDATED}부터 시행됩니다.</p>
    </article>
  );
}
