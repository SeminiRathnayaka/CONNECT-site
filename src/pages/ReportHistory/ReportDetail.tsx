import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  FlaskConical,
  Printer,
  ScanLine,
  User,
} from 'lucide-react';
import { ApiError, explainTest, getReportSummary, reportContext } from '../../lib/api';
import type { Language } from '../../lib/api';
import type { LabResult } from '../../types';
import { useReports } from '../../hooks/useReports';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { buttonClass } from '../../components/ui/Button';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { ReportMarkdown } from '../../components/ui/ReportMarkdown';
import { ResultCard } from '../Orayan/OrayanParts';
import { formatDate } from '../../utils/dates';
import { countByStatus } from '../../utils/health';
import { cn } from '../../utils/cn';

export default function ReportDetail() {
  const { reportId } = useParams();
  const [language, setLanguage] = useState<Language>('en');
  // The report lives in Supabase, so it is read from there rather than asked
  // of the AI service, which stores nothing.
  const { reports, loading, error: loadError } = useReports();
  const report = reports.find((item) => item.id === reportId) ?? null;
  const [results, setResults] = useState<LabResult[]>([]);
  const [summary, setSummary] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [explanationErrors, setExplanationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!report) return;
    setResults(report.results);
    setSummary(report.summaryText ?? '');
  }, [report]);

  /* Refresh just the summary when switching language, so the values do not flicker. */
  const changeLanguage = async (next: Language) => {
    setLanguage(next);
    setResults((prev) =>
      prev.map((r) => ({ ...r, explanation: undefined, explanationLoading: false })),
    );
    setExpanded([]);
    setExplanationErrors({});
    if (!report) return;
    try {
      const response = await getReportSummary(reportContext(report), next);
      setSummary(response.summary_text);
    } catch {
      /* keep whatever is already shown */
    }
  };

  const toggleExplain = (result: LabResult) => {
    if (expanded.includes(result.id)) {
      setExpanded((prev) => prev.filter((id) => id !== result.id));
      return;
    }
    setExpanded((prev) => [...prev, result.id]);
    if (result.explanation || !report) return;

    setResults((prev) =>
      prev.map((r) => (r.id === result.id ? { ...r, explanationLoading: true } : r)),
    );

    void explainTest(reportContext(report), result.name, language)
      .then((response) =>
        setResults((prev) =>
          prev.map((r) =>
            r.id === result.id
              ? { ...r, explanation: response.explanation, explanationLoading: false }
              : r,
          ),
        ),
      )
      .catch((err: unknown) => {
        setResults((prev) =>
          prev.map((r) => (r.id === result.id ? { ...r, explanationLoading: false } : r)),
        );
        setExplanationErrors((prev) => ({
          ...prev,
          [result.id]:
            err instanceof ApiError ? err.message : 'Could not explain this test right now.',
        }));
      });
  };

  if (loading) {
    return (
      <div className="page-container py-10">
        <LoadingState label="Loading report…" />
      </div>
    );
  }

  if (loadError || !report) {
    return (
      <div className="page-container py-10">
        <EmptyState
          title="Report not found"
          description={loadError ?? 'It may have been deleted from your history.'}
          action={
            <Link to="/report-history" className={buttonClass('primary', 'sm')}>
              Back to report history
            </Link>
          }
        />
      </div>
    );
  }

  const counts = countByStatus(results);
  const withinRange = counts.normal + counts.attention;
  const reportType = report.type;

  return (
    <div className="page-container py-6 sm:py-8">
      <Link
        to="/report-history"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 transition hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Report history
      </Link>

      <PageHeader
        eyebrow={reportType}
        title={report.fileName}
        description={`Uploaded ${formatDate(report.uploadedAt)}`}
        icon={<ScanLine className="h-6 w-6" aria-hidden />}
        actions={
          <>
            <button type="button" className={buttonClass('secondary', 'sm')} onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden />
              Print summary
            </button>
            <Link to="/orayan" className={buttonClass('primary', 'sm')}>
              Analyze another
            </Link>
          </>
        }
      />

      {/* Overview */}
      <GlassCard className="mb-4">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info icon={<Calendar className="h-4 w-4" />} label="Uploaded" value={formatDate(report.uploadedAt)} />
          <Info icon={<ScanLine className="h-4 w-4" />} label="Report type" value={reportType} />
          <Info icon={<FlaskConical className="h-4 w-4" />} label="Values read" value={String(results.length)} />
          <Info icon={<User className="h-4 w-4" />} label="Reference" value={reportId?.slice(0, 8) ?? '—'} />
        </dl>
      </GlassCard>

      {results.length === 0 ? (
        <EmptyState
          title="No values were read"
          description="Orayan could not find any test rows in this report. If it is a scan, try uploading a clear image instead."
          action={
            <Link to="/orayan" className={buttonClass('primary', 'sm')}>
              <ScanLine className="h-4 w-4" aria-hidden />
              Analyze another report
            </Link>
          }
        />
      ) : (
        <>
          {/* Summary */}
          <GlassCard variant="tint" className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-ink-900">Report summary</h2>
              <LanguageToggle value={language} onChange={(next) => void changeLanguage(next)} />
            </div>

            {summary ? (
              <ReportMarkdown text={summary} className="mt-4" />
            ) : (
              <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-xs text-ink-500">
                No written summary is cached for this language yet.
              </p>
            )}

            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <Stat value={counts.total} label="values analyzed" tone="text-ink-900" />
              <Stat value={withinRange} label="within reference range" tone="text-ok-600" />
              <Stat value={counts.outside} label="outside reference range" tone="text-alert-600" />
              <Stat
                value={results.filter((r) => r.explanation).length}
                label="terms you've explained"
                tone="text-primary-600"
              />
            </ul>

            <p className="mt-4 rounded-2xl border border-warn-100 bg-white/70 px-4 py-3 text-xs leading-relaxed text-warn-700">
              This information is provided for understanding your report and is not a medical
              diagnosis.
            </p>
          </GlassCard>

          {/* Results */}
          <h2 className="mb-3 text-base font-bold text-ink-900">Values</h2>
          <div className="grid gap-3.5 md:grid-cols-2">
            {results.map((r) => (
              <ResultCard
                key={r.id}
                result={r}
                language={language}
                onLanguageChange={(next) => void changeLanguage(next)}
                expanded={expanded.includes(r.id)}
                onExplain={() => toggleExplain(r)}
                onHide={() => toggleExplain(r)}
                explanationError={explanationErrors[r.id]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white/70 px-4 py-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
        <span className="text-primary-500">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-bold text-ink-900">{value}</dd>
    </div>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <li className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-center">
      <p className={cn('text-2xl font-extrabold', tone)}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </li>
  );
}