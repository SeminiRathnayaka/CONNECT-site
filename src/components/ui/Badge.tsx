import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type BadgeTone =
  | 'primary'
  | 'aqua'
  | 'ok'
  | 'warn'
  | 'alert'
  | 'neutral'
  | 'violet';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

const tones: Record<BadgeTone, string> = {
  primary: 'bg-primary-50 text-primary-700 border-primary-100',
  aqua: 'bg-aqua-50 text-aqua-700 border-aqua-100',
  ok: 'bg-ok-50 text-ok-700 border-ok-100',
  warn: 'bg-warn-50 text-warn-700 border-warn-100',
  alert: 'bg-alert-50 text-alert-700 border-alert-100',
  neutral: 'bg-ink-100 text-ink-700 border-ink-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
};

export function Badge({ tone = 'primary', children, className, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
