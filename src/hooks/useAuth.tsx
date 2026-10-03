import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '../types';
import { describeError, isSupabaseConfigured, supabase, SUPABASE_SETUP_MESSAGE } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  /** True while Supabase is restoring a session on page load. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  /**
   * True when the project requires email confirmation, so a new account is
   * created but cannot sign in until the link in the email is opened.
   */
  needsEmailConfirmation: boolean;
  /** Access token for calling the local AI service. Null when signed out. */
  accessToken: string | null;
  resetError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Thrown for problems the sign-up form should explain in plain words. */
export class AuthError extends Error {}

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Supabase is the single source of truth for "who is signed in".
 *
 * The session lives in localStorage so a refresh keeps you signed in, and
 * Supabase refreshes the expiring token on its own. Every table has Row Level
 * Security keyed to the same user id, so the database refuses to hand one
 * person's data to another even if a request is tampered with.
 */
function toAppUser(account: SupabaseUser): User {
  const name =
    (account.user_metadata?.full_name as string | undefined)?.trim() ||
    account.email?.split('@')[0] ||
    'Member';

  return {
    id: account.id,
    name,
    email: account.email ?? '',
    initials: initialsFrom(name),
    joinedAt: account.created_at ?? '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // No project yet: nothing to restore, but stop the spinner so the app renders.
      setLoading(false);
      return;
    }

    let active = true;

    // getSession reads the stored session; getUser re-checks it with the server.
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);
      if (nextSession) setNeedsEmailConfirmation(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const user = useMemo(() => (session?.user ? toAppUser(session.user) : null), [session]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) throw new AuthError(SUPABASE_SETUP_MESSAGE);
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Supabase gives the same message for both cases, which stops anyone from
      // learning which email addresses have accounts.
      throw new AuthError(
        error.message.toLowerCase().includes('invalid')
          ? 'That email and password do not match an account.'
          : describeError(error),
      );
    }
    if (!data.user) throw new AuthError('Could not sign in. Please try again.');
    return toAppUser(data.user);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    if (!isSupabaseConfigured) throw new AuthError(SUPABASE_SETUP_MESSAGE);
    setAuthError(null);

    if (name.trim().length < 2) throw new AuthError('Please enter your full name.');
    if (password.length < 8) throw new AuthError('Password must be at least 8 characters.');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // The database trigger reads this to create the matching profile row.
      options: { data: { full_name: name.trim() } },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('already registered') || message.includes('already been registered')) {
        throw new AuthError('An account with that email already exists. Try signing in instead.');
      }
      throw new AuthError(describeError(error));
    }

    if (!data.user) throw new AuthError('Could not create the account. Please try again.');

    // With email confirmation switched on there is no session until the link is used.
    if (!data.session) {
      setNeedsEmailConfirmation(true);
      throw new AuthError('Account created. Check your inbox to confirm the email, then sign in.');
    }

    return toAppUser(data.user);
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setSession(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) throw new AuthError(SUPABASE_SETUP_MESSAGE);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw new AuthError(describeError(error));
  }, []);

  const resetError = useCallback(() => setAuthError(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      needsEmailConfirmation,
      accessToken: session?.access_token ?? null,
      resetError,
    }),
    [
      user,
      loading,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      needsEmailConfirmation,
      session,
      resetError,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Surfaces the last auth problem without forcing pages to handle it. */}
      {authError ? <AuthErrorToast message={authError} onDismiss={resetError} /> : null}
    </AuthContext.Provider>
  );
}

function AuthErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="fixed bottom-5 left-1/2 z-50 flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-100 backdrop-blur-xl"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg px-2 py-1 text-xs font-medium text-red-200 hover:bg-red-500/20"
      >
        Dismiss
      </button>
    </div>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}