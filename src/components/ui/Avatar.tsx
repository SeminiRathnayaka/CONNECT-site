import { cn } from '../../utils/cn';

type Accent = 'blue' | 'teal' | 'violet' | 'amber' | 'rose';

const accents: Record<Accent, string> = {
  blue: 'from-primary-500 to-primary-700',
  teal: 'from-aqua-400 to-aqua-600',
  violet: 'from-violet-500 to-violet-700',
  amber: 'from-amber-400 to-amber-600',
  rose: 'from-rose-400 to-rose-600',
};

interface AvatarProps {
  name: string;
  initials?: string;
  accent?: Accent;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

export function Avatar({ name, initials, accent = 'blue', size = 'md', className }: AvatarProps) {
  const label = initials
    ?? name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-2 ring-white/70',
        accents[accent],
        sizes[size],
        className,
      )}
      role="img"
      aria-label={name}
    >
      {label || '?'}
    </span>
  );
}
