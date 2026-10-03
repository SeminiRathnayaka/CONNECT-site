import type {
  Appointment,
  AppointmentStatus,
  FamilyMember,
  HealthMetric,
  HealthRecord,
  Medication,
  RecordCategory,
  Relationship,
  Severity,
  AppNotification,
  NotificationType,
  SymptomEntry,
} from '../types';
import type {
  Appointment as AppointmentRow,
  FamilyMember as FamilyMemberRow,
  HealthMetric as HealthMetricRow,
  HealthRecord as HealthRecordRow,
  Medication as MedicationRow,
  NotificationRow,
  SymptomEntry as SymptomEntryRow,
} from './database.types';

/**
 * Converts database rows into the shapes the UI already expects.
 *
 * Keeping this mapping in one place means the pages did not have to be
 * redesigned, only rewired. For example the database stores a date of birth
 * but the card wants an age, and stores blood_type while the card wants
 * bloodType.
 */

/** Age in whole years from a YYYY-MM-DD date of birth. */
export function ageFrom(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return 0;

  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDiff = now.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) {
    age -= 1;
  }
  return age < 0 ? 0 : age;
}

/** Today as YYYY-MM-DD in the browser's own timezone. */
export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const ACCENTS = ['blue', 'teal', 'violet', 'amber', 'rose'] as const;

/** Stable card colour, chosen from the member id so it never changes. */
function accentFrom(id: string): FamilyMember['accent'] {
  let total = 0;
  for (let index = 0; index < id.length; index += 1) {
    total += id.charCodeAt(index);
  }
  return ACCENTS[total % ACCENTS.length];
}

/* ------------------------------------------------------------------ */
/* Family                                                              */
/* ------------------------------------------------------------------ */

export function familyMemberFromRow(row: FamilyMemberRow): FamilyMember {
  return {
    id: row.id,
    name: row.full_name,
    relationship: row.relationship as Relationship,
    age: ageFrom(row.date_of_birth),
    gender: row.gender || 'Not set',
    bloodType: row.blood_type || 'Not known',
    initials: initialsFrom(row.full_name),
    accent: (row.accent as FamilyMember['accent']) || accentFrom(row.id),
    conditions: row.conditions ?? [],
    allergies: row.allergies ?? [],
    medications: row.medications ?? [],
    vitals: {
      heartRate: row.heart_rate ?? 0,
      bloodPressure: row.blood_pressure ?? 'Not recorded',
      glucose: row.glucose ?? 0,
      weight: row.weight ?? 0,
    },
    lastCheckup: row.last_checkup ?? undefined,
    notes: row.notes || undefined,
  };
}

/** Turns a family member form into the columns the database stores. */
export function familyMemberToRow(values: {
  name: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  conditions?: string[];
  allergies?: string[];
  medications?: string[];
  notes?: string;
  lastCheckup?: string;
}) {
  return {
    full_name: values.name.trim(),
    relationship: values.relationship,
    date_of_birth: values.dateOfBirth ?? null,
    gender: values.gender ?? '',
    blood_type: values.bloodType ?? '',
    conditions: values.conditions ?? [],
    allergies: values.allergies ?? [],
    medications: values.medications ?? [],
    notes: values.notes ?? '',
    last_checkup: values.lastCheckup ?? null,
  };
}

/**
 * Same as familyMemberToRow but only sends the fields that were actually
 * changed, so editing one field does not blank out the others.
 */
export function familyMemberPatchToRow(values: Partial<Parameters<typeof familyMemberToRow>[0]>) {
  const patch: Record<string, unknown> = {};
  if (values.name !== undefined) patch.full_name = values.name.trim();
  if (values.relationship !== undefined) patch.relationship = values.relationship;
  if (values.dateOfBirth !== undefined) patch.date_of_birth = values.dateOfBirth || null;
  if (values.gender !== undefined) patch.gender = values.gender;
  if (values.bloodType !== undefined) patch.blood_type = values.bloodType;
  if (values.conditions !== undefined) patch.conditions = values.conditions;
  if (values.allergies !== undefined) patch.allergies = values.allergies;
  if (values.medications !== undefined) patch.medications = values.medications;
  if (values.notes !== undefined) patch.notes = values.notes;
  if (values.lastCheckup !== undefined) patch.last_checkup = values.lastCheckup || null;
  return patch;
}

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */

export function appointmentFromRow(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    memberId: row.member_id ?? undefined,
    doctor: row.doctor,
    specialty: row.specialty || 'General',
    date: row.appointment_date,
    time: row.appointment_time?.slice(0, 5) || '09:00',
    location: row.location || 'Not added',
    mode: (row.mode as Appointment['mode']) || 'In person',
    status: row.status as AppointmentStatus,
    reason: row.reason || '',
    notes: row.notes || undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Medications                                                         */
/* ------------------------------------------------------------------ */

export function medicationFromRow(row: MedicationRow): Medication {
  return {
    id: row.id,
    name: row.name,
    dosage: row.dosage || '',
    frequency: row.frequency || '',
    times: row.times ?? [],
    nextDose: row.next_dose || '',
    prescriber: row.prescriber || '',
    purpose: row.purpose || '',
    refillDate: row.refill_date ?? '',
    // "Taken today" only counts on the day it was ticked.
    takenToday: row.taken_today && row.taken_date === today(),
    food: (row.food as Medication['food']) || 'Any time',
  };
}

/* ------------------------------------------------------------------ */
/* Health records                                                      */
/* ------------------------------------------------------------------ */

export function healthRecordFromRow(row: HealthRecordRow): HealthRecord {
  return {
    id: row.id,
    title: row.title,
    category: row.category as RecordCategory,
    date: row.record_date,
    provider: row.provider || 'Not recorded',
    status: row.status as HealthRecord['status'],
    summary: row.summary || '',
    details: row.details ?? [],
    file: row.file_path ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Symptom journal                                                     */
/* ------------------------------------------------------------------ */

export function symptomFromRow(row: SymptomEntryRow): SymptomEntry {
  return {
    id: row.id,
    date: row.entry_date,
    symptom: row.symptom,
    severity: row.severity as Severity,
    duration: row.duration || '',
    notes: row.notes || '',
  };
}

/* ------------------------------------------------------------------ */
/* Dashboard metrics                                                   */
/* ------------------------------------------------------------------ */

export function metricFromRow(row: HealthMetricRow): HealthMetric {
  const series = Array.isArray(row.series) ? (row.series as { label: string; value: number }[]) : [];
  return {
    id: row.id,
    label: row.label,
    value: row.value,
    unit: row.unit,
    change: row.change || '',
    trend: (row.trend as HealthMetric['trend']) || 'stable',
    good: row.good,
    icon: row.icon || 'activity',
    series,
  };
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export function notificationFromRow(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type as NotificationType,
    link: row.link ?? undefined,
    read: row.read,
    createdAt: row.created_at,
  };
}