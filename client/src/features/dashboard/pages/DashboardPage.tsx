import { useMemo } from 'react';
import getIncomeData, { getIncomeDateRange, getPresetRange } from '../lib/incomeCalc';
import getIncomeDataFull from '../../income/lib/getIncomeData';
import { ytdIncome, ytdIncomeLastPeriod, annualIncomeLastYear, projectedAnnualIncome, aumAtDate, MetricDelta, MetricDeltaPP } from '../../income/components/IncomeOverview';
import fundPricesJson from '../../../mocks/fundPrices.json';
import tradesJson from '../../../mocks/trades.json';
import investorsJson from '../../../mocks/investors.json';
import { getFundOverviewData } from '../../funds/lib/getFundOverviewData';
import { LineChart, ChartLegend, formatMetricValue } from '../../funds/pages/FundOverviewPage';
import { getCompliancePageData } from '../../compliance/lib/getCompliancePageData';
import { getComplianceDashboardData } from '../../compliance/lib/getComplianceDashboardData';
import { ToneTag, toneColor } from '../../compliance/components/ComplianceDashboardSection';
import { SummaryCard, StatRow } from '../../income/pages/IncomePage';

// ── Dashboard ──────────────────────────────────────────────────────────────
function DashboardPage() {
  // Inntekter: compute all 4 income KPIs (same as Income Oversikt)
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

    // Full income data for KPI calculations (uses income lib)
    const incomeDataFull = getIncomeDataFull(
      tradesJson as Parameters<typeof getIncomeDataFull>[0],
      investorsJson as Parameters<typeof getIncomeDataFull>[1],
      fundPricesJson as Parameters<typeof getIncomeDataFull>[2],
    );
    const ytd = ytdIncome(incomeDataFull);
    const ytdPrev = ytdIncomeLastPeriod(incomeDataFull);
    const projected = projectedAnnualIncome(incomeDataFull, 0.3);
    const annualPrev = annualIncomeLastYear(incomeDataFull);
    const aum = aumAtDate(
      tradesJson as Parameters<typeof aumAtDate>[0],
      fundPricesJson as Parameters<typeof aumAtDate>[1],
      new Date('2026-01-31'),
    );
    const aumPrev = aumAtDate(
      tradesJson as Parameters<typeof aumAtDate>[0],
      fundPricesJson as Parameters<typeof aumAtDate>[1],
      new Date('2025-01-31'),
    );
    const effRate = 12 * 100 * ytd / aum;
    const effRatePrev = 12 * 100 * ytdPrev / aumPrev;

    return { total: totalFee, totalFee, ytd, ytdPrev, projected, annualPrev, aum, aumPrev, effRate, effRatePrev };
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
  const missingData = complianceStats.metrics.find((m) => m.id === 'missing-required-data');
  const nextPriority = complianceStats.priorityItems[0];

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
          <SummaryCard title="Inntekter" description="Nøkkeltall fra inntektsoversikten" onClick={() => { window.location.hash = '#inntekt'; }}>
            <div style={{ padding: '0.2rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>YTD inntekter</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{formatMetricValue(incomeStats.ytd, 'currency')}</span>
              </div>
              <MetricDelta currentValue={incomeStats.ytd} initialValue={incomeStats.ytdPrev} label="Samme dato forrige år" />
            </div>
            <div style={{ padding: '0.2rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Projisert årsinntekt</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{formatMetricValue(incomeStats.projected, 'currency')}</span>
              </div>
              <MetricDelta currentValue={incomeStats.projected} initialValue={incomeStats.annualPrev} label="Endring fra forrige år" />
            </div>
            <div style={{ padding: '0.2rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>AUM</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{formatMetricValue(incomeStats.aum, 'currency')}</span>
              </div>
              <MetricDelta currentValue={incomeStats.aum} initialValue={incomeStats.aumPrev} label="Endring fra forrige år" />
            </div>
            <div style={{ padding: '0.2rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Eff. forvaltningshonorar</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>{`${new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(incomeStats.effRate)} %`}</span>
              </div>
              <MetricDeltaPP currentValue={incomeStats.effRate} initialValue={incomeStats.effRatePrev} label="Endring fra forrige år" />
            </div>
          </SummaryCard>
        </div>
        <div className="col-12 col-md-6">
          <SummaryCard title="Forvaltning" description="NAV-utvikling per fond siste 12 mnd" onClick={() => { window.location.hash = '#fondsoversikt'; }}>
            <ChartLegend series={fundOverview.navSection.series} />
            <LineChart series={fundOverview.navSection.series} mode="return" compact />
          </SummaryCard>
        </div>
      </div>

      {/* Rad 2: Tegning + Compliance + Topp 5 kunder */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <SummaryCard title="Tegning" description="Brutto og netto tegning siste 12 mnd" onClick={() => { window.location.hash = '#fondsoversikt'; }}>
            {grossBuyKpi && (
              <StatRow label={grossBuyKpi.label} value={formatMetricValue(grossBuyKpi.value, grossBuyKpi.format)} />
            )}
            {grossSellKpi && (
              <StatRow label={grossSellKpi.label} value={formatMetricValue(grossSellKpi.value, grossSellKpi.format)} />
            )}
            {netFlowKpi && (
              <StatRow label={netFlowKpi.label} value={formatMetricValue(netFlowKpi.value, netFlowKpi.format)} />
            )}
          </SummaryCard>
        </div>
        <div className="col-12 col-md-4">
          <SummaryCard title="Compliance" description="PEP-kontroll og neste aktivitet" onClick={() => { window.location.hash = '#rapporter/oversikt'; }}>
            {pepOverdue && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{pepOverdue.label}</span>
                <ToneTag tone={pepOverdue.tone} label={pepOverdue.value} />
              </div>
            )}
            {missingData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0' }}>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{missingData.label}</span>
                <ToneTag tone={missingData.tone} label={missingData.value} />
              </div>
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
          </SummaryCard>
        </div>
        <div className="col-12 col-md-4">
          <SummaryCard title="Topp 5 kunder" description="Oversikt over største kunder" onClick={() => { window.location.hash = '#kundeoversikt'; }}>
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
                  {formatMetricValue(shareholder.marketValue, 'currency')}
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
