'use client';

import { useEffect, useState } from 'react';

// ⚠️ 데모: 현재는 정적 콘텐츠. 추후 파이프라인(eventStartDate/deadline)·연령/지역 개인화가 이 데이터를 채움.
//    "내 아이 신청·마감 레이더" 컨셉 검증용 — 친근한 존대 톤(brand-voice.md §0·§2 2026-05-29 확정).

type Section = { h: string; b: string[] };
type Src = { l: string; u: string };
type Item = {
  when: string;
  type: 'action' | 'auto';
  title: string;
  teaser: string;
  sections: Section[];
  src: Src[];
};
type Seg = { title: string; sub: string; items: Item[] };

const DATA: Record<'kinder' | 'elem', Seg> = {
  kinder: {
    title: "유치원 입학, ‘처음학교로’ 일정 하나만 놓쳐도 한 해가 밀려요",
    sub: '2027년 3월 입학 기준 · 모집은 2026년 11월경이에요',
    items: [
      {
        when: '2026\n11월 초',
        type: 'action',
        title: '처음학교로 신청 (우선·일반모집)',
        teaser: '국공립·사립 대부분 온라인으로 신청하고 추첨해요.',
        sections: [
          {
            h: '한눈에',
            b: [
              '국공립·사립 대부분 <b>‘처음학교로’</b>로 신청·추첨해요 (유보통합포털로 통합되는 중)',
              '핵심은 딱 둘 — 추첨 <b>신청일</b> 챙기기 + 합격 후 <b>등록 마감</b> 놓치지 않기',
            ],
          },
          {
            h: '시기별로',
            b: [
              '<b>11월 초</b>: 우선모집 — 저소득·다자녀·국가보훈 등 해당되면 먼저 신청할 수 있어요',
              '<b>11월 중순~</b>: 일반모집 — 유치원마다 일정이 조금씩 달라요',
              '<b>추첨·발표</b>: 신청 며칠 뒤 모바일·PC로 확인해요',
            ],
          },
          {
            h: '챙기면 좋아요',
            b: [
              '여러 곳 지원은 되지만 등록은 한 곳 — 1·2·3지망 순위를 미리 정해두면 편해요',
              '지금은 ‘11월에 큰 일정이 있다’만 알아두셔도 충분해요 🙂',
            ],
          },
        ],
        src: [
          { l: '처음학교로 공식', u: 'https://www.go-firstschool.go.kr/' },
          { l: '유보통합포털', u: 'https://enter.childinfo.go.kr/icms/main/IntroPage.html' },
        ],
      },
      {
        when: '추첨\n직후',
        type: 'action',
        title: "합격 후 ‘등록’ — 가장 많이 놓치는 지점",
        teaser: "합격보다 ‘등록’에서 더 많이 놓쳐요. 마감 시각 주의!",
        sections: [
          {
            h: '흐름 한눈에',
            b: [
              '신청 → 추첨 → 합격 발표 → <b>등록</b> 순서예요',
              '떨어졌다고 끝이 아니에요 — 미등록 자리로 추가 모집·대기가 이어져요',
            ],
          },
          {
            h: '등록에서 주의할 점',
            b: [
              "합격해도 <b>정해진 기간에 ‘등록’</b>을 해야 자리가 확정돼요 (안 하면 자동 포기 처리)",
              '마감이 <b>자정이 아니라 오후 6시</b>인 경우가 많아요 — 퇴근하고 하려다 놓치기 쉬운 지점이에요',
              '여러 곳 합격했다면 등록은 한 곳만 — 나머지는 빨리 정리해 주면 다른 집에 자리가 돌아가요',
            ],
          },
          {
            h: '마음 편한 팁',
            b: [
              '추첨은 운이 섞여요. 1지망이 안 돼도 길은 여러 갈래라, 결과 나오는 날 너무 졸이지 않으셔도 괜찮아요 🙂',
            ],
          },
        ],
        src: [{ l: '처음학교로 — 이용안내', u: 'https://www.go-firstschool.go.kr/' }],
      },
      {
        when: '입학\n확정 후',
        type: 'action',
        title: "유아학비 지원 ‘변경 신청’",
        teaser: "유치원 다니면 받는 정부 지원. ‘변경 신청’ 한 번만 잊지 마세요.",
        sections: [
          {
            h: '한눈에',
            b: [
              '만 3~5세 누리과정 <b>유아학비</b> = 유치원 다니면 받는 정부 지원이에요',
              '금액(월): 국공립 10만 원 / 사립 28만 원 (+ 방과후과정비 국공립 5만·사립 7만)',
            ],
          },
          {
            h: '꼭 확인할 점',
            b: [
              '신청: 복지로(online.bokjiro.go.kr) 또는 주민센터',
              "<b>제일 자주 놓치는 부분</b> — 지금 어린이집 보육료나 양육수당을 받고 있다면, <b>유아학비로 ‘변경 신청’</b>을 해야 받을 수 있어요. 지난 달 분을 몰아 받는 소급은 안 되니 입학 시점에 바로 바꿔두세요",
              '국공립/사립에 따라 금액이 달라요',
            ],
          },
          {
            h: '우리 집 적용',
            b: [
              "자동으로 안 넘어가는 지원이라, 입학 확정되면 ‘변경 신청’을 체크리스트 1번에 두면 마음이 편해요",
            ],
          },
        ],
        src: [
          { l: '정부24 — 유아학비(누리과정) 지원', u: 'https://www.gov.kr/portal/service/serviceInfo/000000465790' },
          { l: '복지로', u: 'https://www.bokjiro.go.kr/' },
        ],
      },
    ],
  },
  elem: {
    title: "초등 입학, 3월이 아니라 ‘지금부터’ 챙기면 편해요",
    sub: '2027년 3월 입학 기준 · 신청·결정은 전년도 가을부터예요',
    items: [
      {
        when: '2026\n10~12월',
        type: 'action',
        title: '조기입학·입학연기 결정',
        teaser: '또래보다 1년 일찍/늦게? 이 시기에 정해요.',
        sections: [
          {
            h: '한눈에',
            b: [
              '또래보다 1년 일찍 보내거나(조기입학) 1년 늦추는(입학연기) 선택을 이 시기에 정해요',
              '학교가 정하지 않고 <b>보호자가 결정</b>하는 사항이에요',
            ],
          },
          {
            h: '시기·방법',
            b: [
              '<b>2026.10/1 ~ 12/31</b> 사이에 읍·면·동에 신청해요',
              '12/31이 지나면 방법(취학유예)이 달라지니, 고민 중이면 이 안에 결정하는 게 좋아요',
            ],
          },
          {
            h: '마음 편한 팁',
            b: ['정답이 있는 결정은 아니에요 — 아이 상황을 보고 천천히 정하셔도 충분해요 🙂'],
          },
        ],
        src: [{ l: '정부24 — 초등 조기입학·입학연기 안내', u: 'https://www.gov.kr/' }],
      },
      {
        when: '2026\n12월',
        type: 'auto',
        title: '취학통지서 받기',
        teaser: '따로 신청 안 해도 정부24·우편으로 와요.',
        sections: [
          {
            h: '흐름',
            b: [
              '12월에 정부24와 우편(주민센터)으로 <b>자동으로</b> 와요 — 따로 신청 안 해도 돼요',
              '온라인 발급·제출도 정부24에서 가능해요',
            ],
          },
          {
            h: '확인할 점',
            b: [
              '이사했다면 배정 학교가 바뀔 수 있어 한 번만 확인해 주세요',
              '예비소집 때 이 통지서를 가져가요',
            ],
          },
        ],
        src: [{ l: '정부24 — 취학통지서 온라인 발급', u: 'https://www.gov.kr/portal/service/serviceInfo/134200005008' }],
      },
      {
        when: '입학\n전',
        type: 'action',
        title: '4~6세 추가접종 완료 확인',
        teaser: '입학 전 4종 완료. 빠진 것만 채우면 돼요.',
        sections: [
          {
            h: '한눈에',
            b: ['입학 전 4~6세 추가접종 4종을 완료해야 해요 (DTaP·폴리오·MMR·일본뇌염)'],
          },
          {
            h: '챙길 점',
            b: [
              "완료 여부는 <b>‘예방접종도우미’</b>에서 확인할 수 있어요",
              '아직이면 보건소·위탁의료기관에서 <b>무료</b>로 맞을 수 있어요',
            ],
          },
          {
            h: '마음 편한 팁',
            b: ['대부분 영유아 때 거의 맞아둔 항목이라, 빠진 것만 채우면 돼요 🙂'],
          },
        ],
        src: [{ l: '예방접종도우미 — 입학생 예방접종 확인사업', u: 'https://nip.kdca.go.kr/irhp/infm/goVcntInfo.do?menuLv=1&menuCd=136' }],
      },
      {
        when: '2027\n1월',
        type: 'action',
        title: '예비소집 — 아이와 함께 꼭',
        teaser: '안전을 확인하는 제도라, 빠지면 학교에서 연락이 와요.',
        sections: [
          {
            h: '한눈에',
            b: ['입학 전 학교가 신입생을 직접 만나 확인하고 안내하는 자리예요 (2027년 1월 중)'],
          },
          {
            h: '왜 꼭 가야 해요?',
            b: [
              '아이의 <b>안전·소재</b>를 확인하는 제도라, 빠지면 학교에서 연락이 와요',
              '부득이 못 가면 미리 학교에 연락만 주면 돼요',
            ],
          },
          {
            h: '챙길 점',
            b: [
              '취학통지서 지참 + 아이와 함께 참석',
              '늘봄·돌봄 신청 안내를 이 자리에서 받는 경우가 많아요',
            ],
          },
        ],
        src: [{ l: '교육부 — 취학통지·예비소집 보도자료', u: 'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156731547' }],
      },
      {
        when: '2027\n1월 전후',
        type: 'action',
        title: '늘봄·돌봄 신청 (맞벌이 1순위)',
        teaser: '안내받는 즉시 신청. 자리는 일찍 차요.',
        sections: [
          {
            h: '한눈에',
            b: [
              '2026년부터 늘봄학교 = <b>전국 모든 초등·전 학년 누구나 이용</b> 가능해요',
              '초1~2는 성장·발달 맞춤 프로그램을 무료로 제공받아요',
            ],
          },
          {
            h: '챙길 점',
            b: [
              '신입생 신청은 보통 <b>1월 초 예비소집 전후</b>예요 (학교별로 달라요)',
              '늘봄(프로그램)과 돌봄(돌봄교실)은 신청이 다를 수 있어 둘 다 확인',
              '인기 강좌·돌봄 자리는 일찍 차요',
            ],
          },
          {
            h: '우리 집 적용',
            b: ['맞벌이라면 하원 공백과 직결되니, 안내받는 즉시 1순위로 챙기면 마음이 편해요'],
          },
        ],
        src: [{ l: '늘봄·방과후 — 초등돌봄교실 안내', u: 'https://www.afterschool.go.kr/intro/care/careInfo1s2.do' }],
      },
      {
        when: '입학\n전후',
        type: 'action',
        title: '입학준비금 신청',
        teaser: '신청해야 받는 돈! 서울 기준 20만 원이에요.',
        sections: [
          {
            h: '한눈에',
            b: [
              '입학준비금은 <b>신청해야 받는 돈</b>이에요',
              '서울 기준 1인당 20만 원 (의류·가방·신발·도서·문구·전자기기 등)',
            ],
          },
          {
            h: '챙길 점',
            b: [
              '금액·기간·주체가 지역마다 달라요 (교육청 + 구청 별도인 곳도 있어요)',
              '신청 기간이 한정이라 놓치면 소멸돼요',
              '카드·바우처 형태가 많아 사용기한을 확인하세요',
            ],
          },
          {
            h: '활용 팁',
            b: ['거주지 <b>교육청과 구청</b> 공지를 둘 다 확인하면 빠뜨림이 없어요'],
          },
        ],
        src: [{ l: '서울시교육청 — 입학준비금 신청', u: 'https://start.sen.go.kr/' }],
      },
    ],
  },
};

export default function RadarPage() {
  const [seg, setSeg] = useState<'kinder' | 'elem'>('kinder');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const data = DATA[seg];
  const highlight = data.items[0]; // 진통제: 지금 가장 먼저 챙길 것

  // 내 아이 설정 = 로컬 저장 (로컬-퍼스트). 재방문에도 유지.
  useEffect(() => {
    const s = localStorage.getItem('sailing.childStage');
    if (s === 'kinder' || s === 'elem') setSeg(s);
  }, []);
  const choose = (s: 'kinder' | 'elem') => {
    setSeg(s);
    setOpenKey(null);
    try {
      localStorage.setItem('sailing.childStage', s);
    } catch {
      /* localStorage 비활성 환경 무시 */
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* 1. 헤더 */}
      <p className="text-body font-semibold text-blue">🧭 미리 준비</p>
      <h1 className="mt-2 text-h2 font-bold leading-snug text-ink sm:text-h1">
        내 아이 입학, 놓치면 안 될 것만 미리
      </h1>
      <p className="mt-2 text-body text-ink-3">
        흩어진 신청·마감을 내 아이 기준으로 모아 미리 알려드려요.
      </p>

      {/* 2. 내 아이 설정 (개인화 진입 · 로컬 저장) */}
      <div className="mt-6 rounded-card border border-grey-200 bg-white p-4">
        <p className="text-body font-semibold text-ink-2">내 아이는 지금</p>
        <div className="mt-3 flex gap-2">
          {(
            [
              { id: 'kinder', emoji: '🐣', label: '유치원 입학 예정' },
              { id: 'elem', emoji: '🎒', label: '초등학교 입학 예정' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => choose(s.id)}
              className={`flex-1 rounded-card border px-4 py-3 text-body transition ${
                seg === s.id
                  ? 'border-blue-600 bg-blue-600 font-semibold text-white'
                  : 'border-grey-200 bg-white text-ink-2 hover:bg-grey-50'
              }`}
            >
              <span className="mr-1.5">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-small text-ink-3">
          🔒 이 선택은 기기에만 저장돼요 (서버로 보내지 않아요)
        </p>
      </div>

      {/* 3. 지금 가장 먼저 챙길 것 (긴급 강조) */}
      {highlight && (
        <section className="mt-8">
          <h2 className="mb-3 text-card-title font-bold text-ink">🔔 지금 가장 먼저 챙길 것</h2>
          <div className="rounded-card border-2 border-red bg-red-bg/60 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red px-2.5 py-0.5 text-micro font-bold text-white">
                {highlight.when.replace(/\n/g, ' ')}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-micro font-semibold text-red">
                가장 먼저
              </span>
            </div>
            <h3 className="mt-3 text-h3 font-bold text-ink">{highlight.title}</h3>
            <p className="mt-1 text-body text-ink-2">{highlight.teaser}</p>
            {highlight.sections[0] && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                {highlight.sections[0].b.map((b, bi) => (
                  <li
                    key={bi}
                    className="text-body text-ink-2 [&_b]:font-semibold [&_b]:text-ink"
                    dangerouslySetInnerHTML={{ __html: b }}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* 4. 전체 일정 */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-card-title font-bold text-ink">전체 일정</h2>
        <div className="flex gap-3 text-small text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-red" /> 직접 신청
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-blue" /> 자동
          </span>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="space-y-3">
        {data.items.map((it, i) => {
          const key = `${seg}-${i}`;
          const open = openKey === key;
          return (
            <div
              key={key}
              className="overflow-hidden rounded-card border border-grey-200 bg-white shadow-card"
            >
              <button
                onClick={() => setOpenKey(open ? null : key)}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                <div className="w-14 shrink-0 whitespace-pre-line pt-0.5 text-small font-bold leading-tight text-blue-600">
                  {it.when}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-micro font-semibold ${
                      it.type === 'action'
                        ? 'bg-red-bg text-red'
                        : 'bg-blue-50 text-blue'
                    }`}
                  >
                    {it.type === 'action' ? '직접 신청' : '자동'}
                  </span>
                  <h3 className="mt-2 text-card-title font-bold text-ink">{it.title}</h3>
                  <p className="mt-1 text-body text-ink-3">{it.teaser}</p>
                </div>
                <span
                  className={`shrink-0 pt-1 text-ink-3 transition ${open ? 'rotate-180' : ''}`}
                >
                  ▼
                </span>
              </button>

              {open && (
                <div className="border-t border-dashed border-grey-200 px-5 pb-5 pl-[4.75rem]">
                  {it.sections.map((s) => (
                    <div key={s.h}>
                      <h4 className="mt-4 text-body font-bold text-blue">{s.h}</h4>
                      <ul className="mt-1.5 list-disc space-y-1.5 pl-4">
                        {s.b.map((bullet, bi) => (
                          <li
                            key={bi}
                            className="text-body text-ink-2 [&_b]:font-semibold [&_b]:text-ink"
                            dangerouslySetInnerHTML={{ __html: bullet }}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="mt-4 border-t border-grey-100 pt-3 text-small text-ink-3">
                    <p className="mb-1.5 font-semibold text-blue">📎 출처 (직접 확인 가능)</p>
                    {it.src.map((s) => (
                      <a
                        key={s.u}
                        href={s.u}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block break-all text-blue-500 hover:underline"
                      >
                        {s.l} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. 알림 (progressive 로그인 CTA) */}
      <section className="mt-10 rounded-card border border-grey-200 bg-white p-6 text-center">
        <p className="text-card-title font-bold text-ink">마감, 놓칠까 걱정되시죠?</p>
        <p className="mt-1 text-body text-ink-3">
          로그인하면 내 아이 마감을 미리 알려드려요. <span className="text-ink-3">(준비중)</span>
        </p>
        <div className="mx-auto mt-4 flex max-w-xs flex-col gap-2">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-card bg-[#FEE500] px-4 py-2.5 text-body font-semibold text-[#3C1E1E] opacity-60"
          >
            카카오로 시작하기
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-card border border-grey-300 px-4 py-2.5 text-body font-semibold text-ink-2 opacity-60"
          >
            Google로 시작하기
          </button>
        </div>
        <p className="mt-3 text-small text-ink-3">
          로그인은 선택이에요 — 안 해도 모든 정보를 볼 수 있어요.
        </p>
      </section>

      {/* 6. 약속 */}
      <div className="mt-8 rounded-card bg-gradient-to-br from-blue-600 to-blue p-6 text-white">
        <p className="text-h3 font-bold">흩어진 신청·마감을 ‘내 아이 일정’ 하나로.</p>
        <p className="mt-2 text-body leading-relaxed text-blue-50">
          정확한 날짜는 보통 가을~겨울에 교육청·학교가 공지해요. Sailing이{' '}
          <b className="font-semibold text-white">내 동네·내 아이 기준</b>으로 미리 챙겨서, 놓치면
          손해 보는 것만 콕 알려드릴게요.
        </p>
      </div>
      <p className="mt-4 text-center text-small text-ink-3">
        ※ 데모 — 일정은 직전 학년도(2026학년도) 실제 기준. 2027학년도 정확 일정은 추후 공지 반영.
      </p>
    </div>
  );
}
