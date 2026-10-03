import { useReports } from './useReports';

/**
 * Report history for the Report History screen.
 *
 * Supabase is now the single place reports live, so this is a thin wrapper
 * around useReports rather than a separate copy fetched from the AI server.
 */
export function useServerReports() {
  const { reports, loading, error, removeReport, refresh } = useReports();

  return {
    reports,
    loading,
    error,
    refresh,
    remove: removeReport,
  };
}