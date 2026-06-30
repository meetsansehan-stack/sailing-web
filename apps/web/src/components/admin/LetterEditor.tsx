'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// 아이의 항해 기본 섹션명 (자유 입력 가능)
const CATEGORY_SUGGESTIONS = [
  '손과 감각',
  '관계와 언어',
  '세상과 미래',
  '뇌와 실패',
  '놀이와 자연',
];

type ItemDraft = {
  _key: string; // 로컬 식별자
  id?: string;
  order: number;
  category: string;
  title: string;
  subtitle: string;
  body: string;
  quote: string;
  url: string;
  articleId: string;
};

type InitialLetter = {
  id: string;
  slug: string;
  subject: string;
  previewText: string | null;
  editorNote: string | null;
  sentAt: string | null;
  items: Array<{
    id: string;
    order: number;
    category: string;
    title: string;
    subtitle: string | null;
    body: string;
    quote: string | null;
    url: string | null;
    articleId: string | null;
  }>;
};

type Props = {
  token: string;
  initial?: InitialLetter;
};

type Tab = 'write' | 'preview';

let keyCounter = 0;
function newKey() { return `item-${++keyCounter}`; }

function blankItem(order: number): ItemDraft {
  return { _key: newKey(), order, category: '', title: '', subtitle: '', body: '', quote: '', url: '', articleId: '' };
}

export default function LetterEditor({ token, initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial;

  const [tab, setTab] = useState<Tab>('write');
  const [slug, setSlug] = useState(initial?.slug ?? new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [previewText, setPreviewText] = useState(initial?.previewText ?? '');
  const [editorNote, setEditorNote] = useState(initial?.editorNote ?? '');
  const [sentAt, setSentAt] = useState(initial?.sentAt ? initial.sentAt.slice(0, 10) : '');
  const [items, setItems] = useState<ItemDraft[]>(
    initial?.items.length
      ? initial.items.map((it) => ({
          _key: newKey(),
          id: it.id,
          order: it.order,
          category: it.category,
          title: it.title,
          subtitle: it.subtitle ?? '',
          body: it.body,
          quote: it.quote ?? '',
          url: it.url ?? '',
          articleId: it.articleId ?? '',
        }))
      : [blankItem(0)]
  );
  const [openItem, setOpenItem] = useState<string>(items[0]._key);
  const [previewHtml, setPreviewHtml] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tab !== 'preview') return;
    (async () => {
      const parts: string[] = [];
      if (editorNote) parts.push(await Promise.resolve(marked(editorNote, { gfm: true, breaks: true })));
      for (const it of items) {
        const bodyHtml = await Promise.resolve(marked(it.body, { gfm: true, breaks: true }));
        parts.push(`
          <section style="margin:2rem 0;padding:1.5rem;border:1px solid #e5e7eb;border-radius:12px">
            <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin:0 0 .5rem">${it.category || '(섹션 없음)'}</p>
            <h2 style="font-size:1.25rem;font-weight:700;margin:0 0 .25rem">${it.title || '(대제목 없음)'}</h2>
            ${it.subtitle ? `<p style="font-size:.9rem;color:#6b7280;margin:0 0 1rem">${it.subtitle}</p>` : ''}
            <div>${bodyHtml}</div>
            ${it.quote ? `<blockquote style="border-left:3px solid #2563eb;margin:1rem 0;padding:.5rem 1rem;color:#374151;font-style:italic">${it.quote}</blockquote>` : ''}
            ${it.url ? `<p style="font-size:.85rem;margin:.75rem 0 0"><a href="${it.url}" style="color:#2563eb">${it.url}</a></p>` : ''}
          </section>
        `);
      }
      setPreviewHtml(parts.join(''));
    })();
  }, [tab, editorNote, items]);

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it) => it._key === key ? { ...it, ...patch } : it));
  }

  function addItem() {
    const next = blankItem(items.length);
    setItems((prev) => [...prev, next]);
    setOpenItem(next._key);
  }

  function removeItem(key: string) {
    setItems((prev) => {
      const filtered = prev.filter((it) => it._key !== key).map((it, i) => ({ ...it, order: i }));
      if (openItem === key && filtered.length) setOpenItem(filtered[filtered.length - 1]._key);
      return filtered;
    });
  }

  function moveItem(key: string, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it._key === key);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr.map((it, i) => ({ ...it, order: i }));
    });
  }

  async function save() {
    if (!slug || !subject) { setError('슬러그, 제목은 필수예요.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        slug, subject,
        previewText: previewText || null,
        editorNote: editorNote || null,
        sentAt: sentAt || null,
        items: items.map((it) => ({
          ...(it.id ? { id: it.id } : {}),
          order: it.order,
          category: it.category,
          title: it.title,
          subtitle: it.subtitle || null,
          body: it.body,
          quote: it.quote || null,
          url: it.url || null,
          articleId: it.articleId || null,
        })),
      };
      const res = await fetch(
        isEdit ? `${API_BASE}/api/letters/${initial!.id}` : `${API_BASE}/api/letters`,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      router.push(`/admin/letters?key=${token}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLetter() {
    if (!confirm('레터를 삭제할까요?')) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/letters/${initial!.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      router.push(`/admin/letters?key=${token}`);
      router.refresh();
    } catch { setError('삭제 실패'); }
    finally { setDeleting(false); }
  }

  return (
    <div className="mx-auto max-w-3xl py-10 px-4">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-h2 font-bold text-ink">{isEdit ? '레터 편집' : '새 레터 작성'}</h1>
        <a href={`/admin/letters?key=${token}`} className="text-small text-ink-3 hover:text-ink underline underline-offset-2">← 목록</a>
      </div>

      {/* 탭 */}
      <div className="mb-6 flex gap-1 border-b border-line">
        {(['write', 'preview'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-body font-medium transition ${tab === t ? 'border-b-2 border-blue text-blue' : 'text-ink-3 hover:text-ink'}`}>
            {t === 'write' ? '✏️ 작성' : '👁 미리보기'}
          </button>
        ))}
      </div>

      {tab === 'preview' ? (
        <div className="prose-korean rounded-card border border-line bg-white p-6 min-h-[400px]"
          dangerouslySetInnerHTML={{ __html: previewHtml }} />
      ) : (
        <>
          {/* 레터 메타 */}
          <div className="space-y-4 rounded-card border border-line p-5 mb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-small font-medium text-ink-2 mb-1">제목 (이메일 Subject) *</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="예: AI 시대, 아이의 몸과 감각을 지키는 법"
                  className="w-full rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue" />
              </div>
              <div>
                <label className="block text-small font-medium text-ink-2 mb-1">Slug *</label>
                <input value={slug} onChange={(e) => setSlug(e.target.value)}
                  placeholder="예: 2026-06-24"
                  className="w-full rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue" />
              </div>
            </div>
            <div>
              <label className="block text-small font-medium text-ink-2 mb-1">미리보기 텍스트</label>
              <input value={previewText} onChange={(e) => setPreviewText(e.target.value)}
                placeholder="이메일 클라이언트 미리보기에 표시되는 부제 (~50자)"
                className="w-full rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue" />
            </div>
            <div>
              <label className="block text-small font-medium text-ink-2 mb-1">에디터 노트 (인트로, 마크다운)</label>
              <textarea value={editorNote} onChange={(e) => setEditorNote(e.target.value)}
                rows={3} placeholder="레터를 여는 짧은 메시지 (선택)"
                className="w-full rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue resize-y" />
            </div>
            <div>
              <label className="block text-small font-medium text-ink-2 mb-1">발송일 (비워두면 초안)</label>
              <input type="date" value={sentAt} onChange={(e) => setSentAt(e.target.value)}
                className="rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue" />
            </div>
          </div>

          {/* 아티클 목록 */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-card-title font-bold text-ink">아티클 ({items.length})</h2>
            <button onClick={addItem}
              className="rounded-btn border border-blue px-4 py-1.5 text-small font-semibold text-blue transition hover:bg-blue-50">
              + 아티클 추가
            </button>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={it._key} className="rounded-card border border-line overflow-hidden">
                {/* 아이템 헤더 (접기/펼치기) */}
                <div
                  className="flex cursor-pointer items-center gap-3 bg-grey-50 px-4 py-3 hover:bg-grey-100"
                  onClick={() => setOpenItem(openItem === it._key ? '' : it._key)}
                >
                  <span className="text-small font-bold text-ink-3 w-5 text-center">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-small font-semibold text-blue truncate">{it.category || <span className="text-ink-3">섹션명</span>}</p>
                    <p className="text-body font-medium text-ink truncate">{it.title || <span className="text-ink-3">대제목</span>}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); moveItem(it._key, -1); }}
                      disabled={idx === 0}
                      className="p-1 text-ink-3 hover:text-ink disabled:opacity-30">▲</button>
                    <button onClick={(e) => { e.stopPropagation(); moveItem(it._key, 1); }}
                      disabled={idx === items.length - 1}
                      className="p-1 text-ink-3 hover:text-ink disabled:opacity-30">▼</button>
                    <span className="text-ink-3">{openItem === it._key ? '▾' : '▸'}</span>
                  </div>
                </div>

                {/* 아이템 필드 */}
                {openItem === it._key && (
                  <div className="p-4 space-y-3">
                    {/* 섹션명 */}
                    <div>
                      <label className="block text-small font-medium text-ink-2 mb-1">섹션명 (카테고리)</label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {CATEGORY_SUGGESTIONS.map((cat) => (
                          <button key={cat} onClick={() => updateItem(it._key, { category: cat })}
                            className={`rounded-full px-3 py-1 text-small transition ${it.category === cat ? 'bg-blue text-white' : 'bg-grey-100 text-ink-2 hover:bg-grey-200'}`}>
                            {cat}
                          </button>
                        ))}
                      </div>
                      <input value={it.category} onChange={(e) => updateItem(it._key, { category: e.target.value })}
                        placeholder="직접 입력"
                        className="w-full rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue" />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-small font-medium text-ink-2 mb-1">대제목 *</label>
                        <input value={it.title} onChange={(e) => updateItem(it._key, { title: e.target.value })}
                          placeholder="예: 영어유치원, 보내야 할까요?"
                          className="w-full rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue" />
                      </div>
                      <div>
                        <label className="block text-small font-medium text-ink-2 mb-1">소제목</label>
                        <input value={it.subtitle} onChange={(e) => updateItem(it._key, { subtitle: e.target.value })}
                          placeholder="부제 (선택)"
                          className="w-full rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-small font-medium text-ink-2 mb-1">본문 (마크다운)</label>
                      <textarea value={it.body} onChange={(e) => updateItem(it._key, { body: e.target.value })}
                        rows={8} placeholder="Claude.ai에서 작성한 본문을 붙여넣으세요."
                        className="w-full rounded-btn border border-grey-300 px-3 py-2 text-small text-ink font-mono outline-none focus:border-blue resize-y leading-relaxed" />
                    </div>

                    <div>
                      <label className="block text-small font-medium text-ink-2 mb-1">핵심 인용구</label>
                      <input value={it.quote} onChange={(e) => updateItem(it._key, { quote: e.target.value })}
                        placeholder="예: Physicality over Pixels"
                        className="w-full rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue" />
                    </div>

                    <div>
                      <label className="block text-small font-medium text-ink-2 mb-1">원문 URL</label>
                      <input value={it.url} onChange={(e) => updateItem(it._key, { url: e.target.value })}
                        placeholder="https://..."
                        className="w-full rounded-btn border border-grey-300 px-3 py-2 text-body text-ink outline-none focus:border-blue" />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button onClick={() => removeItem(it._key)}
                        className="text-small text-red hover:underline">
                        아티클 삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <p className="mt-4 text-small text-red">{error}</p>}

          {/* 액션 버튼 */}
          <div className="mt-8 flex items-center justify-between">
            {isEdit ? (
              <button onClick={deleteLetter} disabled={deleting}
                className="text-small text-red hover:underline disabled:opacity-50">
                {deleting ? '삭제 중…' : '레터 삭제'}
              </button>
            ) : <div />}
            <div className="flex gap-3">
              {initial?.sentAt && (
                <a href={`/letter/${initial.slug}`} target="_blank" rel="noopener"
                  className="rounded-btn border border-line px-5 py-2.5 text-body font-medium text-ink-2 hover:bg-grey-50">
                  공개 보기 →
                </a>
              )}
              <button onClick={save} disabled={saving}
                className="rounded-btn bg-blue px-6 py-2.5 text-body font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
                {saving ? '저장 중…' : isEdit ? '저장' : '레터 만들기'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
