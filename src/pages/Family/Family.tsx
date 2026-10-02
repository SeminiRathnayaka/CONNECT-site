import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, HeartPulse, Users } from 'lucide-react';
import { mockFamily } from '../../data/mockHealthData';
import { PageHeader } from '../../components/ui/PageHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { formatDate, relativeDay } from '../../utils/dates';

export default function Family() {
  const upcomingCount = mockFamily.filter((m) => m.upcomingAppointment).length;

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow="Manage family health"
        title="Family Profiles"
        description="A calm overview of everyone you care for — vitals, conditions, medications and upcoming visits."
        icon={<Users className="h-6 w-6" aria-hidden />}
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/70 px-3.5 py-2 text-xs font-bold text-primary-700">
            <CalendarClock className="h-4 w-4" aria-hidden />
            {upcomingCount} upcoming visits
          </span>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockFamily.map((m, i) => (
          <Link
            key={m.id}
            to={`/family/${m.id}`}
            className="glass group flex flex-col gap-4 rounded-3xl p-5 card-lift animate-fade-up"
            style={{ animationDelay: `${Math.min(i * 55, 330)}ms` }}
          >
            <div className="flex items-center gap-3.5">
              <Avatar name={m.name} initials={m.initials} accent={m.accent} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-ink-900">{m.name}</h2>
                <p className="text-xs text-ink-500">
                  {m.relationship} · {m.age} years · {m.gender}
                </p>
                <Badge tone="neutral" className="mt-1.5">
                  Blood {m.bloodType}
                </Badge>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-2 text-xs">
              <VitalCell label="Heart rate" value={`${m.vitals.heartRate} bpm`} />
              <VitalCell label="Blood pressure" value={m.vitals.bloodPressure} />
              <VitalCell label="Glucose" value={`${m.vitals.glucose} mg/dL`} />
              <VitalCell label="Weight" value={`${m.vitals.weight} kg`} />
            </dl>

            <div className="flex flex-wrap gap-1.5">
              {m.conditions.length > 0 ? (
                m.conditions.map((c) => (
                  <Badge key={c} tone="warn">
                    {c}
                  </Badge>
                ))
              ) : (
                <Badge tone="ok">No recorded conditions</Badge>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-3 text-xs">
              {m.upcomingAppointment ? (
                <span className="flex items-center gap-1.5 font-semibold text-primary-600">
                  <HeartPulse className="h-3.5 w-3.5" aria-hidden />
                  Visit {relativeDay(m.upcomingAppointment.date)} ·{' '}
                  {formatDate(m.upcomingAppointment.date)}
                </span>
              ) : (
                <span className="text-ink-400">No upcoming visit</span>
              )}
              <span className="font-bold text-primary-600 opacity-0 transition group-hover:opacity-100">
                Open <ArrowRight className="inline h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function VitalCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white/70 px-3 py-2">
      <dt className="text-[10px] font-semibold tracking-wide text-ink-400 uppercase">{label}</dt>
      <dd className="mt-0.5 font-bold text-ink-800">{value}</dd>
    </div>
  );
}
