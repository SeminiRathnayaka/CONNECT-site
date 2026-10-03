import type { MedicalReport } from '../types';
import { useAuth } from './useAuth';
import { useLocalStorage } from './useLocalStorage';

/**
 * A local mirror of the signed-in account's report list, kept only so the
 * dashboard has something to paint before the server responds.
 *
 * The key includes the account id. With one shared key, signing in as somebody
 * else on the same browser would show the previous person's report list, which
 * matters because these are medical reports.
 */
export function useReports() {
  const { user } = useAuth();
  const key = user ? `connect_reports_${user.id}` : 'connect_reports_signed_out';
  return useLocalStorage<MedicalReport[]>(key, []);
}