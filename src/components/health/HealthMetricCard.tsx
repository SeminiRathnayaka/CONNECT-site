import { GlassCard } from '../ui/GlassCard';
import { Sparkline } from '../charts/Sparkline';
import { Badge } from '../ui/Badge';
import { iconFor } from '../../utils/icons';
import type { HealthMetric } from '../../types';

interface HealthMetricCardProps {
  metric: HealthMetric;
  onSelect?: () => void;
}

const trendStroke: Record<HealthMetric['trend'], string> = {
  up: '#10b981',
  down: '#2563eb',
  stable: '#6b819b',
};

export function HealthMetricCard({ metric, onSelect }: HealthMetricCardProps) {
  const Icon = iconFor(metric.icon);
  const positive = metric.good;

  return (
    <GlassCard
      hover
      glow
      padded={false}
      className="group p-5 transition-transform"
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      aria-label={onSelect ? `Open details for ${metric.label}` : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-600 group-hover:text-white">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
              {metric.label}
            </p>
            <p className="text-xl font-bold text-ink-900">
              {metric.value}
              <span className="ml-1 text-xs font-medium text-ink-500">{metric.unit}</span>
            </p>
          </div>
        </div>
        <Sparkline
          data={metric.series.map((p) => p.value)}
          stroke={trendStroke[metric.trend]}
          label={`${metric.label} trend`}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge tone={positive ? 'ok' : 'warn'}>{metric.change}</Badge>
        <span className="text-[11px] text-ink-400">last 7 days</span>
      </div>
    </GlassCard>
  );
}
