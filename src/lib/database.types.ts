/**
 * Row types for the CONNECT tables in supabase/schema.sql.
 *
 * Normally these are generated with `supabase gen types typescript`. They are
 * written by hand here so the app is type-safe before a Supabase project
 * exists. If you change the SQL, update the matching type here.
 */

export type Timestamp = string;
export type Json = unknown;

/** Columns the database fills in for you. */
export type Generated = {
  created_at?: Timestamp;
  updated_at?: Timestamp;
};

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  gender: string;
  blood_type: string;
  address: string;
  avatar_url: string | null;
  /** The signed-in person's own summary, shown on the Emergency screen. */
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergency_notes: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type FamilyMember = {
  id: string;
  owner_id: string;
  full_name: string;
  relationship: string;
  date_of_birth: string | null;
  gender: string;
  blood_type: string;
  accent: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  notes: string;
  last_checkup: string | null;
  heart_rate: number | null;
  blood_pressure: string | null;
  glucose: number | null;
  weight: number | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type Appointment = {
  id: string;
  owner_id: string;
  member_id: string | null;
  doctor: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  mode: string;
  status: string;
  reason: string;
  notes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type Medication = {
  id: string;
  owner_id: string;
  member_id: string | null;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  next_dose: string;
  prescriber: string;
  purpose: string;
  refill_date: string | null;
  taken_date: string | null;
  taken_today: boolean;
  food: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type HealthRecord = {
  id: string;
  owner_id: string;
  member_id: string | null;
  title: string;
  category: string;
  record_date: string;
  provider: string;
  status: string;
  summary: string;
  details: string[];
  file_path: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type SymptomEntry = {
  id: string;
  owner_id: string;
  member_id: string | null;
  entry_date: string;
  symptom: string;
  severity: string;
  duration: string;
  notes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type DoctorQuestion = {
  id: string;
  owner_id: string;
  appointment_id: string | null;
  text: string;
  category: string;
  done: boolean;
  created_at: Timestamp;
};

export type DoctorPrepNote = {
  owner_id: string;
  content: string;
  updated_at: Timestamp;
};

export type EmergencyContact = {
  id: string;
  owner_id: string;
  name: string;
  relation: string;
  phone: string;
  created_at: Timestamp;
};

export type HealthMetric = {
  id: string;
  owner_id: string;
  member_id: string | null;
  label: string;
  value: string;
  unit: string;
  change: string;
  trend: string;
  good: boolean;
  icon: string;
  series: Json;
  recorded_on: string;
  created_at: Timestamp;
};

export type NotificationRow = {
  id: string;
  owner_id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  read: boolean;
  created_at: Timestamp;
};

export type Report = {
  id: string;
  owner_id: string;
  member_id: string | null;
  filename: string;
  file_path: string | null;
  source: string;
  raw_text: string;
  summary_json: Json;
  created_at: Timestamp;
};

export type ReportTest = {
  report_id: string;
  position: number;
  name: string;
  raw: string;
  value: number | null;
  value_text: string;
  unit: string;
  range_text: string;
  reference_json: Json;
  comparator_json: Json;
  status: string;
};

export type ReportSummary = {
  report_id: string;
  language: string;
  text: string;
};

export type ReportExplanation = {
  report_id: string;
  test_name: string;
  language: string;
  text: string;
};

export type TermExplanation = {
  term: string;
  language: string;
  text: string;
};

export type ChatConversationRow = {
  id: string;
  owner_id: string;
  title: string;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: Timestamp;
};

/** Tables the app reads and writes. */
export interface ConnectTables {
  profiles: Profile;
  family_members: FamilyMember;
  appointments: Appointment;
  medications: Medication;
  health_records: HealthRecord;
  symptom_entries: SymptomEntry;
  doctor_questions: DoctorQuestion;
  doctor_prep_notes: DoctorPrepNote;
  emergency_contacts: EmergencyContact;
  health_metrics: HealthMetric;
  notifications: NotificationRow;
  reports: Report;
  report_tests: ReportTest;
  report_summaries: ReportSummary;
  report_explanations: ReportExplanation;
  term_explanations: TermExplanation;
  chat_conversations: ChatConversationRow;
  chat_messages: ChatMessageRow;
}

export type TableName = keyof ConnectTables;
export type RowOf<T extends TableName> = ConnectTables[T];

type TableSchema<TRow> = {
  Row: TRow;
  /** The database fills in ids, owner ids and timestamps, so they stay optional here. */
  Insert: Partial<TRow>;
  Update: Partial<TRow>;
};

/** The shape @supabase/supabase-js expects when the client is typed. */
export type Database = {
  public: {
    Tables: { [K in TableName]: TableSchema<ConnectTables[K]> };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};