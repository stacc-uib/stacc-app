import { useEffect, useMemo, useState } from 'react';
import fundPricesData from '../../../mocks/fundPrices.json';
import investorsData from '../../../mocks/investors.json';
import tradesData from '../../../mocks/trades.json';
import MultiSelectFilter from '../../../shared/components/MultiSelectFilter';
import { getCustomerComplianceData } from '../../../shared/lib/getCustomerComplianceData';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import { useTradesContext } from '../../trades/TradesContext';

import '../components/customerDetail.css';

type FundType = 'Norden' | 'Global' | 'Kreditt';

type TradeRecord = {
  id: string;
  customerId: string;
  fundName: string;
  shareClass: string;
  tradeDate: string;
  transactionType: string;
  units: number;
  price: number;
  amount: number;
  unitEffect: number;
};

type InvestorRecord = {
  customerId: string;
  name: string;
  customerType: string;
  category: string;
  phone: string | null;
  email: string | null;
};

type FundPriceRecord = {
  fundName: string;
  date: string;
  classA: number;
  classB: number;
  classC: number;
};

const latestPriceByFund = new Map<string, { classA: number; classB: number; classC: number }>();
const latestDateByFund = new Map<string, string>();
for (const record of fundPricesData as FundPriceRecord[]) {
  const prev = latestDateByFund.get(record.fundName);
  if (!prev || record.date > prev) {
    latestDateByFund.set(record.fundName, record.date);
    latestPriceByFund.set(record.fundName, {
      classA: record.classA,
      classB: record.classB,
      classC: record.classC,
    });
  }
}

function getShareClassPriceKey(shareClass: string): 'classA' | 'classB' | 'classC' {
  if (shareClass.includes('Klasse B')) return 'classB';
  if (shareClass.includes('Klasse C')) return 'classC';
  return 'classA';
}

function getFundType(fundName: string): FundType {
  if (fundName.includes('Norden')) return 'Norden';
  if (fundName.includes('Kreditt')) return 'Kreditt';
  return 'Global';
}

// ---- SVG Pie Chart ----
const FUND_COLORS: Record<FundType, string> = {
  Global: '#f5c518',
  Norden: '#f07800',
  Kreditt: '#1a1a1a',
};

type Slice = { type: FundType; value: number; pct: number };

function PieChart({ slices }: { slices: Slice[] }) {
  const R = 80;
  const CX = 110;
  const CY = 110;
  const total = slices.reduce((s, x) => s + x.value, 0);

  if (total === 0) return <p className="cd-pie-empty">Ingen data</p>;

  if (slices.length === 1) {
    return (
      <div className="cd-pie-container">
        <svg viewBox="0 0 220 220" className="cd-pie-svg" aria-label="Fondfordeling">
          <circle cx={CX} cy={CY} r={R} fill={FUND_COLORS[slices[0].type]} />
        </svg>
        <PieLegend slices={slices} />
      </div>
    );
  }

  let cumAngle = -Math.PI / 2;
  const paths = slices.map((sl) => {
    const angle = (sl.value / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(cumAngle);
    const y1 = CY + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = CX + R * Math.cos(cumAngle);
    const y2 = CY + R * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return {
      d: `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: FUND_COLORS[sl.type],
      type: sl.type,
    };
  });

  return (
    <div className="cd-pie-container">
      <svg viewBox="0 0 220 220" className="cd-pie-svg" aria-label="Fondfordeling">
        {paths.map((p) => (
          <path key={p.type} d={p.d} fill={p.color} stroke="#fff" strokeWidth="2" />
        ))}
      </svg>
      <PieLegend slices={slices} />
    </div>
  );
}

function PieLegend({ slices }: { slices: Slice[] }) {
  return (
    <ul className="cd-pie-legend">
      {slices.map((sl) => (
        <li key={sl.type} className="cd-pie-legend-item">
          <span className="cd-pie-dot" style={{ background: FUND_COLORS[sl.type] }} />
          <span className="cd-pie-legend-label">{sl.type}</span>
          <span className="cd-pie-legend-pct">{sl.pct.toFixed(1)}%</span>
          <span className="cd-pie-legend-amount">
            {sl.value.toLocaleString('nb-NO', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}{' '}
            kr
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---- Mock contact generators ----
function mockEmail(name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
  const parts = normalized.split(/\s+/);
  const local = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
  return `${local}@outlook.com`;
}

function mockPhone(customerId: string): string {
  const digits = customerId.replace(/\D/g, '').padEnd(7, '0').slice(0, 7);
  return `+47 ${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)}`;
}

// ---- Compliance badge helper ----
function getComplianceBadgeClass(status: string): string {
  switch (status) {
    case 'pep-forfalt':
    case 'ikke-profesjonell':
      return 'status-badge status-badge--critical';
    case 'mangler-naering':
    case 'pep-forfaller-snart':
      return 'status-badge status-badge--warning';
    default:
      return 'status-badge status-badge--ok';
  }
}

// ---- Main component ----
function CustomerDetailPage({ customerId }: { customerId: string }) {
  const investor = (investorsData as InvestorRecord[]).find(
    (inv) => inv.customerId === customerId,
  );

  const { registeredTrades } = useTradesContext();

  const trades = useMemo(
    () =>
      [
        ...(registeredTrades
          .filter((t) => t.customerId === customerId)
          .map((t) => ({
            id: t.id,
            customerId: t.customerId,
            fundName: t.fundName,
            shareClass: t.shareClass,
            tradeDate: t.tradeDate,
            transactionType: t.transactionType,
            units: t.units,
            price: t.price,
            amount: t.amount,
            unitEffect: t.unitEffect,
            settlementStatus: t.settlementStatus,
          }))),
        ...(tradesData as TradeRecord[]).filter((t) => t.customerId === customerId),
      ].sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()),
    [customerId, registeredTrades],
  );

  // Only settled trades affect holdings; static mock trades are assumed oppgjort
  const settledTrades = useMemo(
    () => trades.filter((t) => !('settlementStatus' in t) || (t as { settlementStatus?: string }).settlementStatus === 'oppgjort'),
    [trades],
  );

  const allFundOptions = useMemo(() => {
    const funds = new Set(trades.map((t) => t.fundName));
    return Array.from(funds).sort();
  }, [trades]);

  const allTypeOptions = useMemo(() => {
    const types = new Set(trades.map((t) => t.transactionType));
    return Array.from(types).sort();
  }, [trades]);

  const allYearOptions = useMemo(() => {
    const years = new Set(trades.map((t) => String(new Date(t.tradeDate).getFullYear())));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [trades]);

  const PAGE_SIZE = 10;

  const tradeKpi = useMemo(() => {
    const financialTrades = trades.filter(
      (t) => t.transactionType !== 'Telefon' && t.transactionType !== 'Epost',
    );
    const kjop = financialTrades.filter((t) => t.transactionType === 'Kjøp').length;
    const salg = financialTrades.filter((t) => t.transactionType === 'Salg').length;
    const totalAmount = financialTrades.reduce((sum, t) => sum + t.units * t.price, 0);
    const avgAmount = financialTrades.length > 0 ? totalAmount / financialTrades.length : 0;
    return { kjop, salg, avgAmount };
  }, [trades]);

  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setSelectedFunds([...allFundOptions]);
  }, [allFundOptions]);
  useEffect(() => {
    setSelectedTypes([...allTypeOptions]);
  }, [allTypeOptions]);
  useEffect(() => {
    setSelectedYears([...allYearOptions]);
  }, [allYearOptions]);

  const visibleTrades = useMemo(() => {
    setPage(0);
    const activeFunds = selectedFunds.length === 0 ? allFundOptions : selectedFunds;
    const activeTypes = selectedTypes.length === 0 ? allTypeOptions : selectedTypes;
    const activeYears = selectedYears.length === 0 ? allYearOptions : selectedYears;
    return trades.filter(
      (t) =>
        activeFunds.includes(t.fundName) &&
        activeTypes.includes(t.transactionType) &&
        activeYears.includes(String(new Date(t.tradeDate).getFullYear())),
    );
  }, [trades, selectedFunds, selectedTypes, selectedYears, allFundOptions, allTypeOptions, allYearOptions]);

  const fundHoldings = useMemo(() => {
    // Accumulate units per instrument (shareClass), then value by latest NAV price
    // Only settled trades count toward holdings
    const instrumentUnits = new Map<string, { fundType: FundType; fundName: string; priceKey: 'classA' | 'classB' | 'classC'; units: number }>();
    settledTrades.forEach((t) => {
      const key = t.shareClass;
      const existing = instrumentUnits.get(key);
      if (existing) {
        existing.units += t.unitEffect;
      } else {
        instrumentUnits.set(key, {
          fundType: getFundType(t.fundName),
          fundName: t.fundName,
          priceKey: getShareClassPriceKey(t.shareClass),
          units: t.unitEffect,
        });
      }
    });

    const map = new Map<FundType, number>();
    for (const instrument of instrumentUnits.values()) {
      const prices = latestPriceByFund.get(instrument.fundName);
      const price = prices ? prices[instrument.priceKey] : 0;
      const value = Math.max(0, instrument.units) * price;
      if (value > 0) {
        map.set(instrument.fundType, (map.get(instrument.fundType) ?? 0) + value);
      }
    }

    const filtered = Array.from(map.entries()).filter(([, v]) => v > 0);
    const total = filtered.reduce((s, [, v]) => s + v, 0);
    return filtered.map(([type, value]) => ({
      type,
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
    }));
  }, [settledTrades]);

  const totalBeholdning = fundHoldings.reduce((s, f) => s + f.value, 0);

  const complianceData = useMemo(
    () => getCustomerComplianceData(customerId),
    [customerId],
  );

  const klasse = useMemo(() => {
    if (!investor) return 'Klasse A';
    if (investor.customerType === 'Ansatt') return 'Klasse A';
    if (fundHoldings.length === 0) return 'Klasse A';
    const fundClasses = fundHoldings.map((f) => (f.value >= 1_000_000 ? 'Klasse B' : 'Klasse C'));
    if (fundClasses.some((c) => c === 'Klasse C')) return 'Klasse C';
    if (fundClasses.every((c) => c === 'Klasse B')) return 'Klasse B';
    return 'Klasse A';
  }, [investor, fundHoldings]);

  function goBack() {
    window.location.hash = '#kundeoversikt';
  }

  if (!investor) {
    return (
      <div className="cd-not-found">
        <button className="cd-back-btn" onClick={goBack}>
          ← Tilbake
        </button>
        <p>Kunde ikke funnet.</p>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <button className="cd-back-btn" onClick={goBack}>
        ← Tilbake til kunder
      </button>

      <div className="cd-layout">
        {/* Left column */}
        <div className="cd-left">
          <div className="cd-card">
            <h2 className="cd-card-title">{investor.name}</h2>
            <dl className="cd-info-list">
              <div className="cd-info-row">
                <dt>KundeID</dt>
                <dd>{investor.customerId}</dd>
              </div>
              <div className="cd-info-row">
                <dt>Kundetype</dt>
                <dd>{investor.customerType}</dd>
              </div>
              <div className="cd-info-row">
                <dt>Kundegruppe</dt>
                <dd>{klasse}</dd>
              </div>
              <div className="cd-info-row">
                <dt>Total beholdning</dt>
                <dd>{formatCurrency(totalBeholdning)} kr</dd>
              </div>
              <div className="cd-info-row">
                <dt>Telefon</dt>
                <dd>{investor.phone ?? mockPhone(investor.customerId)}</dd>
              </div>
              <div className="cd-info-row">
                <dt>Epost</dt>
                <dd>{investor.email ?? mockEmail(investor.name)}</dd>
              </div>
            </dl>
          </div>

          <div className="cd-card">
            <h3 className="cd-section-title">Fondsfordeling</h3>
            <PieChart slices={fundHoldings} />
          </div>

          <div className="cd-card">
            <h3 className="cd-card-title">Compliance</h3>
            {complianceData ? (
              <>
                <dl className="cd-info-list">
                  <div className="cd-info-row">
                    <dt>PEP-status</dt>
                    <dd>{complianceData.pepStatus}</dd>
                  </div>
                  <div className="cd-info-row">
                    <dt>AML-risikonivå</dt>
                    <dd>{complianceData.amlRiskLevel}</dd>
                  </div>
                  <div className="cd-info-row">
                    <dt>Klassifisering</dt>
                    <dd>
                      <span className={getComplianceBadgeClass(complianceData.classificationStatus)}>
                        {complianceData.classificationLabel}
                      </span>
                    </dd>
                  </div>
                  <div className="cd-info-row">
                    <dt>Dokumentasjon</dt>
                    <dd>{complianceData.documentationStatus}</dd>
                  </div>
                  <div className="cd-info-row">
                    <dt>Neste PEP-gjennomgang</dt>
                    <dd>{complianceData.nextPepReviewLabel}</dd>
                  </div>
                </dl>
                <button
                  className="cd-back-btn"
                  style={{ marginTop: '1rem', marginBottom: 0 }}
                  onClick={() => { window.location.hash = '#rapporter/investorer'; }}
                >
                  Se compliance-detaljer →
                </button>
              </>
            ) : (
              <p className="cd-empty">Ingen compliancedata tilgjengelig</p>
            )}
          </div>
        </div>

        {/* Right column — activity */}
        <div className="cd-right">
          <div className="cd-kpi-row">
            <article className="summary-card">
              <p className="summary-card__label">Antall kjøp</p>
              <p className="summary-card__value">{tradeKpi.kjop}</p>
            </article>
            <article className="summary-card">
              <p className="summary-card__label">Antall salg</p>
              <p className="summary-card__value">{tradeKpi.salg}</p>
            </article>
            <article className="summary-card">
              <p className="summary-card__label">Gjennomsnittlig transaksjonsbeløp</p>
              <p className="summary-card__value">{formatCurrency(tradeKpi.avgAmount)} kr</p>
            </article>
          </div>
          <div className="cd-card cd-card--full">
            <div className="cd-section-header">
              <h3 className="cd-section-title">Aktivitet</h3>
              <span className="cd-page-size-label" style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                {visibleTrades.length === 0
                  ? 'Ingen treff'
                  : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, visibleTrades.length)} av ${visibleTrades.length}`}
              </span>
            </div>
            {trades.length === 0 ? (
              <p className="cd-empty">Ingen aktivitet registrert.</p>
            ) : (
              <table className="cd-table">
                <thead>
                  <tr>
                    <th style={{ color: '#9ca3af', fontSize: '0.75rem' }}>ID</th>
                    <th className="th-fondstyper">
                      <MultiSelectFilter
                        label="Dato"
                        options={allYearOptions}
                        selected={selectedYears}
                        onChange={setSelectedYears}
                        ariaLabel="Filtrer år"
                      />
                    </th>
                    <th className="th-fondstyper">
                      <MultiSelectFilter
                        label="Type"
                        options={allTypeOptions}
                        selected={selectedTypes}
                        onChange={setSelectedTypes}
                        ariaLabel="Filtrer type"
                      />
                    </th>
                    <th className="th-fondstyper">
                      <MultiSelectFilter
                        label="Fond"
                        options={allFundOptions}
                        selected={selectedFunds}
                        onChange={setSelectedFunds}
                        ariaLabel="Filtrer fond"
                      />
                    </th>
                    <th className="td-right">Antall</th>
                    <th className="td-right">Kurs</th>
                    <th className="td-right">Beløp</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTrades.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(
                    (t) => {
                      const isFinancial =
                        t.transactionType !== 'Telefon' && t.transactionType !== 'Epost';
                      const beløp = isFinancial ? t.units * t.price : null;
                      return (
                        <tr key={t.id}>
                          <td style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{t.id.replace('trade-', '').split('-')[0]}</td>
                          <td>{formatDate(t.tradeDate)}</td>
                          <td>
                            <span
                              className={`cd-badge cd-badge--${t.transactionType === 'Kjøp' ? 'buy' : 'sell'}`}
                            >
                              {t.transactionType}
                            </span>
                          </td>
                          <td>{isFinancial ? t.fundName : '—'}</td>
                          <td className="td-right">
                            {isFinancial
                              ? t.units.toLocaleString('nb-NO', { maximumFractionDigits: 4 })
                              : '—'}
                          </td>
                          <td className="td-right">
                            {isFinancial ? formatCurrency(t.price) : '—'}
                          </td>
                          <td className="td-right">
                            {beløp !== null ? formatCurrency(beløp) : '—'}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={7} className="cd-table-footer" />
                  </tr>
                </tfoot>
              </table>
            )}
            {Math.ceil(visibleTrades.length / PAGE_SIZE) > 1 && (
              <div className="queue-filter-row" style={{ padding: '1rem 0 0', justifyContent: 'center' }}>
                <button type="button" className="queue-filter" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
                  Forrige
                </button>
                <span style={{ padding: '0 0.5rem', color: '#6b7280', fontSize: '0.9rem', alignSelf: 'center' }}>
                  Side {page + 1} av {Math.ceil(visibleTrades.length / PAGE_SIZE)}
                </span>
                <button type="button" className="queue-filter" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(visibleTrades.length / PAGE_SIZE) - 1}>
                  Neste
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetailPage;
