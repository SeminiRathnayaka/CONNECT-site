import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent?: 'blue' | 'teal' | 'violet' | 'amber' | 'rose';
  className?: string;
}

const accents = {
  blue: 'bg-primary-50 text-primary-600 group-hover:bg-primary-600',
  teal: 'bg-aqua-50 text-aqua-600 group-hover:bg-aqua-600',
  violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-600',
  amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600',
  rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
};

export function FeatureCard({
  icon,
  title,
  subtitle,
  onClick,
  accent = 'blue',
  className,
}: FeatureCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'glass group relative flex w-full items-center gap-3.5 overflow-hidden rounded-2xl p-4 text-left card-lift',
        className,
      )}
    >
      <span
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors duration-300 group-hover:text-white',
          accents[accent],
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-ink-900">{title}</span>
        <span className="block truncate text-xs text-ink-500">{subtitle}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-600" />
    </button>
  );
}
