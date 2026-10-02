import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CalendarCheck, HeartPulse, Users } from 'lucide-react';
import { buttonClass } from '../../../components/ui/Button';
import { DashboardImagePlaceholder } from '../../../components/images/Placeholders';

const points = [
  { icon: BarChart3, text: 'Live vitals with 30-day trend charts' },
  { icon: CalendarCheck, text: 'Upcoming appointments and medication schedule' },
  { icon: HeartPulse, text: 'Recent reports with out-of-range alerts' },
  { icon: Users, text: 'A quick overview of the whole family' },
];

export function DashboardShowcase() {
  return (
    <section className="page-container py-14 sm:py-16" aria-labelledby="dashboard-showcase">
      <div className="glass overflow-hidden rounded-[32px]">
        <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold tracking-widest text-primary-600 uppercase">
              Centralized Health Dashboard
            </p>
            <h2
              id="dashboard-showcase"
              className="mt-3 text-2xl leading-tight font-bold text-ink-900 sm:text-3xl"
            >
              Every number that matters,
              <br className="hidden sm:block" /> on a single screen
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-600 sm:text-base">
              Heart rate, blood pressure, glucose, sleep and water intake — trended over time,
              next to your reports, medicines and appointments.
            </p>

            <ul className="mt-6 space-y-3">
              {points.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.text} className="flex items-start gap-3 text-sm text-ink-700">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    {p.text}
                  </li>
                );
              })}
            </ul>

            <Link to="/dashboard" className={buttonClass('primary', 'md', 'mt-7')}>
              Open the dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="order-1 aspect-[16/11] overflow-hidden rounded-3xl ring-1 ring-white/70 lg:order-2">
            <DashboardImagePlaceholder />
          </div>
        </div>
      </div>
    </section>
  );
}
