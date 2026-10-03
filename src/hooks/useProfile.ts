import { useCallback, useEffect } from 'react';
import { useCollection } from '../lib/useCollection';
import { describeError, isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Profile as ProfileRow } from '../lib/database.types';
import { useAuth } from './useAuth';

export interface ProfileDetails {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  address: string;
  avatarUrl: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyNotes: string[];
}

export const emptyProfile: ProfileDetails = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodType: '',
  address: '',
  avatarUrl: '',
  allergies: [],
  conditions: [],
  medications: [],
  emergencyNotes: [],
};

/** Rebuilds the UI shape, falling back to the auth record while the row loads. */
function profileFromRow(row: ProfileRow, fallbackName: string, fallbackEmail: string): ProfileDetails {
  return {
    fullName: row.full_name || fallbackName,
    email: row.email || fallbackEmail,
    phone: row.phone,
    dateOfBirth: row.date_of_birth ?? '',
    gender: row.gender,
    bloodType: row.blood_type,
    address: row.address,
    avatarUrl: row.avatar_url ?? '',
    allergies: row.allergies ?? [],
    conditions: row.conditions ?? [],
    medications: row.medications ?? [],
    emergencyNotes: row.emergency_notes ?? [],
  };
}

export interface UseProfileResult {
  profile: ProfileDetails;
  loading: boolean;
  saving: boolean;
  error: string | null;
  saveProfile: (values: Partial<ProfileDetails>) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * The signed-in person's own details, kept in the profiles row that the
 * database creates automatically at sign-up.
 *
 * The row is keyed by the auth user id, so Row Level Security means nobody can
 * read or change anybody else's.
 */
export function useProfile(): UseProfileResult {
  const { user } = useAuth();

  const collection = useCollection<ProfileRow, ProfileDetails>({
    table: 'profiles',
    map: (row) => profileFromRow(row, user?.name ?? '', user?.email ?? ''),
    order: { column: 'created_at', ascending: true },
    enabled: Boolean(user),
  });

  const profile =
    collection.items[0] ??
    ({ ...emptyProfile, fullName: user?.name ?? '', email: user?.email ?? '' } as ProfileDetails);

  const saveProfile = useCallback(
    async (values: Partial<ProfileDetails>) => {
      if (!isSupabaseConfigured) return false;
      if (!user) return false;

      const patch: Partial<ProfileRow> = {};
      if (values.fullName !== undefined) patch.full_name = values.fullName.trim();
      if (values.phone !== undefined) patch.phone = values.phone.trim();
      if (values.dateOfBirth !== undefined) patch.date_of_birth = values.dateOfBirth || null;
      if (values.gender !== undefined) patch.gender = values.gender;
      if (values.bloodType !== undefined) patch.blood_type = values.bloodType.trim();
      if (values.address !== undefined) patch.address = values.address.trim();
      if (values.allergies !== undefined) patch.allergies = values.allergies;
      if (values.conditions !== undefined) patch.conditions = values.conditions;
      if (values.medications !== undefined) patch.medications = values.medications;
      if (values.emergencyNotes !== undefined) patch.emergency_notes = values.emergencyNotes;

      // Email lives on the auth record, so it is changed there rather than here.
      if (values.email !== undefined && values.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: values.email });
        if (emailError) throw new Error(describeError(emailError));
        patch.email = values.email;
      }

      const { error } = await supabase
        .from('profiles')
        .update(patch as never)
        .eq('id', user.id);

      if (error) throw new Error(describeError(error));
      await collection.refresh();
      return true;
    },
    [user, collection],
  );

  return {
    profile,
    loading: collection.loading,
    saving: false,
    error: collection.error,
    saveProfile,
    refresh: collection.refresh,
  };
}

/** Keeps the profiles row in step with the name shown in the navbar. */
export function useSyncProfileName() {
  const { user } = useAuth();
  const { saveProfile } = useProfile();

  const wantedName = user?.name;
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !wantedName) return;
    // The row is created by the database trigger, so this is a no-op if it is
    // not there yet; the Profile page is where names are actually edited.
    void saveProfile({ fullName: wantedName }).catch(() => undefined);
  }, [userId, wantedName, saveProfile]);
}