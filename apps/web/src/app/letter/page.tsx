// 세일링 레터 — 프로토타입 스텁. (이메일 뉴스레터는 V2, 현재는 자리만)
export default function LetterPage() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <p className="text-small font-medium tracking-wider text-blue-600">세일링 레터</p>
      <h1 className="mt-2 text-h2 font-bold text-ink sm:text-h1">
        매일 아침, 메일함으로 받는 육아 브리핑
      </h1>
      <p className="mt-3 text-body leading-relaxed text-ink-3">
        준비 중입니다. 곧 이메일로 그날의 큐레이션을 받아보실 수 있어요.
        <br />
        (프로토타입 — 구독 기능은 추후 연결)
      </p>
      <div className="mx-auto mt-8 flex max-w-md gap-2">
        <input
          type="email"
          disabled
          placeholder="이메일 주소 (준비 중)"
          className="flex-1 rounded-full border border-grey-200 bg-grey-50 px-4 py-2.5 text-body text-ink-3"
        />
        <button
          type="button"
          disabled
          className="rounded-full bg-grey-300 px-5 py-2.5 text-body font-semibold text-white"
        >
          구독
        </button>
      </div>
    </div>
  );
}
