import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '../utils/cn';

export type ToastTone = 'success' | 'info' | 'warning';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
  success: 'text-ok-600',
  info: 'text-primary-600',
  warning: 'text-warn-600',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      window.setTimeout(() => remove(id), 3600);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="glass-strong pointer-events-auto flex w-full max-w-sm animate-pop-in items-center gap-3 rounded-2xl px-4 py-3"
          >
            <span className={toneStyles[t.tone]}>
              {t.tone === 'success' ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              ) : t.tone === 'warning' ? (
                <TriangleAlert className="h-5 w-5" aria-hidden />
              ) : (
                <Info className="h-5 w-5" aria-hidden />
              )}
            </span>
            <p className="flex-1 text-sm font-medium text-ink-800">{t.message}</p>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className={cn('rounded-full p-1 transition hover:bg-ink-100', 'text-ink-500')}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
