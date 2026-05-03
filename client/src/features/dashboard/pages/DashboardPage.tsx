import { useMemo, type ReactNode } from 'react';
import getIncomeData, { getIncomeDateRange, getPresetRange } from '../lib/incomeCalc';
import fundPricesJson from '../../../mocks/fundPrices.json';
import tradesJson from '../../../mocks/trades.json';
import { getFundOverviewData } from '../../funds/lib/getFundOverviewData';
import { getCompliancePageData } from '../../compliance/lib/getCompliancePageData';
import { getComplianceDashboardData } from '../../compliance/lib/getComplianceDashboardData';
import type { FundOverviewMetricFormat } from '../../funds/types/funds';

// ── Formatting helpers (mirrors FundOverviewPage conventions) ──────────────
const fmtCurrency = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  maximumFractionDigits: 0,
});
const fmtPercent = new Intl.NumberFormat('nb-NO', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const fmtNav = new Intl.NumberFormat('nb-NO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtInt = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });

function fmtMetric(value: number, format: FundOverviewMetricFormat): string {
  if (format === 'currency') return fmtCurrency.format(value);
  if (format === 'percent') return fmtPercent.format(value);
  if (format === 'nav') return fmtNav.format(value);
  return fmtInt.format(value);
}

const toneColor: Record<string, string> = {
  critical: '#dc2626',
  warning: '#d97706',
  ok: '#16a34a',
  neutral: '#6b7280',
};

// ── Shared sub-components ──────────────────────────────────────────────────
function SummaryCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article
      className="summary-card h-100"
      style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
    >
      <p className="summary-card__label" style={{ fontWeight: 700, color: '#374151', fontSize: '0.9rem', marginBottom: 0 }}>
        {title}
      </p>
      <p style={{ color: '#9ca3af', fontSize: '0.82rem', margin: 0 }}>{description}</p>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem', paddingTop: '0.25rem' }}>
        {children}
      </div>
    </article>
  );
}

function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', padding: '0.2rem 0' }}>
      <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827', textAlign: 'right' }}>
        {value}
        {sub && (
          <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#9ca3af', marginLeft: '0.3rem' }}>
            {sub}
          </span>
        )}
      </span>
    </div>
  );
}

// ── Mini NAV line chart (mirrors NavChart in FundOverviewPage) ─────────────
type MiniNavSeries = { id: string; label: string; color: string; points: { date: string; label: string; value: number }[] };

function buildLinePath(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

function MiniNavChart({ series }: { series: MiniNavSeries[] }) {
  const displaySeries = series.filter((s) => s.points.length > 0);
  if (displaySeries.length === 0) return null;

  const W = 560, H = 160;
  const pad = { top: 12, right: 8, bottom: 24, left: 8 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top - pad.bottom;
  const ptCount = displaySeries[0].points.length;
  const step = ptCount > 1 ? cw / (ptCount - 1) : cw;

  const allVals = displaySeries.flatMap((s) => s.points.map((p) => p.value));
  const vMin = Math.min(...allVals);
  const vMax = Math.max(...allVals);
  const vRange = vMax - vMin || Math.max(vMax * 0.08, 1);
  const dMin = Math.max(0, vMin - vRange * 0.12);
  const dMax = vMax + vRange * 0.12;
  const dRange = dMax - dMin || 1;

  const toY = (v: number) => pad.top + ch - ((v - dMin) / dRange) * ch;
  const toX = (i: number) => pad.left + (ptCount === 1 ? cw / 2 : step * i);

  const coordsBySeries = displaySeries.map((s) => ({
    ...s,
    coords: s.points.map((p, i) => ({ x: toX(i), y: toY(p.value) })),
  }));

  // x-axis ticks: first, middle, last
  const tickIdxs = ptCount <= 3
    ? Array.from({ length: ptCount }, (_, i) => i)
    : [0, Math.round((ptCount - 1) / 2), ptCount - 1];

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
        {displaySeries.map((s) => (
          <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#374151' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, display: 'inline-block', flexShrink: 0 }} />
            {s.label}
          </span>
        ))}
      </div>
      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        {/* Grid lines */}
        {[dMax, dMin + dRange / 2, dMin].map((v) => (
          <line key={v} x1={pad.left} y1={toY(v)} x2={W - pad.right} y2={toY(v)}
            stroke="rgba(17,24,39,0.08)" strokeDasharray="4 6" />
        ))}
        {/* Lines */}
        {coordsBySeries.map((s) => (
          <path key={s.id} d={buildLinePath(s.coords)}
            fill="none" stroke={s.color} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {/* X-axis labels */}
        {tickIdxs.map((i) => (
          <text key={i} x={toX(i)} y={H - 4} fontSize={9} fill="#9ca3af"
            textAnchor={i === 0 ? 'start' : i === ptCount - 1 ? 'end' : 'middle'}>
            {displaySeries[0].points[i].label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function ToneTag({ tone, label }: { tone?: string; label: string }) {
  const color = tone ? toneColor[tone] : '#6b7280';
  return (
    <span
      style={{
        fontSize: '0.72rem',
        padding: '0.15rem 0.45rem',
        borderRadius: '0.25rem',
        background: `${color}20`,
        color,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function DashboardPage() {
  // Inntekter: sum management fees for the last 12 months
  const incomeStats = useMemo(() => {
    const incomeData = getIncomeData(
      tradesJson as Parameters<typeof getIncomeData>[0],
      fundPricesJson as Parameters<typeof getIncomeData>[1],
    );
    const { from: minDate, to: maxDate } = getIncomeDateRange(incomeData);
    const range12m = getPresetRange('1y', maxDate, minDate);
    const events12m = incomeData.events.filter(
      (e) => e.date >= range12m.from && e.date <= range12m.to,
    );
    const totalFee = events12m
      .filter((e) => e.incomeType === 'management fee')
      .reduce((acc, e) => acc + e.amount, 0);
    return { total: totalFee, totalFee };
  }, []);

  // Forvaltning + Tegning + Topp 5: reuse fund overview for 12m period, nav grouped per fund
  const fundOverview = useMemo(
    () =>
      getFundOverviewData({
        fundId: 'all',
        classId: 'all',
        periodId: '12m',
        navGrouping: 'fund',
        flowGrouping: 'combined',
      }),
    [],
  );

  // Compliance: PEP status + priority queue
  const complianceStats = useMemo(() => {
    const pageData = getCompliancePageData();
    return getComplianceDashboardData(pageData);
  }, []);

  // Derived metric lookups
  const grossBuyKpi = fundOverview.flowSection.kpis.find((k) => k.id === 'gross-buy');
  const grossSellKpi = fundOverview.flowSection.kpis.find((k) => k.id === 'gross-sell');
  const netFlowKpi = fundOverview.flowSection.kpis.find((k) => k.id === 'net-flow');
  const top5 = fundOverview.shareholderSection.rows.slice(0, 5);
  const pepOverdue = complianceStats.metrics.find((m) => m.id === 'pep-overdue');
  const pepDueSoon = complianceStats.metrics.find((m) => m.id === 'pep-due-soon');
  const missingData = complianceStats.metrics.find((m) => m.id === 'missing-required-data');
  const reportingReady = complianceStats.metrics.find((m) => m.id === 'reporting-ready');
  const nextPriority = complianceStats.priorityItems[0];

  // Compliance health: red if any critical, yellow if any warning, green otherwise
  const hasCritical = complianceStats.metrics.some((m) => m.tone === 'critical');
  const hasWarning = complianceStats.metrics.some((m) => m.tone === 'warning');
  const complianceHealth = hasCritical ? 'critical' : hasWarning ? 'warning' : 'ok';
  const complianceHealthLabel = hasCritical ? 'Krever handling' : hasWarning ? 'Avvik' : 'Alt i orden';
  const complianceHealthColor = toneColor[complianceHealth];

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Dashboard</p>
      <h1>Dashboard</h1>
      <p className="content-card__description">
        Nøkkeltall og aktivitet siste 12 måneder.
      </p>

      {/* Rad 1: Inntekter + Forvaltning */}
      <div className="row g-3" style={{ marginBottom: '1rem' }}>
        <div className="col-12 col-md-6">
          <SummaryCard title="Inntekter" description="Forvaltningshonorar siste 12 mnd">
            <StatRow label="Forvaltningshonorar" value={fmtCurrency.format(incomeStats.totalFee)} />
          </SummaryCard>
        </div>
        <div className="col-12 col-md-6">
          <SummaryCard title="Forvaltning" description="NAV-utvikling per fond siste 12 mnd">
            <MiniNavChart series={fundOverview.navSection.series} />
          </SummaryCard>
        </div>
      </div>

      {/* Rad 2: Tegning + Compliance + Topp 5 kunder */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <SummaryCard title="Tegning" description="Brutto og netto tegning siste 12 mnd">
            {grossBuyKpi && (
              <StatRow label={grossBuyKpi.label} value={fmtMetric(grossBuyKpi.value, grossBuyKpi.format)} />
            )}
            {grossSellKpi && (
              <StatRow label={grossSellKpi.label} value={fmtMetric(grossSellKpi.value, grossSellKpi.format)} />
            )}
            {netFlowKpi && (
              <StatRow label={netFlowKpi.label} value={fmtMetric(netFlowKpi.value, netFlowKpi.format)} />
            )}
          </SummaryCard>
        </div>
        <div className="col-12 col-md-4">
          <SummaryCard title="Compliance" description="Samlet status og neste oppgave">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0', marginBottom: '0.25rem' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: complianceHealthColor, flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: complianceHealthColor }}>{complianceHealthLabel}</span>
            </div>
            {pepOverdue && (
              <StatRow label={pepOverdue.label} value={pepOverdue.value} />
            )}
            {pepDueSoon && Number(pepDueSoon.value) > 0 && (
              <StatRow label={pepDueSoon.label} value={pepDueSoon.value} />
            )}
            {missingData && (
              <StatRow label={missingData.label} value={missingData.value} />
            )}
            {reportingReady && (
              <StatRow label={reportingReady.label} value={reportingReady.value} />
            )}
            {nextPriority && (
              <div
                style={{
                  marginTop: '0.35rem',
                  padding: '0.3rem 0.5rem',
                  background: '#f9fafb',
                  borderRadius: '0.3rem',
                  borderLeft: `3px solid ${toneColor[nextPriority.tone] ?? '#d1d5db'}`,
                }}
              >
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#374151' }}>
                  {nextPriority.title}
                </p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#6b7280' }}>
                  {nextPriority.summary}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => { window.location.hash = '#rapporter/oversikt'; }}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#111827',
                cursor: 'pointer',
                opacity: 0.7,
              }}
            >
              Åpne arbeidskø →
            </button>
          </SummaryCard>
        </div>
        <div className="col-12 col-md-4">
          <SummaryCard title="Topp 5 kunder" description="Oversikt over største kunder">
            {top5.map((shareholder, idx) => (
              <div
                key={shareholder.customerId}
                style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', padding: '0.15rem 0' }}
              >
                <span style={{ fontSize: '0.7rem', color: '#9ca3af', minWidth: '1rem' }}>{idx + 1}.</span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: '#374151',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {shareholder.investorName}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                  {fmtCurrency.format(shareholder.marketValue)}
                </span>
              </div>
            ))}
          </SummaryCard>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
