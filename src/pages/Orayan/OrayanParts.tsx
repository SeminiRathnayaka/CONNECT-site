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
import type { LabResult, TermExplanation } from '../../types';
import { cn } from '../../utils/cn';
import { buttonClass } from '../../components/ui/Button';

/* ------------------------------------------------------------------ */
/* Upload zone                                                         */
/* ------------------------------------------------------------------ */

export interface PickedFile {
  name: string;
  sizeKB: number;
}

const ACCEPTED = ['pdf', 'png', 'jpg', 'jpeg'];

interface DropZoneProps {
  file: PickedFile | null;
  onFile: (file: PickedFile) => void;
  onClear: () => void;
  onSample: () => void;
}

export function DropZone({ file, onFile, onClear, onSample }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (name: string, sizeBytes: number) => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (!ACCEPTED.includes(ext)) {
      setError('Unsupported file. Please upload a PDF, PNG, JPG or JPEG.');
      return false;
    }
    if (sizeBytes > 15 * 1024 * 1024) {
      setError('File is larger than 15 MB. Please upload a smaller document.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    const first = files?.[0];
    if (!first) return;
    if (!validate(first.name, first.size)) return;
    onFile({ name: first.name, sizeKB: Math.max(Math.round(first.size / 1024), 1) });
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
            JPG up to 15 MB
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

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className={buttonClass('soft', 'sm')} onClick={onSample}>
          <Sparkles className="h-4 w-4" aria-hidden />
          Try a sample report
        </button>
        <p className="text-xs text-ink-400">Your file stays on this device — nothing is uploaded.</p>
      </div>

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
  'Reading document…',
  'Detecting report sections…',
  'Extracting medical values…',
  'Matching reference ranges…',
  'Preparing simple explanations…',
];

export function AnalysisProgress({
  fileName,
  onCancel,
  onDone,
}: {
  fileName: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const started = Date.now();
    const total = 3400;
    const timer = window.setInterval(() => {
      const pct = Math.min(((Date.now() - started) / total) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(timer);
        if (!doneRef.current) {
          doneRef.current = true;
          onDoneRef.current();
        }
      }
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
  term?: TermExplanation;
  language: 'en' | 'si';
  onLanguageChange: (lang: 'en' | 'si') => void;
  expanded: boolean;
  onToggle: () => void;
}

export function ResultCard({
  result,
  term,
  language,
  onLanguageChange,
  expanded,
  onToggle,
}: ResultCardProps) {
  const zoneLow = result.refLow;
  const zoneHigh = result.refHigh;
  const visualLow = Math.min(zoneLow, result.value * 0.75);
  const visualHigh = Math.max(zoneHigh, result.value * 1.15);
  const span = visualHigh - visualLow || 1;
  const clamp = (v: number) => Math.min(Math.max(((v - visualLow) / span) * 100, 0), 100);

  const zoneLeft = clamp(zoneLow);
  const zoneWidth = clamp(zoneHigh) - zoneLeft;
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
            {result.value}
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
        <div className="mt-1.5 flex justify-between text-[11px] text-ink-400">
          <span>
            {result.refLow} {result.unit}
          </span>
          <span className="font-semibold text-ink-600">Reference: {result.reference}</span>
          <span>
            {result.refHigh} {result.unit}
          </span>
        </div>
      </div>

      {term ? (
        <div className="mt-3 border-t border-ink-100 pt-3">
          {!expanded ? (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 transition hover:bg-primary-100"
            >
              <Languages className="h-3.5 w-3.5" aria-hidden />
              Explain simply
            </button>
          ) : (
            <div className="animate-fade-in rounded-xl border border-primary-100 bg-primary-50/60 p-3.5">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold text-primary-700">{term.term}</p>
                <div className="flex rounded-full border border-primary-100 bg-white/80 p-0.5 text-[11px] font-bold">
                  {(['en', 'si'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => onLanguageChange(lang)}
                      className={cn(
                        'rounded-full px-2.5 py-1 transition',
                        language === lang
                          ? 'bg-primary-600 text-white'
                          : 'text-ink-500 hover:text-primary-600',
                      )}
                      aria-pressed={language === lang}
                    >
                      {lang === 'en' ? 'English' : 'සිංහල'}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-ink-700">
                <span className="font-semibold text-ink-800">Technical:</span> {term.technical}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-700">
                <span className="font-semibold text-ink-800">
                  {language === 'en' ? 'Simple English:' : 'සිංහලෙන්:'}
                </span>{' '}
                {language === 'en' ? term.simple : term.sinhala}
              </p>

              <button
                type="button"
                onClick={onToggle}
                className="mt-2.5 text-[11px] font-bold text-primary-600 hover:underline"
              >
                Hide explanation
              </button>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
