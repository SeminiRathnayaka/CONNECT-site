/**
 * Client for the CONNECT AI backend (ai/app/server.py).
 *
 * In development Vite proxies /api and /health to http://127.0.0.1:8000, so
 * requests are same-origin and no CORS handling is needed here.
 *
 * Sign-in is a real server-side account: the server sets an HttpOnly session
 * cookie, so every request must send cookies with `credentials: 'include'`.
 * The password is never stored in the browser.
 */

const BASE = ''

export type Language = 'en' | 'si'

/* ------------------------------------------------------------------ */
/* Account types                                                       */
/* ------------------------------------------------------------------ */

export interface User {
  id: string
  email: string
  name: string
  /** Date the account was created, as YYYY-MM-DD. Empty on older responses. */
  created_at?: string
}

export interface AuthResponse {
  user: User
}

export interface RetentionPolicy {
  max_conversations: number
  report_retention_days: number
}

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
  language: Language
  summary_text: string
  counts: TestCounts
}

export interface ChatResponse {
  reply: string
  language: Language
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

/** Turns any thrown value into a message that is safe to show a person. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof ApiError) return error.message;
  // AuthError from useAuth, and anything else that carries a readable message.
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Called when the backend answers 401, so a session that expired or was
 * revoked mid-visit sends the person back to the sign-in screen instead of
 * showing a broken page. useAuth registers this once at start-up.
 */
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
}

/**
 * Reads the current Supabase access token.
 *
 * The AI service checks this on every call so only signed-in people can spend
 * the Gemini quota, and so it knows whose report is being worked on.
 */
async function accessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  const token = await accessToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      headers,
    });
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
    if (response.status === 401) onUnauthorized?.()
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
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export function registerAccount(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return postJson<AuthResponse>('/api/auth/register', { name, email, password })
}

export function loginAccount(email: string, password: string): Promise<AuthResponse> {
  return postJson<AuthResponse>('/api/auth/login', { email, password })
}

export function logoutAccount(): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }>('/api/auth/logout', {})
}

/** Resolves the signed-in account, or null when the cookie is missing or expired. */
export function fetchCurrentUser(): Promise<{ user: User | null }> {
  return request<{ user: User | null }>('/api/auth/me')
}

export function fetchRetention(): Promise<RetentionPolicy> {
  return request<RetentionPolicy>('/api/auth/retention')
}

export function listConversations(): Promise<{
  conversations: { id: string; title: string; created_at: string; updated_at: string }[]
  max_conversations: number
}> {
  return request('/api/conversations')
}

/* ------------------------------------------------------------------ */
/* Baymax chat                                                         */
/* ------------------------------------------------------------------ */

export function sendChat(
  message: string,
  history: Array<{ role: 'user' | 'model'; content: string }>,
  language: Language,
): Promise<ChatResponse> {
  return postJson<ChatResponse>('/api/chat', {
    message,
    history,
    language,
  })
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

    // The bearer token identifies the account, so it must be set before sending.
    void accessToken().then((token) => {
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

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
          if (xhr.status === 401) onUnauthorized?.()
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
  })
}

/**
 * The report context every follow-up question needs.
 *
 * The AI service stores nothing, so the app sends the parsed rows each time.
 * Supabase remains the one place the report is actually kept.
 */
export interface ReportContext {
  filename: string;
  tests: Record<string, unknown>[];
  counts: Record<string, unknown>;
  summary_text: string;
}

/** Builds that context from a stored report. */
export function reportContext(report: MedicalReport): ReportContext {
  return {
    filename: report.fileName,
    tests: report.rawTests ?? [],
    counts: report.rawCounts ?? {},
    summary_text: report.summaryText ?? '',
  }
}

export function getReportSummary(
  context: ReportContext,
  language: Language,
): Promise<ReportSummaryResponse> {
  return postJson<ReportSummaryResponse>('/api/orayan/summary', {
    ...context,
    language,
  })
}

export function explainTest(
  context: ReportContext,
  testName: string,
  language: Language,
): Promise<{ test_name: string; language: Language; explanation: string }> {
  return postJson('/api/orayan/explain', {
    ...context,
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
  context: ReportContext,
  question: string,
  language: Language,
): Promise<{ question: string; language: Language; answer: string }> {
  return postJson(`/api/orayan/ask?language=${language}`, {
    ...context,
    question,
  })
}

/* ------------------------------------------------------------------ */
/* Mapping backend tests onto the UI's LabResult model                */
/* ------------------------------------------------------------------ */

import type { LabResult, MedicalReport, ValueStatus } from '../types'
import { isSupabaseConfigured, supabase } from './supabase'

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