import type { Metadata } from 'next';

// 개인정보처리방침 — 실제 수집 데이터에 맞춘 초안.
// ⚠️ 출시 전 1회 법무 검토 필요(CLAUDE.md·PRIVACY.md).
// 채움: 위탁업체(Supabase·Vercel·Railway, 국외처리 고지)·보호책임자(한송희/대표, with.sailing@gmail.com).
// 데이터 사실: 서버=부모 이메일·동의·익명 anonId·익명 분석만. 아동 PII(생일·지역·발달·진단)=0(로컬-퍼스트).

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '세일링이 수집하는 개인정보 항목·목적·보유기간과 이용자의 권리를 안내합니다.',
};

const UPDATED = '2026년 6월 17일';

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-h3 font-bold text-ink">
        {n}. {title}
      </h2>
      <div className="mt-3 space-y-3 text-body leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article>
      <header className="border-b border-line pb-6">
        <h1 className="text-h2 font-bold text-ink sm:text-h1">개인정보처리방침</h1>
        <p className="mt-2 text-meta text-ink-3">시행일 {UPDATED}</p>
      </header>

      <p className="mt-6 text-body leading-relaxed text-ink-2">
        세일링(이하 “회사”)은 「개인정보 보호법」 등 관계 법령을 준수하며, 이용자의 개인정보를
        최소한으로 수집·이용합니다. 회사는 <strong className="text-ink">아이(자녀)의 개인정보를 서버에
        저장하지 않는 것</strong>을 핵심 원칙으로 합니다. 연령·지역 등 개인화에 쓰이는 자녀 정보는
        이용자의 기기에만 저장되며 회사 서버로 전송되지 않습니다.
      </p>

      <Section n={1} title="수집하는 개인정보 항목">
        <p>회사는 서비스 제공에 꼭 필요한 최소한의 정보만 수집합니다.</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-ink">이메일 구독 시</strong>: 이메일 주소, 수신 동의 여부 및 동의
            시각, 유입 경로(어느 화면에서 구독했는지)
          </li>
          <li>
            <strong className="text-ink">서비스 이용 과정에서 자동 생성·수집</strong>: 익명 기기
            식별자(무작위 난수, 신원과 연결되지 않음), 방문 화면 경로, 버튼 노출·클릭 등 익명 이용
            기록
          </li>
        </ul>
        <p>
          회사는 자녀의 생년월일·지역·발달·진단 등 <strong className="text-ink">민감정보를 서버에
          수집하지 않습니다.</strong> 해당 정보가 개인화 기능에 쓰이는 경우 전적으로 이용자 기기 내에만
          저장됩니다.
        </p>
      </Section>

      <Section n={2} title="개인정보의 수집·이용 목적">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>이메일: 큐레이션 소식(뉴스레터) 발송, 수신 동의 관리, 해지 처리</li>
          <li>익명 이용 기록: 서비스 개선을 위한 통계 분석(개인을 식별하지 않는 집계 형태)</li>
        </ul>
      </Section>

      <Section n={3} title="보유 및 이용기간">
        <p>
          수집한 개인정보는 수집·이용 목적이 달성되거나 이용자가 구독을 해지하면 지체 없이 파기합니다.
          단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>이메일·구독 정보: 구독 해지 시까지(해지 즉시 파기)</li>
          <li>익명 이용 기록: 통계 목적 달성에 필요한 기간</li>
        </ul>
      </Section>

      <Section n={4} title="개인정보의 제3자 제공">
        <p>회사는 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 법령에 근거한 요청이 있는 경우는 예외로 합니다.</p>
      </Section>

      <Section n={5} title="개인정보 처리의 위탁">
        <p>
          회사는 안정적인 서비스 운영을 위해 아래와 같이 개인정보 처리를 위탁할 수 있으며, 수탁자가
          관계 법령을 준수하도록 관리·감독합니다.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            클라우드 인프라·데이터베이스·인증: Supabase, Inc. (데이터베이스·인증), Vercel, Inc. (웹
            호스팅), Railway Corp. (API 호스팅) — 각 사의 서버 위치에 따라 개인정보가 국외(미국 등)에서
            처리·보관될 수 있습니다.
          </li>
          <li>
            이메일 발송: 현재 자체 발송 전 단계로 외부 발송 대행사를 이용하지 않습니다. 도입 시 본
            방침을 갱신하여 고지합니다.
          </li>
        </ul>
      </Section>

      <Section n={6} title="만 14세 미만 아동의 개인정보">
        <p>
          본 서비스는 만 14세 이상 보호자(부모)를 대상으로 합니다. 회사는 만 14세 미만 아동으로부터
          개인정보를 수집하지 않습니다. 만약 만 14세 미만 아동의 개인정보가 법정대리인의 동의 없이
          수집된 사실이 확인되면 지체 없이 파기합니다. 자녀(아동)에 관한 정보는 개인화 기능을 위해
          이용자 기기에만 저장되며 서버로 전송·수집되지 않습니다.
        </p>
      </Section>

      <Section n={7} title="이용자 및 법정대리인의 권리">
        <p>
          이용자는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요구할 수 있습니다. 이메일 구독은
          뉴스레터 내 해지 링크 또는 아래 연락처를 통해 즉시 해지할 수 있습니다.
        </p>
      </Section>

      <Section n={8} title="쿠키 및 로컬 저장소">
        <p>
          회사는 서비스 이용 분석과 개인화를 위해 이용자 기기의 로컬 저장소(localStorage)에 익명
          식별자 및 설정값을 저장할 수 있습니다. 이용자는 브라우저 설정을 통해 저장을 거부하거나 삭제할
          수 있으며, 이 경우 일부 기능 이용이 제한될 수 있습니다.
        </p>
      </Section>

      <Section n={9} title="개인정보 보호책임자">
        <p>
          개인정보 처리에 관한 문의·불만·피해 구제는 아래로 연락해 주시기 바랍니다.
        </p>
        <ul className="list-none space-y-1.5">
          <li>개인정보 보호책임자: 한송희 / 대표</li>
          <li>연락처: with.sailing@gmail.com</li>
        </ul>
      </Section>

      <Section n={10} title="고지의 의무">
        <p>
          본 방침의 내용 추가·삭제·수정이 있을 경우 시행 최소 7일 전부터 서비스 내 공지를 통해 안내합니다.
        </p>
      </Section>

      <p className="mt-10 text-meta text-ink-3">본 방침은 {UPDATED}부터 시행됩니다.</p>
    </article>
  );
}
