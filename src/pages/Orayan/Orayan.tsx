import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  FileText,
  FlaskConical,
  Languages,
  ScanLine,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { MedicalReport } from '../../types';
import { mockLabResults } from '../../data/mockHealthData';
import { glossary } from '../../data/glossary';
import { useReports } from '../../hooks/useReports';
import { useToast } from '../../hooks/useToast';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, todayISO } from '../../utils/dates';
import { countByStatus } from '../../utils/health';
import { cn } from '../../utils/cn';
import { buttonClass } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { AnalysisProgress, DropZone, ResultCard } from './OrayanParts';
import type { PickedFile } from './OrayanParts';

type Stage = 'upload' | 'analyzing' | 'done';

const stepper = [
  { key: 'upload', label: 'Upload report' },
  { key: 'analyzing', label: 'Analyze' },
  { key: 'done', label: 'Results' },
] as const;

export default function Orayan() {
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [language, setLanguage] = useState<'en' | 'si'>('en');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [, setReports] = useReports();
  const { toast } = useToast();
  const { push } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const finishAnalysis = (picked: PickedFile) => {
    const created: MedicalReport = {
      id: `r-${Date.now()}`,
      fileName: picked.name,
      type: picked.name.toLowerCase().endsWith('.png') || picked.name.toLowerCase().endsWith('.jpg')
        ? 'Scanned Blood Test'
        : 'Blood Test',
      date: todayISO(),
      lab: 'Nishadi Labs, Colombo',
      patient: user?.name ?? 'Demo User',
      reportId: `NL-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 89999)}`,
      results: mockLabResults,
      explainedTerms: 0,
      uploadedAt: todayISO(),
    };
    setReport(created);
    setStage('done');
    setExpanded([]);
    setReports((prev) => [created, ...prev]);
    toast('Report analyzed and saved to your report history.');
    push({
      title: 'Report analysis ready',
      body: `${created.fileName} was analyzed and saved to your report history.`,
      type: 'report',
      link: '/report-history',
    });
  };

  const startAnalysis = (picked: PickedFile) => {
    setFile(picked);
    setStage('analyzing');
  };

  const reset = () => {
    setStage('upload');
    setFile(null);
    setReport(null);
    setExpanded([]);
  };

  const counts = report ? countByStatus(report.results) : null;
  const withinRange = counts ? counts.normal + counts.attention : 0;

  const toggleExplain = (id: string) =>
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Orayan AI"
        title="Understand your medical reports"
        description="Upload a report and Orayan extracts every value, highlights anything outside the reference range, and explains the medical terms in simple English and Sinhala."
        icon={<ScanLine className="h-6 w-6" aria-hidden />}
        actions={
          stage === 'done' ? (
            <>
              <button type="button" className={buttonClass('secondary', 'sm')} onClick={reset}>
                Analyze another report
              </button>
              <button
                type="button"
                className={buttonClass('primary', 'sm')}
                onClick={() => navigate('/report-history')}
              >
                Report history
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : undefined
        }
      />

      {/* Stepper */}
      <ol className="mb-6 flex flex-wrap items-center gap-2" aria-label="Analysis steps">
        {stepper.map((s, i) => {
          const currentIndex = stepper.findIndex((x) => x.key === stage);
          const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'todo';
          return (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition',
                  state === 'done' && 'border-ok-100 bg-ok-50 text-ok-700',
                  state === 'current' && 'border-primary-200 bg-primary-50 text-primary-700',
                  state === 'todo' && 'border-ink-200 bg-white/60 text-ink-400',
                )}
              >
                <span
                  className={cn(
                    'grid h-4 w-4 place-items-center rounded-full text-[9px]',
                    state === 'done'
                      ? 'bg-ok-500 text-white'
                      : state === 'current'
                        ? 'bg-primary-600 text-white'
                        : 'bg-ink-200 text-white',
                  )}
                >
                  {i + 1}
                </span>
                {s.label}
              </span>
              {i < stepper.length - 1 ? (
                <span className="h-px w-6 bg-ink-200 sm:w-10" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* ---------------- Upload stage ---------------- */}
      {stage === 'upload' ? (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section className="glass rounded-3xl p-5 sm:p-7" aria-labelledby="upload-title">
            <h2 id="upload-title" className="text-base font-bold text-ink-900">
              Step 1 — Upload medical report
            </h2>
            <p className="mt-1 mb-4 text-sm text-ink-600">
              Blood tests, lipid profiles, thyroid panels or any lab report.
            </p>
            <DropZone
              file={file}
              onFile={(f) => setFile(f)}
              onClear={() => setFile(null)}
              onSample={() => setFile({ name: 'sample-blood-test-report.pdf', sizeKB: 412 })}
            />
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className={buttonClass('primary', 'md')}
                disabled={!file}
                onClick={() => file && startAnalysis(file)}
              >
                <FlaskConical className="h-4 w-4" aria-hidden />
                Analyze report
              </button>
            </div>
          </section>

          <aside className="glass-tint flex flex-col gap-4 rounded-3xl p-5 sm:p-7">
            <h2 className="text-base font-bold text-ink-900">What Orayan does</h2>
            <ol className="space-y-3.5 text-sm text-ink-700">
              {[
                'Reads the document and finds every measured value.',
                'Compares each value with its printed reference range.',
                'Marks values that need attention — without diagnosing.',
                'Explains hard terms in plain English and Sinhala.',
              ].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/80 text-xs font-bold text-primary-600">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ol>

            <div className="mt-auto flex items-start gap-2.5 rounded-2xl border border-warn-100 bg-white/70 p-3.5 text-xs leading-relaxed text-warn-700">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Orayan shows your report values for understanding only. It never diagnoses
                conditions — always discuss results with your doctor.
              </span>
            </div>
          </aside>
        </div>
      ) : null}

      {/* ---------------- Analyzing ---------------- */}
      {stage === 'analyzing' && file ? (
        <AnalysisProgress
          fileName={file.name}
          onCancel={reset}
          onDone={() => finishAnalysis(file)}
        />
      ) : null}

      {/* ---------------- Done ---------------- */}
      {stage === 'done' && report ? (
        <div className="space-y-5">
          {/* Overview */}
          <section className="glass rounded-3xl p-5 sm:p-6" aria-labelledby="overview-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="overview-title" className="text-base font-bold text-ink-900">
                Report overview
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-50 px-3 py-1 text-xs font-bold text-ok-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Analysis complete
              </span>
            </div>

            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <OverviewItem icon={<User className="h-4 w-4" />} label="Patient" value={report.patient} />
              <OverviewItem
                icon={<Calendar className="h-4 w-4" />}
                label="Report date"
                value={formatDate(report.date)}
              />
              <OverviewItem
                icon={<FileText className="h-4 w-4" />}
                label="Report type"
                value={report.type}
              />
              <OverviewItem
                icon={<FlaskConical className="h-4 w-4" />}
                label="Laboratory"
                value={report.lab}
              />
            </dl>

            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-ink-100 pt-3 text-xs text-ink-500">
              <span>File: {report.fileName}</span>
              <span>Report ID: {report.reportId}</span>
            </p>
          </section>

          {/* Summary */}
          {counts ? (
            <section
              className="glass-tint rounded-3xl p-5 sm:p-6"
              aria-labelledby="summary-title"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="summary-title" className="text-base font-bold text-ink-900">
                  Report summary
                </h2>
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
                <SummaryStat value={counts.total} label="values analyzed" tone="text-ink-900" />
                <SummaryStat value={withinRange} label="within reference range" tone="text-ok-600" />
                <SummaryStat value={counts.outside} label="outside reference range" tone="text-alert-600" />
                <SummaryStat
                  value={expanded.length}
                  label="terms you've explained"
                  tone="text-primary-600"
                />
              </ul>

              <p className="mt-4 rounded-2xl border border-warn-100 bg-white/70 px-4 py-3 text-xs leading-relaxed text-warn-700">
                This information is provided for understanding your report and is not a medical
                diagnosis. Share these results with your doctor or pharmacist for advice that
                fits your history.
              </p>
            </section>
          ) : null}

          {/* Results */}
          <section aria-labelledby="results-title">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 id="results-title" className="text-base font-bold text-ink-900">
                Extracted results
              </h2>
              <p className="text-xs text-ink-500">
                {report.results.length} values · click “Explain simply” on any term
              </p>
            </div>

            <div className="grid gap-3.5 md:grid-cols-2">
              {report.results.map((r) => (
                <ResultCard
                  key={r.id}
                  result={r}
                  term={glossary.find((g) => g.term.toLowerCase() === r.name.toLowerCase())}
                  language={language}
                  onLanguageChange={setLanguage}
                  expanded={expanded.includes(r.id)}
                  onToggle={() => toggleExplain(r.id)}
                />
              ))}
            </div>
          </section>

          {/* Follow-ups */}
          <section className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className={buttonClass('secondary', 'md', 'flex-1 justify-center')}
            >
              See it on your dashboard
            </Link>
            <Link
              to="/doctor-prep"
              className={buttonClass('primary', 'md', 'flex-1 justify-center')}
            >
              Prepare questions for your doctor
            </Link>
          </section>
        </div>
      ) : null}

      {stage === 'done' && !report ? (
        <EmptyState title="Nothing to show" description="Upload a report to begin." />
      ) : null}
    </div>
  );
}

function OverviewItem({
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
        {icon}
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-bold text-ink-900">{value}</dd>
    </div>
  );
}

function SummaryStat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <li className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-center">
      <p className={cn('text-2xl font-extrabold', tone)}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{label}</p>
    </li>
  );
}
