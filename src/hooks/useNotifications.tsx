import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { AppNotification, NotificationType } from '../types';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'connect_notifications';

const HOUR = 60 * 60 * 1000;

function seedNotifications(): AppNotification[] {
  const now = Date.now();
  return [
    {
      id: 'n-seed-1',
      title: 'Report analysis ready',
      body: 'Your Full Blood Count report has been analyzed by Orayan. Tap to review the results.',
      type: 'report',
      link: '/orayan',
      read: false,
      createdAt: new Date(now - 2 * HOUR).toISOString(),
    },
    {
      id: 'n-seed-2',
      title: 'Medication reminder',
      body: 'Metformin 500 mg — take one tablet with your evening meal.',
      type: 'medication',
      link: '/medications',
      read: false,
      createdAt: new Date(now - 5 * HOUR).toISOString(),
    },
    {
      id: 'n-seed-3',
      title: 'Appointment in 4 days',
      body: 'Dr. N. Fernando · Cardiology · 09:30 at Colombo Heart Centre.',
      type: 'appointment',
      link: '/appointments',
      read: false,
      createdAt: new Date(now - 26 * HOUR).toISOString(),
    },
    {
      id: 'n-seed-4',
      title: 'Lab result outside target',
      body: 'HbA1c 7.1% is above your target range of 4.0–5.6%.',
      type: 'system',
      link: '/report-history',
      read: true,
      createdAt: new Date(now - 50 * HOUR).toISOString(),
    },
  ];
}

export interface NotificationPushInput {
  title: string;
  body: string;
  type?: NotificationType;
  link?: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  push: (input: NotificationPushInput) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(
    STORAGE_KEY,
    seedNotifications(),
  );

  const push = useCallback(
    (input: NotificationPushInput) => {
      const item: AppNotification = {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: input.title,
        body: input.body,
        type: input.type ?? 'system',
        link: input.link,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [item, ...prev].slice(0, 40));
    },
    [setNotifications],
  );

  const markRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    [setNotifications],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [setNotifications]);

  const clearAll = useCallback(() => setNotifications([]), [setNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, push, markRead, markAllRead, clearAll }),
    [notifications, unreadCount, push, markRead, markAllRead, clearAll],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside <NotificationsProvider>');
  }
  return ctx;
}
