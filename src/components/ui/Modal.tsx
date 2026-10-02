import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center animate-fade-in sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-ink-950/35 backdrop-blur-[3px]"
        aria-label="Close dialog"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'glass-strong relative max-h-[92vh] w-full animate-pop-in overflow-y-auto rounded-t-3xl p-6 sm:rounded-3xl',
          sizes[size],
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 id={titleId} className="text-lg font-bold text-ink-900">
              {title}
            </h3>
            {description ? (
              <p id={descId} className="mt-1 text-sm text-ink-600">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border border-ink-200 bg-white/70 p-2 text-ink-500 transition hover:border-primary-200 hover:text-primary-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-sm text-ink-700">{children}</div>

        {footer ? (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
