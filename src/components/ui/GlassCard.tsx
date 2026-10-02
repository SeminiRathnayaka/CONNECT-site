import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

type GlassVariant = 'default' | 'strong' | 'tint' | 'outline';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  hover?: boolean;
  glow?: boolean;
  padded?: boolean;
  children: ReactNode;
}

const variants: Record<GlassVariant, string> = {
  default: 'glass',
  strong: 'glass-strong',
  tint: 'glass-tint',
  outline: 'bg-white/60 border border-primary-100',
};

export function GlassCard({
  variant = 'default',
  hover = false,
  glow = false,
  padded = true,
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl',
        variants[variant],
        hover && 'card-lift',
        glow && 'glow-hover',
        padded && 'p-5 sm:p-6',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
