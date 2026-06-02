'use client';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-card shadow-card">
          <h4 className="text-ink-2 text-meta font-semibold mb-2">총 구독자</h4>
          <p className="text-h1 font-bold text-ink">0</p>
        </div>
        <div className="bg-white p-6 rounded-card shadow-card">
          <h4 className="text-ink-2 text-meta font-semibold mb-2">오늘 발행</h4>
          <p className="text-h1 font-bold text-ink">-</p>
        </div>
        <div className="bg-white p-6 rounded-card shadow-card">
          <h4 className="text-ink-2 text-meta font-semibold mb-2">평균 오픈율</h4>
          <p className="text-h1 font-bold text-ink">-</p>
        </div>
        <div className="bg-white p-6 rounded-card shadow-card">
          <h4 className="text-ink-2 text-meta font-semibold mb-2">평균 클릭율</h4>
          <p className="text-h1 font-bold text-ink">-</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-card shadow-card">
        <h3 className="text-h2 font-bold mb-4">최근 발행 이력</h3>
        <p className="text-ink-2">발행 이력이 없습니다.</p>
      </div>
    </div>
  );
}
