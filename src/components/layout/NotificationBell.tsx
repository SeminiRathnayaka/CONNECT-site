import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  FileSearch,
  Pill,
} from 'lucide-react';
import type { NotificationType } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../utils/cn';

const typeStyle: Record<NotificationType, { icon: typeof Bell; className: string }> = {
  appointment: { icon: CalendarClock, className: 'bg-primary-50 text-primary-600' },
  medication: { icon: Pill, className: 'bg-aqua-50 text-aqua-600' },
  report: { icon: FileSearch, className: 'bg-warn-50 text-warn-600' },
  symptom: { icon: ClipboardList, className: 'bg-alert-50 text-alert-600' },
  system: { icon: Bell, className: 'bg-ink-100 text-ink-500' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, []);

  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative grid h-9 w-9 place-items-center rounded-xl border border-white/70 bg-white/60 text-ink-700 transition hover:bg-white',
          open && 'bg-white',
        )}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications, none unread'
        }
        aria-haspopup="true"
        aria-expanded={open}
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-primary-600" aria-hidden />
        ) : (
          <Bell className="h-5 w-5" aria-hidden />
        )}

        {unreadCount > 0 ? (
          <span
            key={unreadCount}
            className="absolute -top-1.5 -right-1.5 grid min-w-4 animate-pop-in place-items-center rounded-full bg-alert-500 px-1 text-[10px] leading-4 font-bold text-white shadow-[0_4px_10px_-3px_rgba(239,68,68,0.9)] ring-2 ring-white"
          >
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="glass-strong absolute right-0 z-50 mt-2 w-[22rem] origin-top-right animate-pop-in rounded-2xl p-2 sm:w-96"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-3 pt-1 pb-3">
            <div>
              <p className="text-sm font-bold text-ink-900">Notifications</p>
              <p className="text-xs text-ink-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1.5 text-[11px] font-bold text-primary-700 transition hover:bg-primary-100"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                Mark all read
              </button>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink-100 text-ink-400">
                <Bell className="h-5 w-5" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-ink-700">You're all caught up</p>
              <p className="text-xs text-ink-500">
                Reminders about appointments, medications and reports will appear here.
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {notifications.map((n) => {
                const style = typeStyle[n.type] ?? typeStyle.system;
                const Icon = style.icon;
                const content = (
                  <>
                    <span
                      className={cn(
                        'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                        style.className,
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            'text-sm leading-snug',
                            n.read ? 'font-medium text-ink-500' : 'font-bold text-ink-900',
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-ink-400">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                        {n.body}
                      </span>
                    </span>
                    {!n.read ? (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-500"
                        aria-label="Unread"
                      />
                    ) : null}
                  </>
                );

                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => {
                          markRead(n.id);
                          setOpen(false);
                        }}
                        className={cn(
                          'mx-1.5 flex w-[calc(100%-0.75rem)] items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/80',
                          !n.read && 'bg-primary-50/60',
                        )}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className={cn(
                          'mx-1.5 flex w-[calc(100%-0.75rem)] items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/80',
                          !n.read && 'bg-primary-50/60',
                        )}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {notifications.length > 0 ? (
            <div className="border-t border-ink-100 px-2 pt-2 pb-1">
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setOpen(false);
                }}
                className="w-full rounded-xl px-3 py-2 text-xs font-semibold text-ink-500 transition hover:bg-ink-100 hover:text-ink-700"
              >
                Clear all notifications
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
