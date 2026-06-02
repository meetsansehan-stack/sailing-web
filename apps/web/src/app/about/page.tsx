// 세일링 소개 — 프로토타입 스텁.
export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-h1">
        ⛵
      </div>
      <p className="text-small font-medium tracking-wider text-blue-600">세일링이 궁금해요</p>
      <h1 className="mt-2 text-h2 font-bold text-ink sm:text-h1">세일링을 소개합니다</h1>
      <p className="mt-3 text-body leading-relaxed text-ink-3">
        매일 아침, 우리 아이에게 필요한 육아 정보를 신뢰할 수 있는 출처에서 큐레이션합니다.
        <br />
        (프로토타입 — 소개 콘텐츠 추후 작성)
      </p>
    </div>
  );
}
