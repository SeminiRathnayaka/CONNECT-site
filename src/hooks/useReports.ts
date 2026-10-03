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
  /**
   * Stores a finished report and uploads the original file to private Storage.
   *
   * The file itself is kept, not just the parsed numbers, so somebody can
   * reopen the original document later. It goes in under the account's own
   * folder, and the bucket is private, so only that person can fetch it.
   */
  saveReport: (report: MedicalReport, file?: File) => Promise<boolean>;
  /** Replaces the test rows that belong to a report. */
  saveReportTests: (reportId: string, report: MedicalReport) => Promise<void>;
  removeReport: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/** Private bucket that only the owner can read. */
const BUCKET = 'reports';

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
    async (report: MedicalReport, file?: File) => {
      if (!user) return false;

      const path = `${user.id}/${report.id}/${report.fileName}`;

      // The upload happens before the row is written, so a failure here leaves
      // no history entry pointing at a file that was never stored.
      if (file) {
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: true });
        if (error) throw new Error(describeError(error));
      }

      const stored = await collection.create({
        id: report.id,
        filename: report.fileName,
        file_path: file ? path : '',
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
      // Read the stored path instead of rebuilding it, so a report saved before
      // uploads existed, or one whose file is missing, still deletes cleanly.
      const { data } = await supabase
        .from('reports')
        .select('file_path')
        .eq('id', id)
        .maybeSingle();

      const path = (data as { file_path?: string } | null)?.file_path;
      if (path) {
        const { error } = await supabase.storage.from(BUCKET).remove([path]);
        // A file that is already gone is not a reason to keep the history entry.
        if (error) console.warn('Could not remove the stored file:', describeError(error));
      }

      return collection.remove(id);
    },
    [collection],
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