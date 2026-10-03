import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured, SUPABASE_SETUP_MESSAGE } from '../../lib/supabase';
import { LoadingState } from '../ui/LoadingState';

/**
 * Stops anyone without a session reaching a page full of their health data.
 *
 * This is a convenience, not the security boundary. The real protection is Row
 * Level Security in the database: even if a request were crafted by hand, the
 * database returns nothing for someone who is not signed in as that account.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Give Supabase a moment to restore the stored session before deciding.
  if (loading) {
    return (
      <div className="page-container py-16">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  if (!user) {
    // Remember where they were headed so sign-in can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}

/**
 * Shown instead of a crash when .env.local has no Supabase keys yet.
 *
 * The rest of the app still renders, so the UI can be worked on before a
 * project is created.
 */
export function SupabaseSetupNotice() {
  if (isSupabaseConfigured) return null;

  return (
    <div className="page-container pt-6">
      <div
        role="status"
        className="rounded-2xl border border-amber-300/60 bg-amber-50/90 px-5 py-4 text-sm text-amber-900"
      >
        <p className="font-semibold">Supabase is not connected yet</p>
        <p className="mt-1 leading-relaxed">{SUPABASE_SETUP_MESSAGE}</p>
        <p className="mt-2 text-xs text-amber-800">
          Pages will show empty lists until the keys are added. Nothing has been lost.
        </p>
      </div>
    </div>
  );
}