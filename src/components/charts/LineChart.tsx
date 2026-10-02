import { useId, useMemo, useState } from 'react';

export interface ChartSeries {
  name: string;
  color: string;
  data: number[];
}

interface LineChartProps {
  series: ChartSeries[];
  labels: string[];
  height?: number;
  unit?: string;
  ariaLabel?: string;
}

const W = 640;
const H = 240;
const PAD = { top: 16, right: 14, bottom: 28, left: 40 };

/** Multi-series line chart drawn by hand (no chart library). */
export function LineChart({ series, labels, unit = '', ariaLabel = 'Line chart' }: LineChartProps) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const all = series.flatMap((s) => s.data);
  const { min, max } = useMemo(() => {
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const span = hi - lo || 1;
    return { min: lo - span * 0.18, max: hi + span * 0.18 };
  }, [all]);

  const count = labels.length;
  const xAt = (i: number) => PAD.left + (i / Math.max(count - 1, 1)) * (W - PAD.left - PAD.right);
  const yAt = (v: number) =>
    PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom);

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.ceil(count / 8);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={series[0]?.color ?? '#2563eb'} stopOpacity="0.25" />
            <stop offset="100%" stopColor={series[0]?.color ?? '#2563eb'} stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => {
          const y = PAD.top + g * (H - PAD.top - PAD.bottom);
          const value = max - g * (max - min);
          return (
            <g key={g}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke="#e2eaf2"
                strokeWidth="1"
                strokeDasharray="4 5"
              />
              <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a7bc">
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {labels.map((l, i) =>
          i % labelStep === 0 ? (
            <text
              key={`${l}-${i}`}
              x={xAt(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#94a7bc"
            >
              {l}
            </text>
          ) : null,
        )}

        {series.map((s) => {
          const line = s.data
            .map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
            .join(' ');
          const area = `${line} L${xAt(s.data.length - 1).toFixed(1)},${H - PAD.bottom} L${xAt(0).toFixed(1)},${H - PAD.bottom} Z`;
          return (
            <g key={s.name}>
              <path d={area} fill={`url(#${gradientId})`} />
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {s.data.map((v, i) => (
                <circle
                  key={`${s.name}-${i}`}
                  cx={xAt(i)}
                  cy={yAt(v)}
                  r={hover === i ? 4.5 : 2.5}
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth="2"
                />
              ))}
            </g>
          );
        })}

        {labels.map((l, i) => (
          <rect
            key={`hit-${i}`}
            x={xAt(i) - (W / count) * 0.4}
            y={PAD.top}
            width={(W / count) * 0.8}
            height={H - PAD.top - PAD.bottom}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          >
            <title>
              {l}: {series.map((s) => `${s.name} ${s.data[i]}${unit}`).join(' · ')}
            </title>
          </rect>
        ))}

        {hover !== null ? (
          <line
            x1={xAt(hover)}
            x2={xAt(hover)}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke="#93c5fd"
            strokeWidth="1"
          />
        ) : null}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-xs text-ink-600">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
