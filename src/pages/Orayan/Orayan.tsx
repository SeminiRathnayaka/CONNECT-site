import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Calendar,
  FileText,
  FlaskConical,
  ScanLine,
  ShieldCheck,
  TriangleAlert,
  Unplug,
  User,
} from 'lucide-react';
import type { LabResult, MedicalReport } from '../../types';
import { ApiError, explainTest, getReportSummary, uploadReport } from '../../lib/api';
import type { Language, TestCounts } from '../../lib/api';
import { useAiStatus } from '../../hooks/useAiStatus';
import { useReports } from '../../hooks/useReports';
import { useToast } from '../../hooks/useToast';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, todayISO } from '../../utils/dates';
import { countByStatus } from '../../utils/health';
import { toLabResult } from '../../lib/api';
import { cn } from '../../utils/cn';
import { buttonClass } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { ReportMarkdown } from '../../components/ui/ReportMarkdown';
import { AnalysisProgress, DropZone, ResultCard } from './OrayanParts';
import type { PickedFile } from './OrayanParts';
import { AskOrayan } from './AskOrayan';

type Stage = 'upload' | 'analyzing' | 'done';

const OFFLINE_NOTICE =
  'Orayan cannot reach the AI server right now. Start it by running "npm run dev" in the project folder.';

const stepper = [
  { key: 'upload', label: 'Upload report' },
  { key: 'analyzing', label: 'Analyze' },
  { key: 'done', label: 'Results' },
] as const;

/** Backend counts are stored on the report so Report History can show them too. */
function toStoredCounts(counts: TestCounts) {
  return {
    total: counts.total,
    inRange: counts.in_range,
    low: counts.low,
    high: counts.high,
    unknown: counts.unknown,
    qualitative: counts.qualitative,
    flaggedTotal: counts.flagged_total,
  };
}

function toMedicalReport(
  response: Awaited<ReturnType<typeof uploadReport>>,
  results: LabResult[],
  patient: string,
): MedicalReport {
  const isImage = response.source === 'image';
  return {
    id: response.report_id,
    reportId: response.report_id,
    fileName: response.filename,
    type: isImage ? 'Scanned Report' : 'Lab Report',
    date: todayISO(),
    lab: 'Not provided',
    patient,
    results,
    explainedTerms: results.filter((r) => r.explanation).length,
    uploadedAt: todayISO(),
    counts: toStoredCounts(response.counts),
    summaryText: response.summary_text,
  };
}

export default function Orayan() {
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [explanationErrors, setExplanationErrors] = useState<Record<string, string>>({});
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const { saveReport, saveReportTests } = useReports();
  const { toast } = useToast();
  const { push } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status: backend, refresh: probe } = useAiStatus();
  const online = backend === 'online';

  /* Keep the latest file so retryAnalysis can reuse it without a re-pick. */
  const fileRef = useRef<PickedFile | null>(null);

  /* ------------------------------------------------------------------ */
  /* Upload                                                              */
  /* ------------------------------------------------------------------ */

  const runAnalysis = useCallback(
    async (picked: PickedFile, lang: Language) => {
      setAnalysisText(null);
      setAnalysisError(null);
      setExplanationErrors({});
      setExpanded([]);
      setStage('analyzing');

      try {
        const response = await uploadReport(picked.file, lang);
        const results = response.tests.map(toLabResult);
        const created = toMedicalReport(response, results, user?.name ?? 'Not set');

        setReport(created);
        setAnalysisText(response.summary_text || null);
        setStage('done');

        // Persist to Supabase: the original document goes to private Storage,
        // the whole report in summary_json so history loads in one query, plus
        // the normalised test rows.
        await saveReport(created, picked.file);
        await saveReportTests(created.id, created).catch(() => {
          toast('Report saved, but its test values could not be stored.', 'warning');
        });

        if (response.summary_error) {
          toast('Report read successfully, but the AI summary is unavailable.', 'warning');
        } else {
          toast('Report analyzed and saved to your report history.');
        }

        push({
          title: 'Report analysis ready',
          body: `${picked.name} was analyzed and saved to your report history.`,
          type: 'report',
          link: '/report-history',
        });
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Something went wrong.';
        setAnalysisError(message);
        setStage('done');
        toast('Analysis failed. Please try again.', 'warning');
        probe();
      }
    },
    [push, saveReport, saveReportTests, toast, user, probe],
  );

  const startAnalysis = (picked: PickedFile) => {
    fileRef.current = picked;
    void runAnalysis(picked, language);
  };

  const retryAnalysis = () => {
    const picked = fileRef.current;
    if (!picked || !online) return;
    void runAnalysis(picked, language);
  };

  const reset = () => {
    setStage('upload');
    setFile(null);
    fileRef.current = null;
    setReport(null);
    setAnalysisText(null);
    setAnalysisError(null);
    setExpanded([]);
    setExplanationErrors({});
  };

  /* ------------------------------------------------------------------ */
  /* Language switch: refresh the summary and any open explanations       */
  /* ------------------------------------------------------------------ */

  const changeLanguage = async (next: Language) => {
    setLanguage(next);
    if (!report) return;

    setSummaryBusy(true);
    try {
      const response = await getReportSummary(report.reportId, next);
      setAnalysisText(response.summary_text || null);
      setReport((prev) => (prev ? { ...prev, summaryText: response.summary_text } : prev));
    } catch {
      /* keep the previous summary if the switch fails */
    } finally {
      setSummaryBusy(false);
    }

    /* Explanations are written in one language, so the old text is no longer
       relevant. Clear it and close the cards rather than silently spending
       another AI call on every open card. */
    setReport((prev) =>
      prev
        ? {
            ...prev,
            results: prev.results.map((r) => ({
              ...r,
              explanation: undefined,
              explanationLoading: false,
            })),
            explainedTerms: 0,
          }
        : prev,
    );
    setExpanded([]);
    setExplanationErrors({});
  };

  /* ------------------------------------------------------------------ */
  /* Explain a single test                                               */
  /* ------------------------------------------------------------------ */

  const toggleExplain = (result: LabResult) => {
    const isOpen = expanded.includes(result.id);

    if (isOpen) {
      setExpanded((prev) => prev.filter((id) => id !== result.id));
      return;
    }

    setExpanded((prev) => [...prev, result.id]);

    /* Already explained in this language? The backend caches, so re-opening
       is free, but we still need the text locally. */
    if (result.explanation) return;

    const applyExplanation = (text: string) =>
      setReport((prev) =>
        prev
          ? {
              ...prev,
              results: prev.results.map((r) =>
                r.id === result.id
                  ? { ...r, explanation: text, explanationLoading: false }
                  : r,
              ),
              explainedTerms: prev.results.filter((r) => r.explanation).length + 1,
            }
          : prev,
      );

    setReport((prev) =>
      prev
        ? {
            ...prev,
            results: prev.results.map((r) =>
              r.id === result.id ? { ...r, explanationLoading: true } : r,
            ),
          }
        : prev,
    );

    void explainTest(report!.reportId, result.name, language)
      .then((response) => applyExplanation(response.explanation))
      .catch((err: unknown) => {
        setReport((prev) =>
          prev
            ? {
                ...prev,
                results: prev.results.map((r) =>
                  r.id === result.id ? { ...r, explanationLoading: false } : r,
                ),
              }
            : prev,
        );
        setExplanationErrors((prev) => ({
          ...prev,
          [result.id]:
            err instanceof ApiError ? err.message : 'Could not explain this test right now.',
        }));
      });
  };

  /* ------------------------------------------------------------------ */
  /* Derived                                                             */
  /* ------------------------------------------------------------------ */

  const counts = report ? countByStatus(report.results) : null;
  const withinRange = counts ? counts.normal + counts.attention : 0;

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Orayan AI"
        title="Understand your medical reports"
        description="Upload a report and Orayan reads every value, highlights anything outside the reference range, and explains the medical terms in plain language."
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
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="upload-title" className="text-base font-bold text-ink-900">
                  Step 1 — Upload medical report
                </h2>
                <p className="mt-1 text-sm text-ink-600">
                  Blood tests, lipid profiles, thyroid panels or any lab report.
                </p>
              </div>
              <LanguageToggle value={language} onChange={(next) => void changeLanguage(next)} />
            </div>
            <DropZone
              file={file}
              onFile={(f) => setFile(f)}
              onClear={() => setFile(null)}
            />
            <div className="mt-5 flex items-center justify-end gap-3">
              {!online ? (
                <p className="text-xs text-ink-500">{OFFLINE_NOTICE}</p>
              ) : null}
              <button
                type="button"
                className={buttonClass('primary', 'md')}
                disabled={!file || !online}
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
                'Reads each measured value straight from your report.',
                'Compares every value against the reference range on the report.',
                'Explains what each result means in plain language.',
                'Answers your follow-up questions in English or Sinhala.',
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
        <AnalysisProgress fileName={file.name} onCancel={reset} />
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
              {analysisText ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-50 px-3 py-1 text-xs font-bold text-ok-700">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Analysis complete
                </span>
              ) : analysisError ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-alert-50 px-3 py-1 text-xs font-bold text-alert-700">
                  <TriangleAlert className="h-3.5 w-3.5" aria-hidden /> Analysis failed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-bold text-ink-600">
                  <Unplug className="h-3.5 w-3.5" aria-hidden /> Reading values only
                </span>
              )}
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
              <span>Reference: {report.reportId.slice(0, 8)}</span>
            </p>
          </section>

          {/* Analysis failed */}
          {analysisError ? (
            <section
              className="glass rounded-3xl border border-alert-100 p-5 sm:p-6"
              aria-labelledby="analysis-error-title"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-alert-50 text-alert-600">
                  <TriangleAlert className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h2 id="analysis-error-title" className="text-base font-bold text-ink-900">
                    Could not read that report
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">
                    {analysisError}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={buttonClass('primary', 'sm')}
                      onClick={retryAnalysis}
                      disabled={!online}
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      className={buttonClass('secondary', 'sm')}
                      onClick={reset}
                    >
                      Start over
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* Summary */}
          {analysisText ? (
            <section
              className="glass-tint rounded-3xl p-5 sm:p-6"
              aria-labelledby="analysis-title"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-aqua-500 text-white shadow-[0_12px_24px_-16px_rgba(37,99,235,0.9)]">
                    <Bot className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 id="analysis-title" className="text-base font-bold text-ink-900">
                      Report summary
                    </h2>
                    <p className="truncate text-xs text-ink-500">{report.fileName}</p>
                  </div>
                </div>
                <LanguageToggle
                  value={language}
                  onChange={(next) => void changeLanguage(next)}
                  disabled={summaryBusy}
                />
              </div>

              {analysisText ? (
                <ReportMarkdown text={analysisText} className="mt-4" />
              ) : null}

              <p className="mt-5 rounded-2xl border border-warn-100 bg-white/70 px-4 py-3 text-xs leading-relaxed text-warn-700">
                This explanation is provided for understanding your report and is not a medical
                diagnosis. Share it with your doctor or pharmacist for advice that fits your
                history.
              </p>
            </section>
          ) : null}

          {/* Extracted values */}
          {counts && report.results.length > 0 ? (
            <>
              <section className="glass-tint rounded-3xl p-5 sm:p-6" aria-labelledby="stats-title">
                <h2 id="stats-title" className="text-base font-bold text-ink-900">
                  What the numbers say
                </h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryStat value={counts.total} label="values analyzed" tone="text-ink-900" />
                  <SummaryStat value={withinRange} label="within reference range" tone="text-ok-600" />
                  <SummaryStat value={counts.outside} label="outside reference range" tone="text-alert-600" />
                  <SummaryStat
                    value={report.explainedTerms}
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
                      language={language}
                      onLanguageChange={(next) => void changeLanguage(next)}
                      expanded={expanded.includes(r.id)}
                      onExplain={() => toggleExplain(r)}
                      onHide={() => toggleExplain(r)}
                      explanationError={explanationErrors[r.id]}
                    />
                  ))}
                </div>
              </section>

              {/* Level 3 — ask questions about this report */}
              <AskOrayan
                reportId={report.reportId}
                reportName={report.fileName}
                language={language}
                onLanguageChange={(next) => void changeLanguage(next)}
              />
            </>
          ) : null}

          {/* Follow-ups */}
          <section className="flex flex-col gap-3 sm:flex-row">
            <Link to="/dashboard" className={buttonClass('secondary', 'md', 'flex-1 justify-center')}>
              See it on your dashboard
            </Link>
            <Link to="/doctor-prep" className={buttonClass('primary', 'md', 'flex-1 justify-center')}>
              Prepare questions for your doctor
            </Link>
          </section>
        </div>
      ) : null}

      {stage === 'done' && !report && !analysisError ? (
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