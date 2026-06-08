import Link from 'next/link';
import { SUMMER } from '../data';

// 여름방학 준비 상세 — 입학(타임라인)과 달리 '순서'가 없는 정보라 블로그형 에디토리얼 레이아웃.
// 위→아래로 읽는 흐름 + 항목별 사진(placeholder, 소싱 보류 SPEC §10.6 ⓓ).

// 항목별 사진 자리 — 소싱 전까지 16:9 placeholder
function Photo({ emoji, caption }: { emoji: string; caption: string }) {
  return (
    <figure className="my-5 overflow-hidden rounded-card">
      <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 bg-gradient-to-br from-grey-100 to-grey-200 text-ink-3">
        <span className="text-4xl opacity-60">{emoji}</span>
        <span className="text-small">{caption}</span>
      </div>
    </figure>
  );
}

// 항목별 대표 이모지·사진 캡션 (제목 순서와 1:1)
const PHOTOS = [
  { emoji: '🏊', caption: '한강 물놀이장 (사진 준비중)' },
  { emoji: '⛲', caption: '동네 무료 물놀이터·바닥분수 (사진 준비중)' },
  { emoji: '📚', caption: '도서관 여름 프로그램 (사진 준비중)' },
  { emoji: '🔬', caption: '국립과천과학관 (사진 준비중)' },
];

export default function SummerPage() {
  return (
    <article className="mx-auto max-w-article">
      {/* 헤더 */}
      <Link href="/radar" className="text-small text-ink-3 hover:text-ink-2">
        ← 미리 준비
      </Link>
      <p className="mt-3 text-body font-semibold text-[#0E8FA8]">🌊 여름방학 준비</p>
      <h1 className="mt-2 text-h2 font-bold leading-snug text-ink sm:text-h1">{SUMMER.title}</h1>
      <p className="mt-3 text-body text-ink-3">{SUMMER.sub}</p>

      {/* 리드 */}
      <p className="mt-6 text-h3 font-medium leading-relaxed text-ink-2">
        무더운 여름, 멀리 가지 않아도 동네에서 즐길 거리가 많아요. 키즈카페·워터파크 같은 상업
        시설은 빼고, <b className="font-semibold text-ink">무료이거나 저렴한 공공 프로그램</b>만
        골라 한곳에 모았어요.
      </p>

      <Photo emoji="🌊" caption="2026 여름 공공 어린이 프로그램 (사진 준비중)" />

      {/* 항목별 에디토리얼 섹션 (순서 없이 위→아래로) */}
      {SUMMER.items.map((it, i) => (
        <section key={it.title} className="mt-10 border-t border-grey-100 pt-8">
          <h2 className="text-headline font-bold text-ink">{it.title}</h2>
          <p className="mt-2 text-body leading-relaxed text-ink-2">{it.teaser}</p>

          {PHOTOS[i] && <Photo emoji={PHOTOS[i].emoji} caption={PHOTOS[i].caption} />}

          {it.sections.map((s) => (
            <div key={s.h} className="mt-5">
              <h3 className="text-card-title font-bold text-[#0E8FA8]">{s.h}</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                {s.b.map((bullet, bi) => (
                  <li
                    key={bi}
                    className="text-body leading-relaxed text-ink-2 [&_b]:font-semibold [&_b]:text-ink"
                    dangerouslySetInnerHTML={{ __html: bullet }}
                  />
                ))}
              </ul>
            </div>
          ))}

          {/* 출처 */}
          <div className="mt-5 text-small text-ink-3">
            {it.src.map((s) => (
              <a
                key={s.u}
                href={s.u}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all text-[#0E8FA8] hover:underline"
              >
                📎 {s.l} ↗
              </a>
            ))}
          </div>
        </section>
      ))}

      {/* 약속 */}
      <div className="mt-12 rounded-card bg-gradient-to-br from-[#12B5A5] to-[#0E8FA8] p-6 text-white">
        <p className="text-h3 font-bold">상업 광고 없이, 공공 정보만.</p>
        <p className="mt-2 text-body leading-relaxed text-white/85">
          키즈카페·워터파크 같은 상업 시설은 빼고,{' '}
          <b className="font-semibold text-white">국공립·지자체·도서관</b>의 무료·저렴한 여름
          프로그램만 모았어요. 흩어져 찾기 번거로운 공공 정보를 한곳에서요.
        </p>
      </div>
      <p className="mt-4 text-center text-small text-ink-3">
        ※ 데모 — 2026 여름 실제 기준. 정확한 개장일·신청 일정은 각 기관 공지를 확인하세요.
      </p>
    </article>
  );
}
