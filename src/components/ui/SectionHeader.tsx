import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  className?: string;
  action?: React.ReactNode;
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
  action,
}: SectionHeaderProps) {
  const centered = align === 'center';
  return (
    <header
      id={id}
      className={cn(
        'mb-8 flex flex-col gap-3 sm:mb-10',
        centered ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/70 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary-700 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-aqua-500" aria-hidden />
          {eyebrow}
        </span>
      ) : null}
      <h2 className="max-w-3xl text-2xl leading-tight font-bold text-ink-900 sm:text-3xl lg:text-[2.15rem]">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-2xl text-base leading-relaxed text-ink-600">{subtitle}</p>
      ) : null}
      {action}
    </header>
  );
}
