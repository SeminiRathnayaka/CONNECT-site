import { useCallback, useMemo } from 'react';
import type { FamilyMember } from '../types';
import { useCollection } from '../lib/useCollection';
import type { Collection } from '../lib/useCollection';
import { appointmentFromRow, familyMemberFromRow, familyMemberPatchToRow, familyMemberToRow } from '../lib/mappers';
import type { Appointment as AppointmentRow, FamilyMember as FamilyMemberRow } from '../lib/database.types';
import { useAuth } from './useAuth';

export interface AddFamilyMemberInput {
  name: string;
  relationship: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
  notes?: string;
  lastCheckup?: string;
}

export interface FamilyResult {
  family: FamilyMember[];
  addFamily: (values: AddFamilyMemberInput) => Promise<FamilyMember | null>;
  updateFamily: (id: string, values: Partial<AddFamilyMemberInput>) => Promise<FamilyMember | null>;
  removeFamily: (id: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  empty: boolean;
  refresh: () => Promise<void>;
}

/**
 * Family profiles now live in the database, so they follow the person between
 * devices and are protected by Row Level Security instead of hiding in this
 * browser's localStorage.
 *
 * upcomingAppointment is not stored: it is worked out from the appointments
 * table each time so it can never go stale.
 */
export function useFamily(): FamilyResult {
  const { user } = useAuth();

  const members: Collection<FamilyMemberRow, FamilyMember> = useCollection<FamilyMemberRow, FamilyMember>({
    table: 'family_members',
    map: familyMemberFromRow,
    order: { column: 'created_at', ascending: true },
    enabled: Boolean(user),
  });

  const appointments = useCollection<AppointmentRow, ReturnType<typeof appointmentFromRow>>({
    table: 'appointments',
    map: appointmentFromRow,
    enabled: Boolean(user),
  });

  const family = useMemo(() => {
    const todayStamp = new Date().toISOString().slice(0, 10);

    const upcomingByMember = new Map<string, ReturnType<typeof appointmentFromRow>>();

    for (const appointment of appointments.items) {
      if (appointment.date < todayStamp) continue;
      if (appointment.status === 'cancelled') continue;

      // Appointments without a member are personal, not tied to a relative.
      const key = appointment.memberId ?? '';
      const current = upcomingByMember.get(key);
      if (!current || appointment.date < current.date) {
        upcomingByMember.set(key, appointment);
      }
    }

    return members.items.map((member) => {
      const next = upcomingByMember.get(member.id);
      if (!next) return member;
      return {
        ...member,
        upcomingAppointment: { doctor: next.doctor, date: next.date, time: next.time },
      };
    });
  }, [members.items, appointments.items]);

  /** Works out a YYYY-MM-DD date of birth from an age in whole years. */
function dateOfBirthFromAge(age: number | undefined): string | undefined {
  if (age === undefined || Number.isNaN(age)) return undefined;
  const now = new Date();
  const born = new Date(now.getFullYear() - age, now.getMonth(), now.getDate());
  return born.toISOString().slice(0, 10);
}

const addFamily = useCallback(
    async (values: AddFamilyMemberInput) => {
      // The form asks for an age, but a date of birth stays correct as time passes.
      const dateOfBirth = values.dateOfBirth ?? dateOfBirthFromAge(values.age);
      return members.create(
        familyMemberToRow({ ...values, dateOfBirth }) as Partial<FamilyMemberRow>,
      );
    },
    [members],
  );

  const updateFamily = useCallback(
    async (id: string, values: Partial<AddFamilyMemberInput>) =>
      members.update(id, familyMemberPatchToRow(values) as Partial<FamilyMemberRow>),
    [members],
  );

  const removeFamily = useCallback((id: string) => members.remove(id), [members]);

  return {
    family,
    addFamily,
    updateFamily,
    removeFamily,
    loading: members.loading,
    error: members.error,
    empty: members.empty,
    refresh: members.refresh,
  };
}