/* ============================================================
   CONNECT — shared TypeScript models
   ============================================================ */

/* ---------- Auth ---------- */
export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  joinedAt: string;
  bloodType?: string;
  age?: number;
}

/* ---------- Family ---------- */
export type Relationship =
  | 'Self'
  | 'Mother'
  | 'Father'
  | 'Child'
  | 'Grandparent'
  | 'Sibling'
  | 'Spouse';

export interface FamilyVitals {
  heartRate: number;
  bloodPressure: string;
  glucose: number;
  weight: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: Relationship;
  age: number;
  gender: string;
  bloodType: string;
  initials: string;
  accent: 'blue' | 'teal' | 'violet' | 'amber' | 'rose';
  conditions: string[];
  allergies: string[];
  vitals?: FamilyVitals;
  medications: string[];
  upcomingAppointment?: {
    doctor: string;
    date: string;
    time: string;
  };
  lastCheckup?: string;
  notes?: string;
}

/* ---------- Health records ---------- */
export type RecordCategory =
  | 'Medical Reports'
  | 'Lab Results'
  | 'Vaccinations'
  | 'Conditions'
  | 'Allergies'
  | 'Medical History';

export interface HealthRecord {
  id: string;
  title: string;
  category: RecordCategory;
  date: string;
  provider: string;
  status: 'Active' | 'Resolved' | 'Stable' | 'Completed' | 'Chronic' | 'Archived';
  summary: string;
  details: string[];
  file?: string;
}

/* ---------- Reports & lab results ---------- */
export type ValueStatus = 'normal' | 'attention' | 'outside';

export interface TermExplanation {
  term: string;
  technical: string;
  simple: string;
  sinhala: string;
}

export interface LabResult {
  id: string;
  name: string;
  value: number;
  /** Raw text as printed on the report, e.g. "<0.1" or "Negative". */
  valueText: string;
  unit: string;
  reference: string;
  refLow: number | null;
  refHigh: number | null;
  status: ValueStatus;
  note: string;
  /** Set once Orayan has explained this test. */
  explanation?: string;
  explanationLoading?: boolean;
}

export interface MedicalReport {
  id: string;
  /** Backend report id, needed for explain / summary / ask calls. */
  reportId: string;
  fileName: string;
  type: string;
  date: string;
  lab: string;
  patient: string;
  results: LabResult[];
  explainedTerms: number;
  uploadedAt: string;
  counts?: {
    total: number;
    inRange: number;
    low: number;
    high: number;
    unknown: number;
    qualitative: number;
    flaggedTotal: number;
  };
  summaryText?: string;
}

/* ---------- Medications ---------- */
export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  nextDose: string;
  prescriber: string;
  purpose: string;
  refillDate: string;
  takenToday: boolean;
  food: 'Before food' | 'After food' | 'With food' | 'Any time';
}

/* ---------- Appointments ---------- */
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  mode: 'In person' | 'Video call';
  status: AppointmentStatus;
  reason: string;
  notes?: string;
}

/* ---------- Symptom journal ---------- */
export type Severity = 'Mild' | 'Moderate' | 'Severe';

export interface SymptomEntry {
  id: string;
  date: string;
  symptom: string;
  severity: Severity;
  duration: string;
  notes: string;
}

/* ---------- Health metrics ---------- */
export interface MetricPoint {
  label: string;
  value: number;
}

export interface HealthMetric {
  id: string;
  label: string;
  value: string;
  unit: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  good: boolean;
  icon: string;
  series: MetricPoint[];
}

/* ---------- Baymax chat ---------- */
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
  /** Backend session id so Baymax remembers the conversation. */
  sessionId?: string;
}

/* ---------- Health education ---------- */
export type ArticleCategory =
  | 'Nutrition'
  | 'Sleep'
  | 'Exercise'
  | 'Mental Wellness'
  | 'Medication Safety'
  | 'Preventive Care'
  | 'General Health';

export interface HealthArticle {
  id: string;
  title: string;
  category: ArticleCategory;
  excerpt: string;
  body: string[];
  readMinutes: number;
  icon: string;
}

/* ---------- Doctor prep ---------- */
export interface DoctorQuestion {
  id: string;
  text: string;
  category: string;
  done: boolean;
}

/* ---------- Emergency ---------- */
export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

/* ---------- Marketing ---------- */
export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
}

/* ---------- Notifications ---------- */
export type NotificationType =
  | 'appointment'
  | 'medication'
  | 'report'
  | 'symptom'
  | 'system';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  createdAt: string; // ISO timestamp
}
