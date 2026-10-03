import { useCallback, useEffect, useState } from 'react';
import { ApiError, deleteReport, listReports } from '../lib/api';
import type { ReportListItem } from '../lib/api';
import type { MedicalReport } from '../types';
import { useReports } from './useReports';

/** Converts the server's report index entry into the UI's MedicalReport shape. */
function toMedicalReport(item: ReportListItem): MedicalReport {
  const summary = item.summary;
  return {
    id: item.report_id,
    reportId: item.report_id,
    fileName: item.filename,
    type: item.source === 'image' ? 'Scanned Report' : 'Lab Report',
    date: item.created_at.slice(0, 10),
    lab: 'Not provided',
    patient: 'Not set',
    results: [],
    explainedTerms: 0,
    uploadedAt: item.created_at.slice(0, 10),
    counts: {
      total: summary.total ?? 0,
      inRange: summary.in_range ?? 0,
      low: summary.low ?? 0,
      high: summary.high ?? 0,
      unknown: summary.unknown ?? 0,
      qualitative: summary.qualitative ?? 0,
      flaggedTotal: summary.flagged_total ?? 0,
    },
  };
}

/**
 * Report history lives in the AI server's PostgreSQL database and is scoped to
 * the signed-in account, so it survives restarts and nobody else can list it.
 * The localStorage copy is only a mirror, keyed per account, so the dashboard
 * can paint immediately.
 */
export function useServerReports() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setCached] = useReports();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listReports();
      const mapped = response.reports.map(toMedicalReport);
      setReports(mapped);
      setCached(mapped);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not load your report history.',
      );
    } finally {
      setLoading(false);
    }
  }, [setCached]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const remove = useCallback(
    async (reportId: string) => {
      try {
        await deleteReport(reportId);
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) throw err;
      }
      setReports((prev) => prev.filter((r) => r.reportId !== reportId));
      setCached((prev) => prev.filter((r) => r.reportId !== reportId));
    },
    [setCached],
  );

  return { reports, loading, error, refresh, remove };
}