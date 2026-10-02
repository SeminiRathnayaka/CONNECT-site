import { useMemo, useState } from 'react';
import { Clock, GraduationCap, Search } from 'lucide-react';
import type { HealthArticle } from '../../types';
import { articleCategories, healthArticles } from '../../data/healthArticles';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/FormControls';
import { buttonClass } from '../../components/ui/Button';
import { iconFor } from '../../utils/icons';
import { cn } from '../../utils/cn';

export default function HealthEducation() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [open, setOpen] = useState<HealthArticle | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return healthArticles.filter((a) => {
      const inCategory = category === 'All' || a.category === category;
      const inQuery =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return inCategory && inQuery;
    });
  }, [query, category]);

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Learn concepts"
        title="Health Education"
        description="Short, plain-language articles on nutrition, sleep, exercise, mental wellness and preventive care."
        icon={<GraduationCap className="h-6 w-6" aria-hidden />}
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            aria-label="Search health articles"
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {articleCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition',
                category === c
                  ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                  : 'border-ink-200 bg-white/70 text-ink-600 hover:border-primary-300 hover:text-primary-600',
              )}
              aria-pressed={category === c}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs font-semibold text-ink-500">
        {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="No articles found"
          description="Try another keyword or pick a different category."
          action={
            <button
              type="button"
              className={buttonClass('soft', 'sm')}
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
            >
              Reset search
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a, i) => {
            const Icon = iconFor(a.icon);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setOpen(a)}
                className="glass group flex h-full flex-col gap-3 rounded-3xl p-5 text-left card-lift animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-aqua-50 text-aqua-600 transition group-hover:bg-aqua-600 group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <Badge tone="aqua">{a.category}</Badge>
                </div>

                <h2 className="text-sm font-bold text-ink-900">{a.title}</h2>
                <p className="text-xs leading-relaxed text-ink-600">{a.excerpt}</p>

                <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-ink-500">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {a.readMinutes} min read
                  </span>
                  <span className="font-bold text-primary-600 opacity-0 transition group-hover:opacity-100">
                    Read →
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.title ?? ''}
        description={open ? `${open.category} · ${open.readMinutes} min read` : ''}
        size="lg"
        footer={
          <button type="button" className={buttonClass('primary', 'sm')} onClick={() => setOpen(null)}>
            Done reading
          </button>
        }
      >
        {open ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-aqua-100 bg-aqua-50/60 p-4 text-sm leading-relaxed text-ink-700">
              {open.excerpt}
            </div>
            {open.body.map((p, idx) => (
              <p key={idx} className="text-sm leading-relaxed text-ink-700">
                {p}
              </p>
            ))}
            <p className="rounded-xl bg-warn-50 px-4 py-3 text-xs leading-relaxed text-warn-700">
              Educational content only — it does not consider your personal medical history.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
