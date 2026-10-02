import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-7 animate-fade-up sm:mb-9', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          {icon ? (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-500 to-aqua-500 text-white shadow-[0_10px_24px_-14px_rgba(37,99,235,0.9)]">
              {icon}
            </span>
          ) : null}
          <div>
            {eyebrow ? (
              <p className="mb-1 text-xs font-semibold tracking-widest text-primary-600 uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-2xl font-bold text-ink-900 sm:text-[1.85rem]">{title}</h1>
            {description ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2 sm:shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
