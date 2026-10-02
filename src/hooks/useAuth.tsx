import { createContext, useCallback, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { mockUser } from '../data/mockHealthData';
import type { User } from '../types';
import { useLocalStorage } from './useLocalStorage';

interface AuthContextValue {
  user: User | null;
  signIn: (email: string, name?: string) => User;
  signUp: (name: string, email: string) => User;
  signOut: () => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>('connect_user', null);

  const signIn = useCallback(
    (email: string, name?: string) => {
      const next: User = {
        ...mockUser,
        email: email.trim() || mockUser.email,
        name: name?.trim() || mockUser.name,
        initials: initialsFrom(name?.trim() || mockUser.name),
      };
      setUser(next);
      return next;
    },
    [setUser],
  );

  const signUp = useCallback(
    (name: string, email: string) => {
      const next: User = {
        ...mockUser,
        name: name.trim(),
        email: email.trim(),
        initials: initialsFrom(name.trim()),
        joinedAt: new Date().toISOString().slice(0, 10),
      };
      setUser(next);
      return next;
    },
    [setUser],
  );

  const signOut = useCallback(() => setUser(null), [setUser]);

  const value = useMemo(
    () => ({ user, signIn, signUp, signOut }),
    [user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
