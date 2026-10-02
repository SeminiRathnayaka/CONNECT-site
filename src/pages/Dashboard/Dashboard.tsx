import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CalendarPlus,
  HeartPulse,
  NotebookPen,
  Siren,
  Sparkles,
} from 'lucide-react';
import type { HealthMetric } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { HealthMetricCard } from '../../components/health/HealthMetricCard';
import { LineChart } from '../../components/charts/LineChart';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { Modal } from '../../components/ui/Modal';
import { buttonClass } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import {
  mockAppointments,
  mockFamily,
  mockMedications,
  mockMetrics,
  medicationAdherence,
  vitalsHistory,
} from '../../data/mockHealthData';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../hooks/useAuth';
import { iconFor } from '../../utils/icons';
import { formatDate } from '../../utils/dates';
import {
  AiInsights,
  CurrentMedications,
  FamilyOverview,
  NextVisitCard,
  RecentReports,
  UpcomingAppointments,
} from './DashboardWidgets';

type TrendKey = 'glucose' | 'systolic' | 'resting';

const trendOptions: Array<{ key: TrendKey; label: string; color: string; unit: string }> = [
  { key: 'glucose', label: 'Blood glucose', color: '#2563eb', unit: ' mg/dL' },
  { key: 'systolic', label: 'Systolic BP', color: '#14b8a6', unit: ' mmHg' },
  { key: 'resting', label: 'Resting heart rate', color: '#8b5cf6', unit: ' bpm' },
];

const dayLabels = Array.from({ length: 30 }, (_, i) => (i === 29 ? 'Today' : `-${29 - i}`));

export default function Dashboard() {
  const { user } = useAuth();
  const [reports] = useReports();
  const [selected, setSelected] = useState<HealthMetric | null>(null);
  const [trend, setTrend] = useState<TrendKey>('glucose');

  const firstName = user?.name.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const activeTrend = trendOptions.find((t) => t.key === trend) ?? trendOptions[0];
  const trendSeries = useMemo(
    () => [
      {
        name: activeTrend.label,
        color: activeTrend.color,
        data: vitalsHistory[trend],
      },
    ],
    [activeTrend, trend],
  );

  const sleepSeries = mockMetrics.find((m) => m.id === 'sleep');
  const sleepBars = sleepSeries
    ? sleepSeries.series.map((p) => ({ label: p.label, value: p.value }))
    : [];

  const nextVisit = mockAppointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const adherence = medicationAdherence.map((s, i) => ({
    ...s,
    color: ['#10b981', '#f59e0b', '#ef4444'][i] ?? '#94a7bc',
  }));

  const SelectedIcon = selected ? iconFor(selected.icon) : Activity;

  return (
    <div className="page-container py-6 sm:py-8">
      <PageHeader
        eyebrow={formatDate(new Date().toISOString().slice(0, 10))}
        title={`${greeting}, ${firstName}`}
        description="Here is the latest picture of your health — vitals, reports, medicines and your family at a glance."
        icon={<HeartPulse className="h-6 w-6" aria-hidden />}
        actions={
          <>
            <Link to="/symptom-journal" className={buttonClass('secondary', 'sm')}>
              <NotebookPen className="h-4 w-4" aria-hidden />
              Log a symptom
            </Link>
            <Link to="/emergency" className={buttonClass('danger', 'sm')}>
              <Siren className="h-4 w-4" aria-hidden />
              Emergency
            </Link>
          </>
        }
      />

      {/* ---------- Health overview ---------- */}
      <section aria-labelledby="health-overview" className="mb-8">
        <SectionHeader
          id="health-overview"
          align="left"
          title="Health overview"
          subtitle="Tap any card to see its trend in detail."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mockMetrics.map((m, i) => (
            <div key={m.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <HealthMetricCard metric={m} onSelect={() => setSelected(m)} />
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Charts ---------- */}
      <section aria-labelledby="charts-title" className="mb-8">
        <SectionHeader
          id="charts-title"
          align="left"
          title="Trends & adherence"
          subtitle="Thirty days of readings, plus how consistently medicines are taken."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-ink-900">Health trends</h3>
                <p className="text-xs text-ink-500">Last 30 days · {activeTrend.label}</p>
              </div>
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Trend metric">
                {trendOptions.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={trend === t.key}
                    onClick={() => setTrend(t.key)}
                    className={
                      trend === t.key
                        ? 'rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm'
                        : 'rounded-full border border-ink-200 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-ink-500 transition hover:border-primary-300 hover:text-primary-600'
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <LineChart
              series={trendSeries}
              labels={dayLabels}
              unit={activeTrend.unit}
              ariaLabel={`${activeTrend.label} over the last 30 days`}
            />
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-bold text-ink-900">Medication adherence</h3>
            <p className="text-xs text-ink-500">Last 30 days</p>
            <div className="mt-5 flex flex-col items-center gap-5">
              <DonutChart
                segments={adherence}
                centerLabel="92%"
                centerSub="doses taken"
                ariaLabel="Medication adherence"
              />
              <ul className="w-full space-y-2">
                {adherence.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-xs"
                  >
                    <span className="flex items-center gap-2 text-ink-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: s.color }}
                        aria-hidden
                      />
                      {s.label}
                    </span>
                    <span className="font-bold text-ink-900">{s.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <GlassCard>
            <h3 className="text-sm font-bold text-ink-900">Vitals history · sleep</h3>
            <p className="mb-3 text-xs text-ink-500">Hours per night this week</p>
            <BarChart
              data={sleepBars}
              color="#14b8a6"
              unit=" h"
              ariaLabel="Sleep hours for the last seven days"
            />
          </GlassCard>

          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink-900">Recent reports</h3>
                <p className="text-xs text-ink-500">From your report history</p>
              </div>
              <Link
                to="/report-history"
                className="text-[11px] font-bold text-primary-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <RecentReports reports={reports} />
          </GlassCard>

          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink-900">Upcoming appointments</h3>
                <p className="text-xs text-ink-500">Next visits on your calendar</p>
              </div>
              <Link
                to="/appointments"
                className="text-[11px] font-bold text-primary-600 hover:underline"
              >
                Manage
              </Link>
            </div>
            <UpcomingAppointments appointments={mockAppointments} />
          </GlassCard>
        </div>
      </section>

      {/* ---------- Medications / insights / family ---------- */}
      <section aria-labelledby="more-title">
        <SectionHeader
          id="more-title"
          align="left"
          title="Medications, insights & family"
          subtitle="Everything else you track in CONNECT."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink-900">Current medications</h3>
                <p className="text-xs text-ink-500">Today's schedule</p>
              </div>
              <Link
                to="/medications"
                className="text-[11px] font-bold text-primary-600 hover:underline"
              >
                Manage
              </Link>
            </div>
            <CurrentMedications medications={mockMedications} />
            <Link to="/medications" className={buttonClass('soft', 'sm', 'mt-3 w-full')}>
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Add or edit medication
            </Link>
          </GlassCard>

          <GlassCard>
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-aqua-50 text-aqua-600">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink-900">AI insights</h3>
                <p className="text-xs text-ink-500">Generated from your data</p>
              </div>
            </div>
            <AiInsights />
          </GlassCard>

          <div className="flex flex-col gap-4">
            <GlassCard>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-ink-900">Family overview</h3>
                  <p className="text-xs text-ink-500">
                    {mockFamily.length} profiles ·{' '}
                    {mockFamily.filter((m) => m.upcomingAppointment).length} upcoming visits
                  </p>
                </div>
                <Link to="/family" className="text-[11px] font-bold text-primary-600 hover:underline">
                  All
                </Link>
              </div>
              <FamilyOverview />
            </GlassCard>

            {nextVisit ? <NextVisitCard appointment={nextVisit} /> : null}
          </div>
        </div>
      </section>

      {/* ---------- Metric detail modal ---------- */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? selected.label : ''}
        description={selected ? `Last 7 days · ${selected.unit}` : ''}
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white/70 px-4 py-3">
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  <SelectedIcon className="h-5 w-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-lg font-bold text-ink-900">
                    {selected.value}
                    <span className="ml-1 text-xs font-medium text-ink-500">{selected.unit}</span>
                  </span>
                  <span className="block text-xs text-ink-500">{selected.change}</span>
                </span>
              </span>
              <span
                className={
                  selected.good
                    ? 'rounded-full bg-ok-50 px-3 py-1 text-xs font-bold text-ok-700'
                    : 'rounded-full bg-warn-50 px-3 py-1 text-xs font-bold text-warn-700'
                }
              >
                {selected.good ? 'Looking good' : 'Keep an eye on it'}
              </span>
            </div>

            <LineChart
              series={[
                {
                  name: selected.label,
                  color: selected.good ? '#2563eb' : '#f59e0b',
                  data: selected.series.map((p) => p.value),
                },
              ]}
              labels={selected.series.map((p) => p.label)}
              unit={` ${selected.unit}`}
              ariaLabel={`${selected.label} over the last seven days`}
            />

            <p className="rounded-xl bg-primary-50 px-4 py-3 text-xs leading-relaxed text-ink-600">
              These readings are demo data for the CONNECT prototype. Connect a device or enter
              readings manually to populate this chart with your own values.
            </p>

            <div className="flex justify-end">
              <Link to="/health-records" className={buttonClass('secondary', 'sm')}>
                Open health records
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
