import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="glass flex flex-col items-center justify-center gap-3 rounded-3xl px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-500">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden />}
      </span>
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
