import { useCallback } from 'react';
import type { MedicalReport } from '../types';
import { useAuth } from './useAuth';
import { useCollection } from '../lib/useCollection';
import { describeError, supabase } from '../lib/supabase';
import type { Report as ReportRow, ReportTest as ReportTestRow } from '../lib/database.types';

export interface UseReportsResult {
  reports: MedicalReport[];
  loading: boolean;
  error: string | null;
  /** Stores a finished report, then refreshes so it appears in the list. */
  saveReport: (report: MedicalReport) => Promise<boolean>;
  /** Replaces the test rows that belong to a report. */
  saveReportTests: (reportId: string, report: MedicalReport) => Promise<void>;
  removeReport: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/** Rebuilds the UI shape from a stored row. */
function reportFromRow(row: ReportRow): MedicalReport {
  const stored = (row.summary_json ?? {}) as Partial<MedicalReport>;

  return {
    id: row.id,
    reportId: stored.reportId ?? row.id,
    fileName: row.filename,
    type: stored.type ?? (row.source === 'image' ? 'Scanned Report' : 'Lab Report'),
    date: row.created_at.slice(0, 10),
    lab: stored.lab ?? 'Not provided',
    patient: stored.patient ?? 'Not set',
    results: stored.results ?? [],
    explainedTerms: stored.explainedTerms ?? 0,
    uploadedAt: row.created_at.slice(0, 10),
    counts: stored.counts,
    summaryText: stored.summaryText,
  };
}

/**
 * Orayan report history, stored in Supabase rather than a per-account
 * localStorage key, so it follows the person between devices and is covered
 * by Row Level Security.
 *
 * The parsed results are kept in summary_json so the history list needs a
 * single query. The same values are also written to report_tests, which keeps
 * them searchable later if we ever add trends or "same test over time".
 */
export function useReports(): UseReportsResult {
  const { user } = useAuth();

  const collection = useCollection<ReportRow, MedicalReport>({
    table: 'reports',
    map: reportFromRow,
    order: { column: 'created_at', ascending: false },
    enabled: Boolean(user),
  });

  const saveReport = useCallback(
    async (report: MedicalReport) => {
      const stored = await collection.create({
        id: report.id,
        filename: report.fileName,
        file_path: `${user?.id ?? 'me'}/${report.id}/${report.fileName}`,
        source: report.type === 'Scanned Report' ? 'image' : 'upload',
        raw_text: '',
        summary_json: report as unknown as Record<string, unknown>,
      } as Partial<ReportRow>);

      return Boolean(stored);
    },
    [collection, user],
  );

  const saveReportTests = useCallback(
    async (reportId: string, report: MedicalReport) => {
      if (report.results.length === 0) return;

      // Replace rather than append, so re-saving a report cannot duplicate rows.
      await supabase.from('report_tests').delete().eq('report_id', reportId);

      const rows: Partial<ReportTestRow>[] = report.results.map((result, index) => ({
        report_id: reportId,
        position: index,
        name: result.name,
        raw: result.valueText ?? String(result.value ?? ''),
        value: typeof result.value === 'number' ? result.value : null,
        value_text: result.valueText ?? String(result.value ?? ''),
        unit: result.unit ?? '',
        range_text: result.reference ?? '',
        reference_json: { low: result.refLow, high: result.refHigh },
        status: result.status ?? 'unknown',
      }));

      const { error } = await supabase.from('report_tests').insert(rows as never);
      if (error) throw new Error(describeError(error));
    },
    [],
  );

  const removeReport = useCallback(
    async (id: string) => {
      const report = collection.items.find((item) => item.id === id);

      // The uploaded file is private, so clear it as well as the row.
      if (report && user) {
        const path = `${user.id}/${report.id}/${report.fileName}`;
        const { error } = await supabase.storage.from('reports').remove([path]);
        if (error) throw new Error(describeError(error));
      }

      return collection.remove(id);
    },
    [collection, user],
  );

  return {
    reports: collection.items,
    loading: collection.loading,
    error: collection.error,
    saveReport,
    saveReportTests,
    removeReport,
    refresh: collection.refresh,
  };
}