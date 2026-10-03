import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

const PLACEHOLDER = 'YOUR-PROJECT-REF';

/**
 * True when real values have been filled into .env.local.
 *
 * The app still renders without Supabase, so the pages can be worked on, but
 * every screen that needs data shows a clear "not set up yet" message rather
 * than a confusing network error.
 */
export const isSupabaseConfigured =
  url.length > 0 && anonKey.length > 0 && !url.includes(PLACEHOLDER) && !anonKey.includes('YOUR-ANON');

/**
 * Single shared client.
 *
 * persistSession is on (the default) so a refresh keeps the person signed in:
 * Supabase writes the session to localStorage and refreshes the token as it
 * expires. That is what makes "log in, refresh, still logged in" work.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  isSupabaseConfigured ? url : 'http://localhost:54321',
  isSupabaseConfigured ? anonKey : 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

/** Message shown on screens that need the database before it is configured. */
export const SUPABASE_SETUP_MESSAGE =
  'Supabase is not set up yet. Copy .env.example to .env.local, add your project URL and anon key, then restart "npm run dev".';

/** Turns a Supabase error into something a person can read. */
export function describeError(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;
  const candidate = error as { message?: string; details?: string; hint?: string };
  if (candidate.message) {
    return candidate.hint ? `${candidate.message} ${candidate.hint}` : candidate.message;
  }
  return 'Something went wrong. Please try again.';
}

/** Base URL of the local Python AI service that holds the Gemini key. */
export const AI_API_URL =
  (import.meta.env.VITE_AI_API_URL as string | undefined)?.trim() || 'http://127.0.0.1:8000';