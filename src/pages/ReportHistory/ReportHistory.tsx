import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileClock, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import type { MedicalReport } from '../../types';
import { useReports } from '../../hooks/useReports';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { buttonClass } from '../../components/ui/Button';
import { formatDate } from '../../utils/dates';
import { countByStatus } from '../../utils/health';

export default function ReportHistory() {
  const [reports, setReports] = useReports();
  const { toast } = useToast();
  const [toDelete, setToDelete] = useState<MedicalReport | null>(null);

  const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date));

  const confirmDelete = () => {
    if (!toDelete) return;
    setReports((prev) => prev.filter((r) => r.id !== toDelete.id));
    toast('Report deleted from history.', 'info');
    setToDelete(null);
  };

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Store & compare"
        title="Report History"
        description="Every report you upload with Orayan, kept in one place for easy comparison."
        icon={<FileClock className="h-6 w-6" aria-hidden />}
        actions={
          <Link to="/orayan" className={buttonClass('primary', 'sm')}>
            <Plus className="h-4 w-4" aria-hidden />
            Upload report
          </Link>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState
          title="No reports yet"
          description="Analyze a medical report with Orayan and it will be saved here automatically."
          action={
            <Link to="/orayan" className={buttonClass('primary', 'sm')}>
              <Plus className="h-4 w-4" aria-hidden />
              Upload a report
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((r, i) => {
            const counts = countByStatus(r.results);
            return (
              <article
                key={r.id}
                className="glass flex flex-col gap-4 rounded-3xl p-5 card-lift animate-fade-up"
                style={{ animationDelay: `${Math.min(i * 45, 300)}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-50 text-primary-600">
                    <FileClock className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge tone="primary">{r.type}</Badge>
                    {r.results.length > 0 ? (
                      <Badge tone="aqua">{r.results.length} values</Badge>
                    ) : (
                      <Badge tone="neutral">No analysis</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="truncate text-sm font-bold text-ink-900">{r.fileName}</h2>
                  <p className="mt-1 text-xs text-ink-500">
                    {formatDate(r.date)} · {r.lab}
                  </p>
                </div>

                {r.results.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <Cell label="Values" value={String(counts.total)} />
                    <Cell label="In range" value={String(counts.normal + counts.attention)} tone="text-ok-600" />
                    <Cell label="Outside" value={String(counts.outside)} tone="text-alert-600" />
                  </div>
                ) : null}

                <div className="mt-auto flex gap-2 border-t border-ink-100 pt-3">
                  <Link
                    to={`/report-history/${r.id}`}
                    className={buttonClass('secondary', 'sm', 'flex-1 justify-center')}
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => setToDelete(r)}
                    className={buttonClass('danger', 'sm')}
                    aria-label={`Delete report ${r.fileName}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 rounded-2xl border border-warn-100 bg-white/70 px-4 py-3 text-xs leading-relaxed text-warn-700">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Report values are provided for understanding only and are never a diagnosis.
      </p>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Delete report?"
        description="This removes it from this device."
        size="sm"
        footer={
          <>
            <button type="button" className={buttonClass('ghost', 'sm')} onClick={() => setToDelete(null)}>
              Keep report
            </button>
            <button type="button" className={buttonClass('danger', 'sm')} onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </button>
          </>
        }
      >
        <p>
          <strong>{toDelete?.fileName}</strong> will be permanently removed from your history.
        </p>
      </Modal>
    </div>
  );
}

function Cell({ label, value, tone = 'text-ink-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white/70 py-2">
      <p className={`font-extrabold ${tone}`}>{value}</p>
      <p className="text-[10px] text-ink-500">{label}</p>
    </div>
  );
}
