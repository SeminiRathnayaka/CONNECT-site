import { useMemo, useState } from 'react';
import { FileSearch, FolderOpen, Search, SlidersHorizontal } from 'lucide-react';
import type { HealthRecord, RecordCategory } from '../../types';
import { mockRecords } from '../../data/mockHealthData';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { buttonClass } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormControls';
import { formatDate } from '../../utils/dates';
import { cn } from '../../utils/cn';

const categories: Array<RecordCategory | 'All'> = [
  'All',
  'Medical Reports',
  'Lab Results',
  'Vaccinations',
  'Conditions',
  'Allergies',
  'Medical History',
];

const categoryTone: Record<string, 'primary' | 'aqua' | 'ok' | 'warn' | 'alert' | 'violet'> = {
  'Medical Reports': 'primary',
  'Lab Results': 'aqua',
  Vaccinations: 'ok',
  Conditions: 'warn',
  Allergies: 'alert',
  'Medical History': 'violet',
};

export default function HealthRecords() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<(typeof categories)[number]>('All');
  const [open, setOpen] = useState<HealthRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockRecords.filter((r) => {
      const matchCategory = category === 'All' || r.category === category;
      const matchQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [query, category]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    mockRecords.forEach((r) => map.set(r.category, (map.get(r.category) ?? 0) + 1));
    return map;
  }, []);

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Secure Health Hub"
        title="Health Records"
        description="Reports, lab results, vaccinations, conditions and medical history — searchable in one place."
        icon={<FolderOpen className="h-6 w-6" aria-hidden />}
      />

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records, providers, notes…"
            aria-label="Search health records"
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          {categories.map((c) => (
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
              {c !== 'All' ? (
                <span className="ml-1.5 opacity-70">{counts.get(c) ?? 0}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p className="mb-3 text-xs font-semibold text-ink-500">
        {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
        {category !== 'All' ? ` in ${category}` : ''}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="No records match your search"
          description="Try a different keyword or clear the filters."
          action={
            <button
              type="button"
              className={buttonClass('soft', 'sm')}
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r, i) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setOpen(r)}
              className="glass group flex h-full flex-col gap-3 rounded-3xl p-5 text-left card-lift animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 40, 320)}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-600 group-hover:text-white">
                  <FileSearch className="h-5 w-5" aria-hidden />
                </span>
                <Badge tone={categoryTone[r.category] ?? 'primary'}>{r.category}</Badge>
              </div>

              <div>
                <h2 className="text-sm font-bold text-ink-900">{r.title}</h2>
                <p className="mt-1 text-xs text-ink-500">
                  {formatDate(r.date)} · {r.provider}
                </p>
              </div>

              <p className="text-xs leading-relaxed text-ink-600">{r.summary}</p>

              <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3">
                <Badge
                  tone={
                    r.status === 'Active'
                      ? 'alert'
                      : r.status === 'Resolved' || r.status === 'Completed'
                        ? 'ok'
                        : 'neutral'
                  }
                >
                  {r.status}
                </Badge>
                <span className="text-xs font-bold text-primary-600 opacity-0 transition group-hover:opacity-100">
                  Open details →
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.title ?? ''}
        description={open ? `${open.category} · ${formatDate(open.date)}` : ''}
        size="lg"
        footer={
          <>
            <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => setOpen(null)}>
              Close
            </button>
          </>
        }
      >
        {open ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={categoryTone[open.category] ?? 'primary'}>{open.category}</Badge>
              <Badge tone="neutral">Provider: {open.provider}</Badge>
              <Badge tone={open.status === 'Active' ? 'alert' : 'ok'}>{open.status}</Badge>
            </div>

            <p className="rounded-2xl bg-primary-50 px-4 py-3 text-sm leading-relaxed text-ink-700">
              {open.summary}
            </p>

            <div>
              <h4 className="mb-2 text-xs font-bold tracking-wide text-ink-500 uppercase">
                Details
              </h4>
              <ul className="space-y-2">
                {open.details.map((d) => (
                  <li
                    key={d}
                    className="flex items-start gap-2.5 rounded-xl border border-ink-100 bg-white/70 px-3.5 py-2.5 text-sm text-ink-700"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {open.file ? (
              <GlassCard variant="outline" className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-ink-700">Attachment</span>
                <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-bold text-ink-600">
                  {open.file}
                </span>
              </GlassCard>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
