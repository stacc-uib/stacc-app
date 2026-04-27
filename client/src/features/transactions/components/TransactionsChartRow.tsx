import type { TransactionsChartData, TypeDataPoint } from '../lib/getTransactionsChartData';
import type { TransactionsGrowth } from '../lib/getTransactionsGrowth';

type Props = {
  averageTransactionSize: number;
  chartData: TransactionsChartData;
  growth: TransactionsGrowth;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatGrowth(pct: number | null) {
  if (pct === null) return { label: 'Ingen forrige periode', color: '#9ca3af' };
  const sign = pct >= 0 ? '+' : '';
  const color = pct >= 0 ? '#16a34a' : '#dc2626';
  return { label: `${sign}${pct.toFixed(1).replace('.', ',')} %`, color };
}

const TYPE_COLORS = [
  '#ff7415', '#6b7280', '#9ca3af', '#374151',
  '#d1d5db', '#b85717', '#4b5563', '#e5e7eb',
  '#ff7415', '#1f2937',
];

function VolumeChart({ data }: { data: TransactionsChartData['volumeByPeriod'] }) {
  if (data.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Ingen data</p>
    </div>
  );

  const w = 300; const h = 160;
  const pad = { top: 20, right: 12, bottom: 28, left: 36 };
  const iw = w - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;
  const maxCount = Math.max(...data.map((d) => d.count));
  const n = data.length;

  function x(i: number) { return pad.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw); }
  function y(count: number) { return pad.top + ih - (count / (maxCount || 1)) * ih; }

  const points = data.map((d, i) => `${x(i)},${y(d.count)}`).join(' ');
  const yTicks = [0, Math.round(maxCount / 2), maxCount];
  const xTicks = data.filter((_, i) => i === 0 || i === n - 1 || n <= 6);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      <rect width={w} height={h} fill="#fff" rx={4} />
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} stroke="rgba(17,24,39,0.08)" strokeWidth={0.5} />
          <text x={pad.left - 4} y={y(t) + 4} textAnchor="end" fill="#9ca3af" fontSize={8}>
            {t > 999 ? `${Math.round(t / 1000)}k` : t}
          </text>
        </g>
      ))}
      {xTicks.map((d, i) => (
        <text key={d.label} x={x(data.indexOf(d))} y={h - 6} textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'} fill="#9ca3af" fontSize={7}>
          {d.label}
        </text>
      ))}
      <polyline points={points} fill="none" stroke="#ff7415" strokeWidth={2} strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={d.label} cx={x(i)} cy={y(d.count)} r={3} fill="#ff7415" />
      ))}
      <text x={w / 2} y={13} textAnchor="middle" fill="#374151" fontSize={9} fontWeight="bold">
        Transaksjonsvolum
      </text>
    </svg>
  );
}

function PieChart({ data }: { data: TypeDataPoint[] }) {
  if (data.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Ingen data</p>
    </div>
  );

  const w = 300; const h = 160;
  const cx = 110; const cy = h / 2; const r = 62;
  const total = data.reduce((s, d) => s + d.count, 0);
  let angle = -Math.PI / 2;

  function slice(count: number) {
    const sweep = (count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, midAngle: angle - sweep / 2 };
  }

  const slices = data.map((d, i) => ({ ...d, color: TYPE_COLORS[i % TYPE_COLORS.length], ...slice(d.count) }));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      <rect width={w} height={h} fill="#fff" rx={4} />
      <text x={w / 2} y={13} textAnchor="middle" fill="#374151" fontSize={9} fontWeight="bold">
        Transaksjonstype
      </text>
      {slices.map((s) => (
        <path key={s.type} d={s.path} fill={s.color} stroke="#fff" strokeWidth={0.5} />
      ))}
      {slices.filter((s) => s.percentage >= 5).map((s) => {
        const lx = cx + (r * 0.65) * Math.cos(s.midAngle);
        const ly = cy + (r * 0.65) * Math.sin(s.midAngle);
        return (
          <text key={s.type} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize={8} fontWeight="bold">
            {s.percentage}%
          </text>
        );
      })}
      {slices.slice(0, 6).map((s, i) => (
        <g key={s.type} transform={`translate(${cx + r + 16}, ${20 + i * 18})`}>
          <rect width={8} height={8} fill={s.color} rx={1} />
          <text x={12} y={8} fill="#374151" fontSize={8}>{s.type}</text>
        </g>
      ))}
    </svg>
  );
}

function TransactionsChartRow({ averageTransactionSize, chartData, growth }: Props) {
  const countGrowth = formatGrowth(growth.countGrowthPct);
  const amountGrowth = formatGrowth(growth.amountGrowthPct);

  return (
    <div className="row g-3" style={{ marginBottom: '1.5rem' }}>
      <div className="col-12 col-lg-4">
        <div className="summary-card h-100" style={{ padding: '0.75rem' }}>
          <VolumeChart data={chartData.volumeByPeriod} />
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="summary-card h-100" style={{ padding: '0.75rem' }}>
          <PieChart data={chartData.byType} />
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="row g-3 h-100">
          <div className="col-12">
            <article className="summary-card h-100">
              <p className="summary-card__label" style={{ fontSize: '0.8rem' }}>Gjennomsnittlig transaksjonsstørrelse</p>
              <p className="summary-card__value" style={{ fontSize: '1.1rem' }}>{formatAmount(averageTransactionSize)}</p>
            </article>
          </div>
          <div className="col-6">
            <article className="summary-card h-100">
              <p className="summary-card__label" style={{ fontSize: '0.8rem' }}>Vekst transaksjoner</p>
              <p className="summary-card__value" style={{ fontSize: '1.1rem', color: countGrowth.color, whiteSpace: 'nowrap' }}>{countGrowth.label}</p>
            </article>
          </div>
          <div className="col-6">
            <article className="summary-card h-100">
              <p className="summary-card__label" style={{ fontSize: '0.8rem' }}>Vekst beløp</p>
              <p className="summary-card__value" style={{ fontSize: '1.1rem', color: amountGrowth.color }}>{amountGrowth.label}</p>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionsChartRow;
