import { useCallback } from 'react';
import type { Appointment, HealthMetric, HealthRecord, Medication, SymptomEntry } from '../types';
import { useCollection, useSingleRow } from '../lib/useCollection';
import type { Collection, CollectionOptions } from '../lib/useCollection';
import {
  appointmentFromRow,
  healthRecordFromRow,
  medicationFromRow,
  metricFromRow,
  symptomFromRow,
  today,
} from '../lib/mappers';
import type {
  Appointment as AppointmentRow,
  DoctorPrepNote as DoctorPrepNoteRow,
  DoctorQuestion as DoctorQuestionRow,
  EmergencyContact as EmergencyContactRow,
  HealthMetric as HealthMetricRow,
  HealthRecord as HealthRecordRow,
  Medication as MedicationRow,
  SymptomEntry as SymptomEntryRow,
} from '../lib/database.types';
import { useAuth } from './useAuth';

/**
 * Database-backed versions of the features that used to keep their data in
 * this browser's localStorage.
 *
 * Each hook exposes the same shape: the items, create/update/remove, plus
 * loading, error and empty, so every screen can show the right state. Reads
 * wait for a signed-in user, which keeps the app from firing queries that the
 * database would reject anyway.
 */

export type DoctorQuestion = {
  id: string;
  text: string;
  category: string;
  done: boolean;
  appointmentId?: string;
};

export type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */

export function useAppointments(): Collection<AppointmentRow, Appointment> {
  const { user } = useAuth();
  const options: CollectionOptions<AppointmentRow, Appointment> = {
    table: 'appointments',
    map: appointmentFromRow,
    order: { column: 'appointment_date', ascending: true },
    enabled: Boolean(user),
  };
  return useCollection(options);
}

/* ------------------------------------------------------------------ */
/* Medications                                                         */
/* ------------------------------------------------------------------ */

export function useMedications(): Collection<MedicationRow, Medication> {
  const { user } = useAuth();
  const options: CollectionOptions<MedicationRow, Medication> = {
    table: 'medications',
    map: medicationFromRow,
    order: { column: 'next_dose', ascending: true },
    enabled: Boolean(user),
  };
  return useCollection(options);
}

/** Ticking or clearing "taken today" for a dose. */
export function useMarkMedicationTaken(): (id: string, taken: boolean) => Promise<Medication | null> {
  const { user } = useAuth();
  const { update } = useCollection<MedicationRow, Medication>({
    table: 'medications',
    map: medicationFromRow,
    enabled: Boolean(user),
  });

  return useCallback(
    (id: string, taken: boolean) =>
      update(id, {
        taken_today: taken,
        taken_date: taken ? today() : null,
      } as Partial<MedicationRow>),
    [update],
  );
}

/* ------------------------------------------------------------------ */
/* Health records                                                      */
/* ------------------------------------------------------------------ */

export function useHealthRecords(): Collection<HealthRecordRow, HealthRecord> {
  const { user } = useAuth();
  const options: CollectionOptions<HealthRecordRow, HealthRecord> = {
    table: 'health_records',
    map: healthRecordFromRow,
    order: { column: 'record_date', ascending: false },
    enabled: Boolean(user),
  };
  return useCollection(options);
}

/* ------------------------------------------------------------------ */
/* Symptom journal                                                     */
/* ------------------------------------------------------------------ */

export function useSymptomJournal(): Collection<SymptomEntryRow, SymptomEntry> {
  const { user } = useAuth();
  const options: CollectionOptions<SymptomEntryRow, SymptomEntry> = {
    table: 'symptom_entries',
    map: symptomFromRow,
    order: { column: 'entry_date', ascending: false },
    enabled: Boolean(user),
  };
  return useCollection(options);
}

/* ------------------------------------------------------------------ */
/* Dashboard metrics                                                   */
/* ------------------------------------------------------------------ */

export function useHealthMetrics(): Collection<HealthMetricRow, HealthMetric> {
  const { user } = useAuth();
  const options: CollectionOptions<HealthMetricRow, HealthMetric> = {
    table: 'health_metrics',
    map: metricFromRow,
    order: { column: 'recorded_on', ascending: false },
    enabled: Boolean(user),
  };
  return useCollection(options);
}

/* ------------------------------------------------------------------ */
/* Doctor preparation                                                  */
/* ------------------------------------------------------------------ */

export function useDoctorQuestions(): Collection<DoctorQuestionRow, DoctorQuestion> {
  const { user } = useAuth();
  const options: CollectionOptions<DoctorQuestionRow, DoctorQuestion> = {
    table: 'doctor_questions',
    map: (row) => ({
      id: row.id,
      text: row.text,
      category: row.category || 'General',
      done: row.done,
      appointmentId: row.appointment_id ?? undefined,
    }),
    order: { column: 'created_at', ascending: false },
    enabled: Boolean(user),
  };
  return useCollection(options);
}

/** One free-text note per person, so this reads and writes a single row. */
export function useDoctorPrepNote() {
  const { user } = useAuth();
  const { value, loading, error, save } = useSingleRow<DoctorPrepNoteRow, string>(
    'doctor_prep_notes',
    (row) => row.content,
    Boolean(user),
  );

  // This table is keyed by owner_id rather than a separate id column, so the
  // account has to travel with the save. Without it the database cannot tell
  // which existing note to replace and the second save would fail.
  const saveNote = useCallback(
    (content: string) => save({ content, owner_id: user?.id }),
    [save, user],
  );

  return { note: value ?? '', loading, error, saveNote };
}

/* ------------------------------------------------------------------ */
/* Emergency contacts                                                  */
/* ------------------------------------------------------------------ */

export function useEmergencyContacts(): Collection<EmergencyContactRow, EmergencyContact> {
  const { user } = useAuth();
  const options: CollectionOptions<EmergencyContactRow, EmergencyContact> = {
    table: 'emergency_contacts',
    map: (row) => ({ id: row.id, name: row.name, relation: row.relation, phone: row.phone }),
    order: { column: 'name', ascending: true },
    enabled: Boolean(user),
  };
  return useCollection(options);
}