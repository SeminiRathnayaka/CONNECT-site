/**
 * Client for the CONNECT AI backend (ai/app/server.py).
 *
 * In development Vite proxies /api and /health to http://127.0.0.1:8000, so
 * requests are same-origin and no CORS handling is needed here.
 */

const BASE = ''

export type Language = 'en' | 'si'

/* ------------------------------------------------------------------ */
/* Shared shapes                                                       */
/* ------------------------------------------------------------------ */

export interface ReferenceRange {
  kind: 'between' | 'less_than' | 'greater_than'
  low: number | null
  high: number | null
  text: string
}

export interface Comparator {
  op: string
  limit: number | null
  text: string
}

export type BackendStatus = 'in_range' | 'low' | 'high' | 'unknown' | 'qualitative'

export interface LabTest {
  name: string
  raw: string
  value: number | null
  value_text: string
  unit: string
  range_text: string
  reference: ReferenceRange | null
  comparator: Comparator | null
  status: BackendStatus
}

export interface TestCounts {
  total: number
  in_range: number
  low: number
  high: number
  unknown: number
  qualitative: number
  flagged_total: number
  flagged_names: string[]
}

export interface UploadResponse {
  report_id: string
  filename: string
  source: string
  was_image: boolean
  language: Language
  tests: LabTest[]
  counts: TestCounts
  summary_text: string
  summary_error: string | null
}

export interface ReportSummaryResponse {
  report_id: string
  language: Language
  summary_text: string
  counts: TestCounts
}

export interface ChatResponse {
  reply: string
  session_id: string
  language: Language
}

export interface ReportListItem {
  report_id: string
  filename: string
  source: string
  created_at: string
  summary: TestCounts
}

export interface ReportDetail {
  report_id: string
  filename: string
  source: string
  created_at: string
  language: Language
  tests: LabTest[]
  counts: TestCounts
  summary_text: string
}

export interface HealthResponse {
  status: string
  model_configured: boolean
  database?: string
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }

  /** True when the backend could not be reached at all. */
  get isOffline(): boolean {
    return this.status === 0
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${BASE}${path}`, init)
  } catch {
    throw new ApiError(
      'Could not reach the AI server. Make sure it is running with "npm run dev".',
      0,
    )
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { detail?: string }
      if (typeof body.detail === 'string') detail = body.detail
    } catch {
      /* keep the default message */
    }
    throw new ApiError(detail, response.status)
  }

  return (await response.json()) as T
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

export function checkHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

/* ------------------------------------------------------------------ */
/* Baymax chat                                                         */
/* ------------------------------------------------------------------ */

export function sendChat(
  message: string,
  sessionId: string | undefined,
  language: Language,
): Promise<ChatResponse> {
  return postJson<ChatResponse>('/api/chat', {
    message,
    session_id: sessionId,
    language,
  })
}

export function resetChat(sessionId: string): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }>('/api/reset', { session_id: sessionId })
}

/* ------------------------------------------------------------------ */
/* Orayan reports                                                      */
/* ------------------------------------------------------------------ */

export function uploadReport(
  file: File,
  language: Language,
  onProgress?: (percent: number) => void,
): Promise<UploadResponse> {
  // Content-Type is intentionally omitted: the browser must set the multipart
  // boundary itself, otherwise the backend cannot read the file.
  const form = new FormData()
  form.append('file', file)
  form.append('language', language)

  return new Promise<UploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/api/orayan/upload`)

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      let body: unknown
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        return reject(new ApiError('The server sent an unreadable response.', xhr.status))
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as UploadResponse)
      } else {
        const detail = (body as { detail?: string })?.detail
        reject(new ApiError(detail ?? `Upload failed (${xhr.status})`, xhr.status))
      }
    })

    xhr.addEventListener('error', () =>
      reject(
        new ApiError(
          'Could not reach the AI server. Make sure it is running with "npm run dev".',
          0,
        ),
      ),
    )

    xhr.send(form)
  })
}

export function getReportSummary(
  reportId: string,
  language: Language,
): Promise<ReportSummaryResponse> {
  return postJson<ReportSummaryResponse>('/api/orayan/summary', {
    report_id: reportId,
    language,
  })
}

export function explainTest(
  reportId: string,
  testName: string,
  language: Language,
): Promise<{ test_name: string; language: Language; explanation: string }> {
  return postJson('/api/orayan/explain', {
    report_id: reportId,
    test_name: testName,
    language,
  })
}

export function explainTerm(
  term: string,
  language: Language,
): Promise<{ term: string; language: Language; explanation: string }> {
  return postJson(`/api/orayan/term?language=${language}`, { term })
}

export function askAboutReport(
  reportId: string,
  question: string,
  language: Language,
): Promise<{ question: string; language: Language; answer: string }> {
  return postJson(`/api/orayan/ask?language=${language}`, {
    report_id: reportId,
    question,
  })
}

export function listReports(): Promise<{ reports: ReportListItem[] }> {
  return request<{ reports: ReportListItem[] }>('/api/orayan/reports')
}

export function getReport(
  reportId: string,
  language: Language,
): Promise<ReportDetail> {
  return request<ReportDetail>(`/api/orayan/reports/${reportId}?language=${language}`)
}

export function deleteReport(reportId: string): Promise<{ ok: boolean }> {
  return request<{ ok: boolean }>(`/api/orayan/reports/${reportId}`, {
    method: 'DELETE',
  })
}

/* ------------------------------------------------------------------ */
/* Mapping backend tests onto the UI's LabResult model                */
/* ------------------------------------------------------------------ */

import type { LabResult, ValueStatus } from '../types'

/**
 * The UI uses a 3-state status (normal / attention / outside) while the
 * backend uses 5 (in_range / low / high / unknown / qualitative).
 *
 * "attention" means the value is inside the range but close to an edge, which
 * only the UI cares about, so it is derived here rather than from the backend.
 */
export function toValueStatus(test: LabTest): ValueStatus {
  if (test.status === 'low' || test.status === 'high') return 'outside'
  if (test.status !== 'in_range') return 'attention'

  const { low, high } = test.reference ?? {}
  const value = test.value
  if (value === null || value === undefined) return 'normal'
  if (low !== null && low !== undefined && high !== null && high !== undefined) {
    const span = high - low
    if (span > 0 && (value < low + span * 0.1 || value > high - span * 0.1)) {
      return 'attention'
    }
  }
  return 'normal'
}

export function toLabResult(test: LabTest, index: number): LabResult {
  const reference = test.reference
  return {
    id: `${index}-${test.name}`.replace(/\s+/g, '-').toLowerCase(),
    name: test.name,
    value: test.value ?? 0,
    valueText: test.value_text || (test.value !== null ? String(test.value) : '—'),
    unit: test.unit,
    reference: test.range_text || reference?.text || 'Not printed on report',
    refLow: reference?.low ?? null,
    refHigh: reference?.high ?? null,
    status: toValueStatus(test),
    note: '',
  }
}