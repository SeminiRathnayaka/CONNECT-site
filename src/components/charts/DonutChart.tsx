export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
  ariaLabel?: string;
}

export function DonutChart({
  segments,
  size = 168,
  thickness = 18,
  centerLabel,
  centerSub,
  ariaLabel = 'Donut chart',
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${ariaLabel}: ${segments.map((s) => `${s.label} ${s.value}`).join(', ')}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2eaf2"
          strokeWidth={thickness}
        />
        {segments.map((s) => {
          const fraction = s.value / total;
          const length = fraction * circumference;
          const dash = `${Math.max(length - 3, 0)} ${circumference - Math.max(length - 3, 0)}`;
          const rotate = (offset / circumference) * 360 - 90;
          offset += length;
          return (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={dash}
              transform={`rotate(${rotate} ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      {centerLabel ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-ink-900">{centerLabel}</span>
          {centerSub ? (
            <span className="text-[11px] font-medium text-ink-500">{centerSub}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
