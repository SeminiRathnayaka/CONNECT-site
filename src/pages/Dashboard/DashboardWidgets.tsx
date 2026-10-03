import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Pill,
  Siren,
} from 'lucide-react';
import type { Appointment, MedicalReport, Medication } from '../../types';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { buttonClass } from '../../components/ui/Button';
import { useFamily } from '../../hooks/useFamily';
import { useAiStatus } from '../../hooks/useAiStatus';
import { formatDate, relativeDay } from '../../utils/dates';

/* ------------------------------------------------------------------ */
/* Recent reports                                                      */
/* ------------------------------------------------------------------ */
export function RecentReports({ reports }: { reports: MedicalReport[] }) {
  if (reports.length === 0) {
    return <EmptyState title="No reports yet" description="Upload one with Orayan AI." />;
  }
  return (
    <ul className="space-y-2.5">
      {reports.slice(0, 4).map((r) => (
        <li key={r.id}>
          <Link
            to={`/report-history/${r.id}`}
            className="group flex items-center gap-3 rounded-2xl border border-ink-100 bg-white/70 px-3.5 py-3 transition hover:border-primary-200 hover:bg-white"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
              <FileText className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-800">{r.type}</span>
              <span className="block truncate text-xs text-ink-500">
                {formatDate(r.date)} · {r.lab}
              </span>
            </span>
            {r.results.length > 0 ? (
              <Badge tone="primary">{r.results.length} values</Badge>
            ) : (
              <Badge tone="neutral">No analysis</Badge>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Appointments                                                        */
/* ------------------------------------------------------------------ */
export function UpcomingAppointments({ appointments }: { appointments: Appointment[] }) {
  const upcoming = appointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) {
    return <EmptyState title="Nothing scheduled" description="Book an appointment to see it here." />;
  }

  return (
    <ul className="space-y-2.5">
      {upcoming.map((a) => (
        <li key={a.id}>
          <Link
            to="/appointments"
            className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white/70 px-3.5 py-3 transition hover:border-primary-200 hover:bg-white"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <span className="text-center leading-none">
                <span className="block text-[9px] font-semibold opacity-80">DATE</span>
                <span className="block text-sm font-bold">
                  {new Date(a.date).getDate()}
                </span>
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-800">
                {a.doctor}
              </span>
              <span className="block truncate text-xs text-ink-500">
                {a.specialty} · {a.time}
              </span>
            </span>
            <Badge tone="primary">{relativeDay(a.date)}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Medications                                                         */
/* ------------------------------------------------------------------ */
export function CurrentMedications({ medications }: { medications: Medication[] }) {
  if (medications.length === 0) {
    return (
      <EmptyState
        title="No medications yet"
        description="Add a medication to see today's schedule here."
      />
    );
  }

  return (
    <ul className="space-y-2.5">
      {medications.slice(0, 4).map((m) => (
        <li
          key={m.id}
          className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white/70 px-3.5 py-3"
        >
          <span
            className={
              m.takenToday
                ? 'grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ok-50 text-ok-600'
                : 'grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warn-50 text-warn-600'
            }
          >
            {m.takenToday ? (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            ) : (
              <Pill className="h-4 w-4" aria-hidden />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink-800">{m.name}</span>
            <span className="block text-xs text-ink-500">
              {m.dosage} · next dose {m.nextDose}
            </span>
          </span>
          <Badge tone={m.takenToday ? 'ok' : 'warn'}>
            {m.takenToday ? 'Taken' : 'Pending'}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* AI insights                                                         */
/* ------------------------------------------------------------------ */
export function AiInsights() {
  const { online } = useAiStatus(60000);

  return (
    <EmptyState
      title={online ? 'No insights yet' : 'AI insights'}
      description={
        online
          ? 'Insights will appear once Orayan has analyzed a report for you.'
          : 'The AI server is not running. Start it with "npm run dev" to see insights here.'
      }
      action={
        <Link to="/baymax" className={buttonClass('soft', 'sm')}>
          Ask Baymax
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* Family overview                                                     */
/* ------------------------------------------------------------------ */
export function FamilyOverview() {
  const { family } = useFamily();
  const members = family.slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {family.length === 0 ? (
        <EmptyState
          title="No family profiles yet"
          description="Add family profiles to see everyone you care for at a glance."
          action={
            <Link to="/family" className={buttonClass('primary', 'sm')}>
              Add a family profile
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {members.map((m) => (
            <li key={m.id}>
              <Link
                to={`/family/${m.id}`}
                className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white/70 px-3.5 py-2.5 transition hover:border-primary-200 hover:bg-white"
              >
                <Avatar name={m.name} initials={m.initials} accent={m.accent} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink-800">
                    {m.name}
                  </span>
                  <span className="block text-xs text-ink-500">
                    {m.relationship} · BP {m.vitals?.bloodPressure ?? '—'}
                  </span>
                </span>
                <span className="text-xs font-bold text-primary-600">View</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/emergency"
        className="flex items-center gap-3 rounded-2xl border border-alert-100 bg-alert-50 px-4 py-3 transition hover:bg-alert-100"
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-alert-600">
          <Siren className="h-4 w-4" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-alert-700">Emergency access</span>
          <span className="block text-xs text-alert-600/90">
            Contacts, allergies and medications
          </span>
        </span>
        <ArrowRight className="h-4 w-4 text-alert-500" aria-hidden />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Appointment quick-glance strip                                      */
/* ------------------------------------------------------------------ */
export function NextVisitCard({ appointment }: { appointment?: Appointment }) {
  if (!appointment) return null;
  return (
    <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-aqua-50 p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-primary-600 uppercase">
        <CalendarClock className="h-3.5 w-3.5" aria-hidden /> Next visit
      </p>
      <p className="mt-1.5 text-sm font-bold text-ink-900">{appointment.doctor}</p>
      <p className="text-xs text-ink-500">{appointment.specialty}</p>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-primary-500" aria-hidden />
          {formatDate(appointment.date)} · {appointment.time}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-primary-500" aria-hidden />
          {appointment.location}
        </span>
      </div>
      <Link to="/appointments" className={buttonClass('soft', 'sm', 'mt-3')}>
        All appointments
      </Link>
    </div>
  );
}
