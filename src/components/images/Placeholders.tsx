import { useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface BasePlaceholderProps {
  label?: string;
  className?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

/** Decorative surface shared by all image placeholders. */
function BasePlaceholder({ label, className, icon, children }: BasePlaceholderProps) {
  return (
    <div
      className={cn(
        'relative isolate flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[inherit]',
        'bg-gradient-to-br from-primary-100 via-white to-aqua-100',
        className,
      )}
      aria-hidden
    >
      <span className="absolute -top-10 -right-8 h-32 w-32 rounded-full bg-primary-200/50 blur-2xl" />
      <span className="absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-aqua-200/50 blur-2xl" />
      {children}
      {icon ? (
        <span className="relative z-10 grid h-12 w-12 place-items-center rounded-2xl bg-white/70 text-primary-600 shadow-sm">
          {icon}
        </span>
      ) : null}
      {label ? (
        <span className="relative z-10 mt-3 px-4 text-center text-xs font-semibold tracking-wide text-primary-700/80">
          {label}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Named placeholders (easy to swap for real photography later)        */
/* ------------------------------------------------------------------ */

export function FamilyImagePlaceholder({
  label = 'Family health, together',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <BasePlaceholder label={label} className={className}>
      <svg viewBox="0 0 320 200" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="0" y="140" width="320" height="60" fill="rgba(255,255,255,0.45)" />
        <g fill="#93c5fd" opacity="0.85">
          <circle cx="86" cy="96" r="18" />
          <path d="M64 140c0-13 10-24 22-24s22 11 22 24z" />
        </g>
        <g fill="#5eead4" opacity="0.9">
          <circle cx="140" cy="84" r="22" />
          <path d="M113 140c0-15 12-28 27-28s27 13 27 28z" />
        </g>
        <g fill="#60a5fa" opacity="0.85">
          <circle cx="198" cy="94" r="18" />
          <path d="M176 140c0-13 10-24 22-24s22 11 22 24z" />
        </g>
        <g fill="#c4b5fd" opacity="0.9">
          <circle cx="246" cy="104" r="14" />
          <path d="M229 140c0-10 8-18 17-18s17 8 17 18z" />
        </g>
        <path
          d="M60 62c8-14 26-14 32-2 6-12 24-12 32 2 6 12-4 24-32 44-28-20-38-32-32-44z"
          fill="#fda4af"
          opacity="0.8"
        />
      </svg>
    </BasePlaceholder>
  );
}

export function DoctorImagePlaceholder({
  label = 'Clinical expertise',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <BasePlaceholder label={label} className={className}>
      <svg viewBox="0 0 320 200" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="118" y="58" width="84" height="96" rx="14" fill="rgba(255,255,255,0.85)" />
        <rect x="132" y="78" width="56" height="8" rx="4" fill="#bfdbfe" />
        <rect x="132" y="94" width="44" height="8" rx="4" fill="#ccfbf1" />
        <rect x="132" y="110" width="50" height="8" rx="4" fill="#dbeafe" />
        <path
          d="M160 44c-18 0-30 12-30 28 0 14 10 22 20 26v10h20V98c10-4 20-12 20-26 0-16-12-28-30-28z"
          fill="#2563eb"
          opacity="0.16"
        />
        <circle cx="160" cy="72" r="10" fill="#2563eb" opacity="0.5" />
        <path d="M232 70v40M212 90h40" stroke="#14b8a6" strokeWidth="10" strokeLinecap="round" opacity="0.55" />
      </svg>
    </BasePlaceholder>
  );
}

export function ReportImagePlaceholder({
  label = 'Medical report',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <BasePlaceholder label={label} className={className}>
      <svg viewBox="0 0 320 200" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="96" y="40" width="128" height="130" rx="12" fill="rgba(255,255,255,0.9)" />
        <rect x="112" y="58" width="60" height="9" rx="4.5" fill="#93c5fd" />
        <g>
          <rect x="112" y="82" width="16" height="46" rx="5" fill="#60a5fa" />
          <rect x="136" y="96" width="16" height="32" rx="5" fill="#38bdf8" />
          <rect x="160" y="76" width="16" height="52" rx="5" fill="#2dd4bf" />
          <rect x="184" y="104" width="16" height="24" rx="5" fill="#f59e0b" />
        </g>
        <rect x="112" y="140" width="96" height="7" rx="3.5" fill="#e2eaf2" />
        <rect x="112" y="153" width="70" height="7" rx="3.5" fill="#e2eaf2" />
      </svg>
    </BasePlaceholder>
  );
}

export function DashboardImagePlaceholder({
  label = 'Centralized health dashboard',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative isolate flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit]',
        'bg-gradient-to-br from-ink-900 via-ink-800 to-primary-900',
        className,
      )}
      aria-hidden
    >
      <div className="relative w-[86%] max-w-md rounded-2xl bg-white/95 p-4 shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-alert-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-ok-500/80" />
          <span className="ml-2 h-2 w-24 rounded bg-ink-100" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg bg-primary-50 p-2">
              <div className="mb-1.5 h-1.5 w-8 rounded bg-primary-200" />
              <div className="h-3 w-10 rounded bg-primary-500/70" />
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-end gap-1.5 rounded-lg bg-ink-50 p-3">
          {[34, 52, 40, 66, 48, 74, 58].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-primary-500 to-aqua-400"
              style={{ height: h }}
            />
          ))}
        </div>
      </div>
      <span className="absolute right-4 bottom-3 text-[10px] font-semibold tracking-wider text-white/60 uppercase">
        {label}
      </span>
    </div>
  );
}

export function HealthcareImagePlaceholder({
  label = 'Your health, organized',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <BasePlaceholder label={label} className={className}>
      <svg viewBox="0 0 320 200" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="60" y="54" width="200" height="112" rx="16" fill="rgba(255,255,255,0.75)" />
        <path
          d="M74 120h34l12-26 16 44 14-30 10 12h56"
          fill="none"
          stroke="#2563eb"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />
        <circle cx="236" cy="66" r="26" fill="#14b8a6" opacity="0.35" />
        <path
          d="M236 54v24M224 66h24"
          stroke="#0f766e"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
    </BasePlaceholder>
  );
}

/* ------------------------------------------------------------------ */
/* Smart image: local asset with a graceful placeholder fallback       */
/* ------------------------------------------------------------------ */

interface SmartImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  imgClassName?: string;
}

export function SmartImage({ src, alt, className, fallback, imgClassName }: SmartImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div className={cn('relative isolate overflow-hidden rounded-[inherit]', className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      ) : (
        fallback ?? <HealthcareImagePlaceholder label={alt} />
      )}
    </div>
  );
}
