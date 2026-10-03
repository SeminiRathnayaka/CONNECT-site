import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import {
  ApiError,
  fetchCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  setUnauthorizedHandler,
} from '../lib/api';
import type { User as AccountUser } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  /** True while the server is checking whether a session cookie is still valid. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * The signed-in person is now decided by the server session, not by anything in
 * localStorage. Only display fields are stored locally so the app can render
 * immediately on reload while /api/auth/me is still in flight.
 */
function toLocalUser(account: AccountUser): User {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    initials: initialsFrom(account.name),
    joinedAt: account.created_at ?? '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on load and follow any later expiry.
  useEffect(() => {
    let active = true;

    fetchCurrentUser()
      .then((result) => {
        if (active && result.user) setUser(toLocalUser(result.user));
      })
      .catch(() => {
        // Offline or server down: stay signed out rather than showing a broken app.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    setUnauthorizedHandler(() => setUser(null));

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await loginAccount(email, password);
    const next = toLocalUser(result.user);
    setUser(next);
    return next;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await registerAccount(name, email, password);
    const next = toLocalUser(result.user);
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutAccount();
    } catch (error) {
      // The cookie is cleared either way, so still sign out locally.
      if (!(error instanceof ApiError)) throw error;
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}