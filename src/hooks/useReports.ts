import type { MedicalReport } from '../types';
import { mockReports } from '../data/mockHealthData';
import { useLocalStorage } from './useLocalStorage';

/** Uploaded reports, seeded with demo data and persisted on this device. */
export function useReports() {
  return useLocalStorage<MedicalReport[]>('connect_reports', mockReports);
}
