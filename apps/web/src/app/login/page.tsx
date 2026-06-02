// 로그인 — 프로토타입 스텁. (소비자 계정은 MVP 불필요, Supabase Auth는 운영자 어드민용만)
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-center text-h2 font-bold text-ink">로그인</h1>
      <p className="mt-2 text-center text-body text-ink-3">(프로토타입 — 인증 추후 연결)</p>
      <div className="mt-8 space-y-3">
        <input
          type="email"
          disabled
          placeholder="이메일"
          className="w-full rounded-card border border-grey-200 bg-grey-50 px-4 py-3 text-body text-ink-3"
        />
        <input
          type="password"
          disabled
          placeholder="비밀번호"
          className="w-full rounded-card border border-grey-200 bg-grey-50 px-4 py-3 text-body text-ink-3"
        />
        <button
          type="button"
          disabled
          className="w-full rounded-btn bg-grey-900 px-4 py-3 text-body font-semibold text-white"
        >
          로그인
        </button>
      </div>
    </div>
  );
}
