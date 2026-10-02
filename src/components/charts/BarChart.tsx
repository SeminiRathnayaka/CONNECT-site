interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
  unit?: string;
  ariaLabel?: string;
}

const W = 640;
const H = 220;
const PAD = { top: 14, right: 10, bottom: 26, left: 36 };

export function BarChart({
  data,
  color = '#2563eb',
  unit = '',
  ariaLabel = 'Bar chart',
}: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.55, 34);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
        {[0, 0.5, 1].map((g) => {
          const y = PAD.top + g * innerH;
          return (
            <g key={g}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#e2eaf2" strokeDasharray="4 5" />
              <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a7bc">
                {Math.round(max * (1 - g))}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const y = PAD.top + innerH - h;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(h, 2)}
                rx={Math.min(8, barW / 3)}
                fill={color}
                opacity={0.9}
              >
                <title>{`${d.label}: ${d.value}${unit}`}</title>
              </rect>
              <text
                x={x + barW / 2}
                y={H - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#94a7bc"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
