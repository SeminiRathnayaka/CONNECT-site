import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

const LETTERS = ['C', 'O', 'N', 'N', 'E', 'C', 'T'];

const LEAVE_MS = 3500;
const DONE_MS = 4150;
const SKIP_FADE_MS = 600;

export function IntroSplash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const skip = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => onDoneRef.current(), SKIP_FADE_MS);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const leaveTimer = window.setTimeout(
      () => setLeaving(true),
      reduced ? 300 : LEAVE_MS,
    );
    const doneTimer = window.setTimeout(
      () => onDoneRef.current(),
      reduced ? 800 : DONE_MS,
    );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') skip();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [skip]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden',
        'bg-gradient-to-br from-primary-50 via-white to-aqua-50',
        'cursor-pointer select-none',
        leaving && 'pointer-events-none animate-intro-out',
      )}
      onClick={skip}
      role="presentation"
    >
      {/* background glow */}
      <span className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary-200/40 blur-3xl animate-pulse-soft" />
      <span className="absolute -right-32 -bottom-40 h-[28rem] w-[28rem] rounded-full bg-aqua-200/40 blur-3xl animate-pulse-soft" />

      <div className="relative flex flex-col items-center px-6">
        {/* Logo inside spinning loading ring */}
        <button
          type="button"
          aria-label="Skip intro"
          onClick={(e) => {
            e.stopPropagation();
            skip();
          }}
          className="group relative grid h-44 w-44 cursor-pointer place-items-center sm:h-48 sm:w-48"
        >
          <svg
            viewBox="0 0 180 180"
            className="absolute inset-0 h-full w-full animate-intro-spin"
            aria-hidden
          >
            <defs>
              <linearGradient id="intro-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <circle cx="90" cy="90" r="80" fill="none" stroke="#dbe7f5" strokeWidth="7" />
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke="url(#intro-grad)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="130 373"
            />
          </svg>

          <span className="absolute inset-5 rounded-full bg-white/80 shadow-[0_20px_50px_-24px_rgba(16,35,58,0.45)] ring-1 ring-white" />

          <span
            className="relative block w-32 animate-pop-in sm:w-36"
            style={{ animationDelay: '0.25s' }}
          >
            <img
              src="/connect-logo-wide.png"
              alt=""
              className="w-full rounded-lg transition-transform duration-300 ease-out group-hover:scale-110"
            />
          </span>
        </button>

        {/* Wordmark */}
        <h1 className="mt-7 flex text-3xl font-extrabold tracking-[0.32em] text-ink-900 sm:text-4xl">
          {LETTERS.map((ch, i) => (
            <span
              key={i}
              className="inline-block animate-intro-letter"
              style={{ animationDelay: `${0.75 + i * 0.08}s` }}
            >
              <span className="inline-block cursor-default transition duration-200 ease-out hover:-translate-y-1.5 hover:text-primary-600">
                {ch}
              </span>
            </span>
          ))}
        </h1>

        {/* Tagline */}
        <p
          className="mt-3 animate-fade-up text-sm font-medium tracking-wide text-ink-500"
          style={{ animationDelay: '1.9s' }}
        >
          Your Comprehensive Personal Health Companion
        </p>

        {/* Progress bar */}
        <span className="mt-7 block h-1.5 w-44 overflow-hidden rounded-full bg-primary-100/80">
          <span className="block h-full rounded-full bg-gradient-to-r from-primary-500 to-aqua-500 animate-intro-progress" />
        </span>
      </div>

      {/* Skip hint */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
        className="absolute bottom-8 animate-fade-in rounded-full border border-white/80 bg-white/70 px-5 py-2 text-xs font-semibold text-ink-500 opacity-0 backdrop-blur transition-all duration-300 hover:border-primary-300 hover:bg-white hover:text-primary-600"
        style={{ animationDelay: '2.4s' }}
        aria-label="Skip intro animation"
      >
        Skip intro
      </button>
    </div>
  );
}
