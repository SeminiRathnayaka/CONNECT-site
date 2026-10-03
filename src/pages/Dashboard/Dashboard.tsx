import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, HeartPulse, NotebookPen, Siren, Sparkles } from 'lucide-react';
import type { HealthMetric } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { GlassCard } from '../../components/ui/GlassCard';
import { HealthMetricCard } from '../../components/health/HealthMetricCard';
import { LineChart } from '../../components/charts/LineChart';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { buttonClass } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useReports } from '../../hooks/useReports';
import { useFamily } from '../../hooks/useFamily';
import { useAppointments, useHealthMetrics, useMedications } from '../../hooks/useHealthFeatures';
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

export default function Dashboard() {
  const { user } = useAuth();
  const { reports } = useReports();
  const { family } = useFamily();
  const { items: appointments } = useAppointments();
  const { items: medications } = useMedications();
  const { items: metrics } = useHealthMetrics();
  const [selected, setSelected] = useState<HealthMetric | null>(null);

  const firstName = user?.name.split(' ')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const nextVisit = appointments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const upcomingVisits = family.filter((m) => m.upcomingAppointment).length;

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
          subtitle={
            metrics.length > 0 ? 'Tap any card to see its trend in detail.' : undefined
          }
        />
        {metrics.length === 0 ? (
          <EmptyState
            title="No readings yet"
            description="Readings from a synced device or manual entries will show up here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((m, i) => (
              <div
                key={m.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <HealthMetricCard metric={m} onSelect={() => setSelected(m)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Charts ---------- */}
      <section aria-labelledby="charts-title" className="mb-8">
        <SectionHeader
          id="charts-title"
          align="left"
          title="Trends & adherence"
          subtitle="Charts appear as readings are recorded and doses are tracked."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <GlassCard className="lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-ink-900">Health trends</h3>
              <p className="text-xs text-ink-500">Last 30 days</p>
            </div>
            <EmptyState
              title="No trend data yet"
              description="Your 30-day trend will chart here once readings are synced or entered."
            />
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-bold text-ink-900">Medication adherence</h3>
            <p className="text-xs text-ink-500">Last 30 days</p>
            <div className="mt-5">
              <EmptyState
                title="No adherence data yet"
                description="Adherence appears once doses are tracked."
              />
            </div>
          </GlassCard>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <GlassCard>
            <h3 className="text-sm font-bold text-ink-900">Vitals history · sleep</h3>
            <p className="mb-3 text-xs text-ink-500">Hours per night this week</p>
            <EmptyState
              title="No sleep data yet"
              description="Sleep hours per night will chart here once your device syncs."
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
            <UpcomingAppointments appointments={appointments} />
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
            <CurrentMedications medications={medications} />
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
                    {family.length} profiles · {upcomingVisits} upcoming visits
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
      {selected ? (
        <Modal
          open
          onClose={() => setSelected(null)}
          title={selected.label}
          description={`Last 7 days · ${selected.unit}`}
        >
          <MetricDetail metric={selected} />
        </Modal>
      ) : null}
    </div>
  );
}

function MetricDetail({ metric }: { metric: HealthMetric }) {
  const SelectedIcon = iconFor(metric.icon);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white/70 px-4 py-3">
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <SelectedIcon className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block text-lg font-bold text-ink-900">
              {metric.value}
              <span className="ml-1 text-xs font-medium text-ink-500">{metric.unit}</span>
            </span>
            <span className="block text-xs text-ink-500">{metric.change}</span>
          </span>
        </span>
        <span
          className={
            metric.good
              ? 'rounded-full bg-ok-50 px-3 py-1 text-xs font-bold text-ok-700'
              : 'rounded-full bg-warn-50 px-3 py-1 text-xs font-bold text-warn-700'
          }
        >
          {metric.good ? 'Looking good' : 'Keep an eye on it'}
        </span>
      </div>

      <LineChart
        series={[
          {
            name: metric.label,
            color: metric.good ? '#2563eb' : '#f59e0b',
            data: metric.series.map((p) => p.value),
          },
        ]}
        labels={metric.series.map((p) => p.label)}
        unit={` ${metric.unit}`}
        ariaLabel={`${metric.label} over the last seven days`}
      />

      <div className="flex justify-end">
        <Link to="/health-records" className={buttonClass('secondary', 'sm')}>
          Open health records
        </Link>
      </div>
    </div>
  );
}
