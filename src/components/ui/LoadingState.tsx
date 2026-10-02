import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = 'Loading…', className }: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-3xl py-16 text-ink-500 ${className ?? ''}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-7 w-7 animate-spin-slow text-primary-500" aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
