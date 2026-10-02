import type { ValueStatus } from '../types';

export function statusFor(value: number, low: number, high: number): ValueStatus {
  if (value < low || value > high) return 'outside';
  const span = high - low;
  if (value < low + span * 0.1 || value > high - span * 0.1) return 'attention';
  return 'normal';
}

export interface StatusMeta {
  label: string;
  dot: string;
  badge: string;
  bar: string;
}

export const STATUS_META: Record<ValueStatus, StatusMeta> = {
  normal: {
    label: 'Within reference range',
    dot: 'bg-ok-500',
    badge: 'bg-ok-50 text-ok-700 border-ok-100',
    bar: 'bg-ok-500',
  },
  attention: {
    label: 'Attention',
    dot: 'bg-warn-500',
    badge: 'bg-warn-50 text-warn-700 border-warn-100',
    bar: 'bg-warn-500',
  },
  outside: {
    label: 'Outside reference range',
    dot: 'bg-alert-500',
    badge: 'bg-alert-50 text-alert-700 border-alert-100',
    bar: 'bg-alert-500',
  },
};

export function countByStatus<T extends { status: ValueStatus }>(items: T[]) {
  return {
    total: items.length,
    normal: items.filter((i) => i.status === 'normal').length,
    attention: items.filter((i) => i.status === 'attention').length,
    outside: items.filter((i) => i.status === 'outside').length,
  };
}
