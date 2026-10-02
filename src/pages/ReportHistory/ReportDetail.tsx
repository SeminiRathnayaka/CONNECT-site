import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  FlaskConical,
  Languages,
  Printer,
  ScanLine,
  User,
} from 'lucide-react';
import { glossary } from '../../data/glossary';
import { useReports } from '../../hooks/useReports';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { buttonClass } from '../../components/ui/Button';
import { ResultCard } from '../Orayan/OrayanParts';
import { formatDate } from '../../utils/dates';
import { countByStatus } from '../../utils/health';
import { cn } from '../../utils/cn';

export default function ReportDetail() {
  const { reportId } = useParams();
  const [reports] = useReports();
  const [language, setLanguage] = useState<'en' | 'si'>('en');
  const [expanded, setExpanded] = useState<string[]>([]);

  const report = reports.find((r) => r.id === reportId);

  if (!report) {
    return (
      <div className="page-container py-10">
        <EmptyState
          title="Report not found"
          description="It may have been deleted from your history."
          action={
            <Link to="/report-history" className={buttonClass('primary', 'sm')}>
              Back to report history
            </Link>
          }
        />
      </div>
    );
  }

  const counts = countByStatus(report.results);
  const withinRange = counts.normal + counts.attention;

  const toggle = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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
        eyebrow={report.type}
        title={report.fileName}
        description={`Analyzed ${formatDate(report.uploadedAt)} · ${report.lab}`}
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
          <Info icon={<User className="h-4 w-4" />} label="Patient" value={report.patient} />
          <Info icon={<Calendar className="h-4 w-4" />} label="Report date" value={formatDate(report.date)} />
          <Info icon={<ScanLine className="h-4 w-4" />} label="Report type" value={report.type} />
          <Info icon={<FlaskConical className="h-4 w-4" />} label="Report ID" value={report.reportId} />
        </dl>
      </GlassCard>

      {/* Summary */}
      <GlassCard variant="tint" className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink-900">Report summary</h2>
          <div className="flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 p-0.5 text-[11px] font-bold">
            {(['en', 'si'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition',
                  language === lang
                    ? 'bg-primary-600 text-white'
                    : 'text-ink-500 hover:text-primary-600',
                )}
                aria-pressed={language === lang}
              >
                <Languages className="h-3 w-3" aria-hidden />
                {lang === 'en' ? 'English' : 'සිංහල'}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value={counts.total} label="values analyzed" tone="text-ink-900" />
          <Stat value={withinRange} label="within reference range" tone="text-ok-600" />
          <Stat value={counts.outside} label="outside reference range" tone="text-alert-600" />
          <Stat value={expanded.length} label="terms you've explained" tone="text-primary-600" />
        </ul>

        <p className="mt-4 rounded-2xl border border-warn-100 bg-white/70 px-4 py-3 text-xs leading-relaxed text-warn-700">
          This information is provided for understanding your report and is not a medical
          diagnosis.
        </p>
      </GlassCard>

      {/* Results */}
      <h2 className="mb-3 text-base font-bold text-ink-900">Values</h2>
      <div className="grid gap-3.5 md:grid-cols-2">
        {report.results.map((r) => (
          <ResultCard
            key={r.id}
            result={r}
            term={glossary.find((g) => g.term.toLowerCase() === r.name.toLowerCase())}
            language={language}
            onLanguageChange={setLanguage}
            expanded={expanded.includes(r.id)}
            onToggle={() => toggle(r.id)}
          />
        ))}
      </div>
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
