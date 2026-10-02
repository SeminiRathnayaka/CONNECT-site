import type { MedicalReport } from '../types';
import { useLocalStorage } from './useLocalStorage';

/** Uploaded reports, persisted on this device until a backend is connected. */
export function useReports() {
  return useLocalStorage<MedicalReport[]>('connect_reports', []);
}
