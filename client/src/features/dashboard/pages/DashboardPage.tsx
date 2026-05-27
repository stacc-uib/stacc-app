import { useMemo } from 'react';
import getIncomeData, { getIncomeDateRange, getPresetRange } from '../lib/incomeCalc';
import getIncomeDataFull from '../../income/lib/getIncomeData';
import {
  ytdIncome,
  ytdIncomeLastPeriod,
  annualIncomeLastYear,
  projectedAnnualIncome,
  aumAtDate,
  MetricDelta,
  MetricDeltaPP,
} from '../../income/components/IncomeOverview';
import fundPricesJson from '../../../mocks/fundPrices.json';
import tradesJson from '../../../mocks/trades.json';
import investorsJson from '../../../mocks/investors.json';
import { getFundOverviewData } from '../../funds/lib/getFundOverviewData';
import { LineChart, ChartLegend, formatMetricValue } from '../../funds/pages/FundOverviewPage';
import { getCompliancePageData } from '../../compliance/lib/getCompliancePageData';
import { getComplianceDashboardData } from '../../compliance/lib/getComplianceDashboardData';
import { ToneTag, toneColor } from '../../compliance/components/ComplianceDashboardSection';

// ── Compact card primitives ────────────────────────────────────────────────
function DashCard({
  title,
  desc,
  onClick,
  children,
}: {
  title: string;
  desc: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="dashboard-card"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <p className="dashboard-card__title">{title}</p>
      <p className="dashboard-card__desc">{desc}</p>
      <div className="dashboard-card__body">{children}</div>
    </div>
  );
}

function DStat({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="dashboard-stat">
      <span className="dashboard-stat__label">{label}</span>
      <span className="dashboard-stat__value">
        {value}
        {delta && <span className="dashboard-stat__delta"> {delta}</span>}
      </span>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function DashboardPage() {
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

    const incomeDataFull = getIncomeDataFull(
      tradesJson as Parameters<typeof getIncomeDataFull>[0],
      investorsJson as Parameters<typeof getIncomeDataFull>[1],
      fundPricesJson as Parameters<typeof getIncomeDataFull>[2],
    );
    const ytd        = ytdIncome(incomeDataFull);
    const ytdPrev    = ytdIncomeLastPeriod(incomeDataFull);
    const projected  = projectedAnnualIncome(incomeDataFull, 0.3);
    const annualPrev = annualIncomeLastYear(incomeDataFull);
    const aum        = aumAtDate(
      tradesJson as Parameters<typeof aumAtDate>[0],
      fundPricesJson as Parameters<typeof aumAtDate>[1],
      new Date('2026-01-31'),
    );
    const aumPrev    = aumAtDate(
      tradesJson as Parameters<typeof aumAtDate>[0],
      fundPricesJson as Parameters<typeof aumAtDate>[1],
      new Date('2025-01-31'),
    );
    const effRate     = 12 * 100 * ytd / aum;
    const effRatePrev = 12 * 100 * ytdPrev / aumPrev;

    return { totalFee, ytd, ytdPrev, projected, annualPrev, aum, aumPrev, effRate, effRatePrev };
  }, []);

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

  const complianceStats = useMemo(() => {
    const pageData = getCompliancePageData();
    return getComplianceDashboardData(pageData);
  }, []);

  const grossBuyKpi  = fundOverview.flowSection.kpis.find((k) => k.id === 'gross-buy');
  const grossSellKpi = fundOverview.flowSection.kpis.find((k) => k.id === 'gross-sell');
  const netFlowKpi   = fundOverview.flowSection.kpis.find((k) => k.id === 'net-flow');
  const top5         = fundOverview.shareholderSection.rows.slice(0, 5);
  const pepOverdue   = complianceStats.metrics.find((m) => m.id === 'pep-overdue');
  const missingData  = complianceStats.metrics.find((m) => m.id === 'missing-required-data');
  const nextPriority = complianceStats.priorityItems[0];

  const fmt    = (v: number, f: string) => formatMetricValue(v, f as 'currency' | 'number' | 'percent');
  const fmtPct = (v: number) =>
    `${new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)} %`;

  return (
    <div className="content-card content-card--dashboard">
      <p className="content-card__eyebrow">Dashboard</p>
      <h1>Nøkkeltall</h1>

      {/* Rad 1: Inntekter · NAV-utvikling */}
      <div className="row g-2" style={{ marginBottom: '0.5rem' }}>
        <div className="col-12 col-md-5">
          <DashCard
            title="Inntekter"
            desc="Siste 12 måneder"
            onClick={() => { window.location.hash = '#inntekt'; }}
          >
            <DStat
              label="YTD inntekter"
              value={fmt(incomeStats.ytd, 'currency')}
              delta={<MetricDelta currentValue={incomeStats.ytd} initialValue={incomeStats.ytdPrev} label="vs. i fjor" />}
            />
            <DStat
              label="Projisert år"
              value={fmt(incomeStats.projected, 'currency')}
              delta={<MetricDelta currentValue={incomeStats.projected} initialValue={incomeStats.annualPrev} label="vs. i fjor" />}
            />
            <DStat
              label="AUM"
              value={fmt(incomeStats.aum, 'currency')}
              delta={<MetricDelta currentValue={incomeStats.aum} initialValue={incomeStats.aumPrev} label="vs. i fjor" />}
            />
            <DStat
              label="Eff. forvaltningshonorar"
              value={fmtPct(incomeStats.effRate)}
              delta={<MetricDeltaPP currentValue={incomeStats.effRate} initialValue={incomeStats.effRatePrev} label="vs. i fjor" />}
            />
          </DashCard>
        </div>

        <div className="col-12 col-md-7">
          <DashCard
            title="NAV-utvikling"
            desc="Per fond — siste 12 mnd"
            onClick={() => { window.location.hash = '#fondsoversikt'; }}
          >
            <ChartLegend series={fundOverview.navSection.series} />
            <LineChart series={fundOverview.navSection.series} mode="return" compact />
          </DashCard>
        </div>
      </div>

      {/* Rad 2: Tegning · Compliance · Topp 5 */}
      <div className="row g-2">
        <div className="col-12 col-md-4">
          <DashCard
            title="Tegning"
            desc="Brutto/netto — siste 12 mnd"
            onClick={() => { window.location.hash = '#fondsoversikt'; }}
          >
            {grossBuyKpi  && <DStat label={grossBuyKpi.label}  value={fmt(grossBuyKpi.value,  grossBuyKpi.format)}  />}
            {grossSellKpi && <DStat label={grossSellKpi.label} value={fmt(grossSellKpi.value, grossSellKpi.format)} />}
            {netFlowKpi   && <DStat label={netFlowKpi.label}   value={fmt(netFlowKpi.value,   netFlowKpi.format)}   />}
          </DashCard>
        </div>

        <div className="col-12 col-md-4">
          <DashCard
            title="Compliance"
            desc="PEP-kontroll og neste aktivitet"
            onClick={() => { window.location.hash = '#rapporter/oversikt'; }}
          >
            {pepOverdue && (
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">{pepOverdue.label}</span>
                <ToneTag tone={pepOverdue.tone} label={pepOverdue.value} />
              </div>
            )}
            {missingData && (
              <div className="dashboard-stat">
                <span className="dashboard-stat__label">{missingData.label}</span>
                <ToneTag tone={missingData.tone} label={missingData.value} />
              </div>
            )}
            {nextPriority && (
              <div
                style={{
                  marginTop: '0.4rem',
                  padding: '0.3rem 0.5rem',
                  background: '#f9fafb',
                  borderRadius: '0.3rem',
                  borderLeft: `3px solid ${toneColor[nextPriority.tone] ?? '#d1d5db'}`,
                }}
              >
                <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 600, color: '#374151' }}>
                  {nextPriority.title}
                </p>
                <p style={{ margin: 0, fontSize: '0.68rem', color: '#6b7280' }}>
                  {nextPriority.summary}
                </p>
              </div>
            )}
          </DashCard>
        </div>

        <div className="col-12 col-md-4">
          <DashCard
            title="Topp 5 kunder"
            desc="Etter markedsverdi"
            onClick={() => { window.location.hash = '#kundeoversikt'; }}
          >
            {top5.map((s, i) => (
              <div key={s.customerId} className="dashboard-stat">
                <span className="dashboard-stat__label" style={{ display: 'flex', gap: '0.35rem' }}>
                  <span style={{ color: '#d1d5db', minWidth: '0.9rem' }}>{i + 1}.</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.investorName}
                  </span>
                </span>
                <span className="dashboard-stat__value">{fmt(s.marketValue, 'currency')}</span>
              </div>
            ))}
          </DashCard>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
