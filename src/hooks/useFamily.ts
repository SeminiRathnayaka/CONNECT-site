import type { FamilyMember } from '../types';
import { useLocalStorage } from './useLocalStorage';

/** Family profiles, stored on this device until a backend is connected. */
export function useFamily() {
  return useLocalStorage<FamilyMember[]>('connect_family', []);
}
