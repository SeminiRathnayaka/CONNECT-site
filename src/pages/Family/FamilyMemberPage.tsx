import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Pill,
  Trash2,
} from 'lucide-react';
import { useFamily } from '../../hooks/useFamily';
import { useToast } from '../../hooks/useToast';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { GlassCard } from '../../components/ui/GlassCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingState } from '../../components/ui/LoadingState';
import { buttonClass } from '../../components/ui/Button';
import { formatDate, relativeDay } from '../../utils/dates';

export default function FamilyMemberPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { family, removeFamily, loading } = useFamily();
  const member = family.find((m) => m.id === memberId);

  const removeProfile = async () => {
    if (!member) return;
    if (!window.confirm(`Remove the profile for ${member.name}?`)) return;
    const removed = await removeFamily(member.id);
    if (!removed) return;
    toast('Family profile removed.');
    navigate('/family');
  };

  if (loading) {
    return (
      <div className="page-container py-10">
        <LoadingState label="Loading profile…" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="page-container py-10">
        <EmptyState
          title="Family member not found"
          description="This profile may have been removed."
          action={
            <Link to="/family" className={buttonClass('primary', 'sm')}>
              Back to family
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page-container py-6 sm:py-8">
      <Link
        to="/family"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 transition hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All family profiles
      </Link>

      <div className="glass mb-6 flex flex-col gap-5 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={member.name} initials={member.initials} accent={member.accent} size="xl" />
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary-600 uppercase">
              {member.relationship} profile
            </p>
            <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{member.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="neutral">{member.age} years</Badge>
              {member.bloodType ? (
                <Badge tone="neutral">Blood {member.bloodType}</Badge>
              ) : null}
              {member.lastCheckup ? (
                <Badge tone="primary">Last checkup {formatDate(member.lastCheckup)}</Badge>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/appointments" className={buttonClass('secondary', 'sm')}>
            <CalendarClock className="h-4 w-4" aria-hidden />
            Appointments
          </Link>
          <Link to="/medications" className={buttonClass('soft', 'sm')}>
            <Pill className="h-4 w-4" aria-hidden />
            Medications
          </Link>
          <button type="button" className={buttonClass('danger', 'sm')} onClick={() => void removeProfile()}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Remove profile
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Vitals */}
        <GlassCard className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-bold text-ink-900">Vitals at a glance</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <BigStat
              label="Heart rate"
              value={member.vitals ? String(member.vitals.heartRate) : '—'}
              unit="bpm"
            />
            <BigStat
              label="Blood pressure"
              value={member.vitals?.bloodPressure ?? '—'}
              unit="mmHg"
            />
            <BigStat
              label="Glucose"
              value={member.vitals ? String(member.vitals.glucose) : '—'}
              unit="mg/dL"
            />
            <BigStat
              label="Weight"
              value={member.vitals ? String(member.vitals.weight) : '—'}
              unit="kg"
            />
          </div>

          {member.notes ? (
            <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-warn-100 bg-warn-50/70 px-4 py-3 text-sm leading-relaxed text-warn-700">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {member.notes}
            </p>
          ) : null}
        </GlassCard>

        {/* Appointment */}
        <div className="flex flex-col gap-4">
          <GlassCard>
            <h2 className="mb-3 text-sm font-bold text-ink-900">Upcoming appointment</h2>
            {member.upcomingAppointment ? (
              <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-aqua-50 p-4">
                <p className="text-sm font-bold text-ink-900">
                  {member.upcomingAppointment.doctor}
                </p>
                <p className="mt-1 text-xs text-ink-500">
                  {relativeDay(member.upcomingAppointment.date)} ·{' '}
                  {formatDate(member.upcomingAppointment.date)} at {member.upcomingAppointment.time}
                </p>
                <Link to="/appointments" className={buttonClass('soft', 'sm', 'mt-3')}>
                  Manage appointments
                </Link>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-500">
                <CheckCircle2 className="h-4 w-4 text-ok-500" aria-hidden />
                Nothing scheduled right now.
              </p>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="mb-3 text-sm font-bold text-ink-900">Allergies</h2>
            {member.allergies.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {member.allergies.map((a) => (
                  <li key={a}>
                    <Badge tone={a.toLowerCase().includes('no known') ? 'ok' : 'alert'}>
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      {a}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">No known allergies recorded.</p>
            )}
          </GlassCard>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <GlassCard>
          <h2 className="mb-3 text-sm font-bold text-ink-900">Conditions</h2>
          <ul className="space-y-2">
            {member.conditions.length > 0 ? (
              member.conditions.map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white/70 px-3.5 py-2.5 text-sm text-ink-700"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-warn-500" />
                  {c}
                </li>
              ))
            ) : (
              <li className="text-sm text-ink-500">No recorded conditions.</li>
            )}
          </ul>
        </GlassCard>

        <GlassCard>
          <h2 className="mb-3 text-sm font-bold text-ink-900">Current medications</h2>
          <ul className="space-y-2">
            {member.medications.length > 0 ? (
              member.medications.map((med) => (
                <li
                  key={med}
                  className="flex items-center gap-2.5 rounded-xl border border-ink-100 bg-white/70 px-3.5 py-2.5 text-sm text-ink-700"
                >
                  <Pill className="h-4 w-4 shrink-0 text-primary-500" />
                  {med}
                </li>
              ))
            ) : (
              <li className="text-sm text-ink-500">No regular medications.</li>
            )}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

function BigStat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white/70 px-4 py-3.5">
      <p className="text-[10px] font-semibold tracking-wide text-ink-400 uppercase">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink-900">
        {value}
        {value === '—' ? null : (
          <span className="ml-1 text-[11px] font-medium text-ink-500">{unit}</span>
        )}
      </p>
    </div>
  );
}
