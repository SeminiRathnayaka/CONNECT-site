import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Languages,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type { LabResult } from '../../types';
import type { Language } from '../../lib/api';
import { cn } from '../../utils/cn';
import { buttonClass } from '../../components/ui/Button';
import { LanguageToggle } from '../../components/ui/LanguageToggle';
import { ReportMarkdown } from '../../components/ui/ReportMarkdown';

/* ------------------------------------------------------------------ */
/* Upload zone                                                         */
/* ------------------------------------------------------------------ */

export interface PickedFile {
  name: string;
  sizeKB: number;
  /** The real file, so it can actually be uploaded to Orayan. */
  file: File;
}

const ACCEPTED = ['pdf', 'png', 'jpg', 'jpeg'];
const MAX_BYTES = 12 * 1024 * 1024;

interface DropZoneProps {
  file: PickedFile | null;
  onFile: (file: PickedFile) => void;
  onClear: () => void;
}

export function DropZone({ file, onFile, onClear }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (name: string, sizeBytes: number) => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPTED.includes(ext)) {
      setError('Unsupported file. Please upload a PDF, PNG, JPG or JPEG.');
      return false;
    }
    if (sizeBytes > MAX_BYTES) {
      setError('File is larger than 12 MB. Please upload a smaller document.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    const first = files?.[0];
    if (!first) return;
    if (!validate(first.name, first.size)) return;
    onFile({
      name: first.name,
      sizeKB: Math.max(Math.round(first.size / 1024), 1),
      file: first,
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (file) {
    return (
      <div className="glass flex flex-col items-center gap-4 rounded-3xl px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ok-50 text-ok-600">
            <FileText className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="truncate text-sm font-bold text-ink-900">{file.name}</p>
            <p className="text-xs text-ink-500">
              {file.sizeKB} KB · ready to analyze
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className={buttonClass('ghost', 'sm')} onClick={onClear}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'glass flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition duration-200',
          dragging
            ? 'scale-[1.01] border-primary-400 bg-primary-50/70'
            : 'border-primary-200 hover:border-primary-300 hover:bg-white/70',
        )}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Upload a medical report: drag a file here or press Enter to browse"
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-aqua-500 text-white shadow-[0_16px_30px_-18px_rgba(37,99,235,0.9)]">
          <UploadCloud className="h-7 w-7" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold text-ink-900 sm:text-base">
            Drag & drop your medical report
          </p>
          <p className="mt-1 text-xs text-ink-500 sm:text-sm">
            or <span className="font-semibold text-primary-600">browse files</span> — PDF, PNG,
            JPG up to 12 MB
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <p className="mt-3 text-center text-xs text-ink-400">
        Your report is uploaded to your own AI server so the values can be read. It is never shared
        with any third-party service.
      </p>

      {error ? (
        <p
          className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-alert-600"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Analysis progress                                                   */
/* ------------------------------------------------------------------ */

const steps = [
  'Preparing the request…',
  'Connecting to the AI model…',
  'Waiting for the analysis…',
  'Formatting the explanation…',
];

export function AnalysisProgress({
  fileName,
  onCancel,
}: {
  fileName: string;
  onCancel: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      setProgress(Math.min(8 + elapsed * 28, 92));
    }, 60);
    return () => window.clearInterval(timer);
  }, []);

  const stepIndex = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);

  return (
    <div className="glass flex flex-col items-center gap-5 rounded-3xl px-6 py-12 text-center animate-fade-in">
      <div className="relative">
        <span className="grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-primary-500 to-aqua-500 text-white">
          <Loader2 className="h-8 w-8 animate-spin-slow" aria-hidden />
        </span>
        <span className="absolute -right-1 -bottom-1 grid h-6 w-6 place-items-center rounded-full bg-white text-primary-600 shadow">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>

      <div>
        <h3 className="text-base font-bold text-ink-900">Orayan is analyzing your report</h3>
        <p className="mt-1 max-w-md truncate text-sm text-ink-500">{fileName}</p>
      </div>

      <div className="w-full max-w-md">
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Report analysis progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-aqua-400 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 space-y-2 text-left">
          {steps.map((s, i) => (
            <p
              key={s}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                i < stepIndex
                  ? 'text-ok-600'
                  : i === stepIndex
                    ? 'font-semibold text-primary-600'
                    : 'text-ink-400',
              )}
            >
              {i < stepIndex ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              ) : i === stepIndex ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin-slow" aria-hidden />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-ink-200" aria-hidden />
              )}
              {s}
            </p>
          ))}
        </div>
      </div>

      <button type="button" className={buttonClass('ghost', 'sm')} onClick={onCancel}>
        Cancel analysis
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Result card with range bar + explanation                            */
/* ------------------------------------------------------------------ */

interface ResultCardProps {
  result: LabResult;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  expanded: boolean;
  onExplain: () => void;
  onHide: () => void;
  explanationError?: string | null;
}

export function ResultCard({
  result,
  language,
  onLanguageChange,
  expanded,
  onExplain,
  onHide,
  explanationError,
}: ResultCardProps) {
  const zoneLow = result.refLow;
  const zoneHigh = result.refHigh;
  const hasRange = zoneLow !== null && zoneHigh !== null;

  const visualLow = hasRange ? Math.min(zoneLow, result.value * 0.75) : result.value * 0.75;
  const visualHigh = hasRange ? Math.max(zoneHigh, result.value * 1.15) : result.value * 1.15;
  const span = visualHigh - visualLow || 1;
  const clamp = (v: number) => Math.min(Math.max(((v - visualLow) / span) * 100, 0), 100);

  const zoneLeft = hasRange ? clamp(zoneLow) : 0;
  const zoneWidth = hasRange ? clamp(zoneHigh) - zoneLeft : 0;
  const marker = clamp(result.value);

  const statusTone =
    result.status === 'normal'
      ? 'ok'
      : result.status === 'attention'
        ? 'warn'
        : 'alert';
  const toneText =
    statusTone === 'ok'
      ? 'text-ok-700'
      : statusTone === 'warn'
        ? 'text-warn-700'
        : 'text-alert-700';
  const toneBg =
    statusTone === 'ok' ? 'bg-ok-500' : statusTone === 'warn' ? 'bg-warn-500' : 'bg-alert-500';
  const markerColor =
    statusTone === 'ok' ? '#10b981' : statusTone === 'warn' ? '#f59e0b' : '#ef4444';

  const statusLabel =
    result.status === 'normal'
      ? 'Within reference range'
      : result.status === 'attention'
        ? 'Attention'
        : 'Outside reference range';

  return (
    <article className="glass rounded-2xl p-4 transition hover:border-primary-200 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-ink-900">{result.name}</h4>
          <p className="mt-0.5 text-xs text-ink-500">{result.note}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-ink-900">
            {result.valueText}
            <span className="ml-1 text-xs font-medium text-ink-500">{result.unit}</span>
          </p>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white/80 px-2 py-0.5 text-[11px] font-semibold',
              toneText,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', toneBg)} aria-hidden />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Range visual */}
      <div className="mt-3.5">
        {hasRange ? (
          <div className="relative h-2 rounded-full bg-ink-100">
            <div
              className="absolute inset-y-0 rounded-full bg-ok-100"
              style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }}
            />
            <span
              className="absolute -top-1 h-4 w-1.5 rounded-full shadow"
              style={{ left: `${marker}%`, background: markerColor }}
              aria-hidden
            />
          </div>
        ) : (
          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
            No numeric reference range was printed for this test, so Orayan cannot judge whether it
            is within range.
          </p>
        )}
        <div className="mt-1.5 flex justify-between gap-2 text-[11px] text-ink-400">
          <span>{hasRange ? `${result.refLow} ${result.unit}` : ''}</span>
          <span className="font-semibold text-ink-600">Reference: {result.reference}</span>
          <span>{hasRange ? `${result.refHigh} ${result.unit}` : ''}</span>
        </div>
      </div>

      <div className="mt-3 border-t border-ink-100 pt-3">
        {!expanded ? (
          <button
            type="button"
            onClick={onExplain}
            disabled={result.explanationLoading}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
          >
            {result.explanationLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin-slow" aria-hidden />
            ) : (
              <Languages className="h-3.5 w-3.5" aria-hidden />
            )}
            {result.explanationLoading ? 'Explaining…' : 'Explain simply'}
          </button>
        ) : (
          <div className="animate-fade-in rounded-xl border border-primary-100 bg-primary-50/60 p-3.5">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold text-primary-700">{result.name}</p>
              <LanguageToggle
                value={language}
                onChange={onLanguageChange}
                className="text-[10px]"
              />
            </div>

            {result.explanationLoading ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-xs text-ink-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin-slow" aria-hidden />
                  Orayan is writing this explanation…
                </p>
                <div className="h-2.5 w-full animate-pulse-soft rounded-full bg-white/80" />
                <div className="h-2.5 w-4/5 animate-pulse-soft rounded-full bg-white/80" />
              </div>
            ) : explanationError ? (
              <p className="flex items-start gap-2 text-xs leading-relaxed text-alert-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {explanationError}
              </p>
            ) : (
              <ReportMarkdown
                text={result.explanation ?? ''}
                className="space-y-2 text-xs [&_p]:text-xs [&_li]:text-xs"
              />
            )}

            <button
              type="button"
              onClick={onHide}
              className="mt-2.5 text-[11px] font-bold text-primary-600 hover:underline"
            >
              Hide explanation
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
