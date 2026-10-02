import { useCallback, useEffect, useState } from 'react';
import { checkHealth } from '../lib/api';

export type AiStatus = 'checking' | 'online' | 'offline';

/**
 * Polls the AI backend /health endpoint so the UI can show whether Baymax and
 * Orayan are actually reachable, rather than guessing from build-time env
 * variables.
 */
export function useAiStatus(intervalMs = 20000) {
  const [status, setStatus] = useState<AiStatus>('checking');

  const refresh = useCallback(() => {
    checkHealth()
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'));
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, intervalMs);
    return () => window.clearInterval(timer);
  }, [refresh, intervalMs]);

  return { status, online: status === 'online', refresh };
}