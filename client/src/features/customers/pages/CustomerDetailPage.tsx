import React, { useEffect, useMemo, useState } from 'react';
import investorsData from '../../../mocks/investors.json';
import tradesData from '../../../mocks/trades.json';
import CustomerDetailFundFilter from '../components/CustomerDetailFundFilter';
import CustomerDetailTypeFilter from '../components/CustomerDetailTypeFilter';
import CustomerDetailYearFilter from '../components/CustomerDetailYearFilter';
import ActivityPageSizeSelector, { PageSize } from '../components/ActivityPageSizeSelector';
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

function getFundType(fundName: string): FundType {
  if (fundName.includes('Norden')) return 'Norden';
  if (fundName.includes('Kreditt')) return 'Kreditt';
  return 'Global';
}

function formatCurrency(n: number) {
  return n.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('nb-NO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ---- SVG Pie Chart ----
const FUND_COLORS: Record<FundType, string> = {
  Global: '#f5c518',
  Norden: '#e03131',
  Kreditt: '#1a1a1a',
};

type Slice = { type: FundType; value: number; pct: number };

function PieChart({ slices }: { slices: Slice[] }) {
  const R = 80;
  const CX = 110;
  const CY = 110;
  const total = slices.reduce((s, x) => s + x.value, 0);

  if (total === 0) return <p className="cd-pie-empty">Ingen data</p>;

  // Single slice: draw a full circle instead of an arc (arc with identical start/end is invisible)
  if (slices.length === 1) {
    return (
      <div className="cd-pie-container">
        <svg viewBox="0 0 220 220" className="cd-pie-svg" aria-label="Fondfordeling">
          <circle cx={CX} cy={CY} r={R} fill={FUND_COLORS[slices[0].type]} />
        </svg>
        <ul className="cd-pie-legend">
          {slices.map((sl) => (
            <li key={sl.type} className="cd-pie-legend-item">
              <span className="cd-pie-dot" style={{ background: FUND_COLORS[sl.type] }} />
              <span className="cd-pie-legend-label">{sl.type}</span>
              <span className="cd-pie-legend-pct">{sl.pct.toFixed(1)}%</span>
              <span className="cd-pie-legend-amount">{sl.value.toLocaleString('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kr</span>
            </li>
          ))}
        </ul>
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
      pct: sl.pct,
    };
  });

  return (
    <div className="cd-pie-container">
      <svg viewBox="0 0 220 220" className="cd-pie-svg" aria-label="Fondfordeling">
        {paths.map((p) => (
          <path key={p.type} d={p.d} fill={p.color} stroke="#fff" strokeWidth="2" />
        ))}
      </svg>
      <ul className="cd-pie-legend">
        {slices.map((sl) => (
          <li key={sl.type} className="cd-pie-legend-item">
            <span className="cd-pie-dot" style={{ background: FUND_COLORS[sl.type] }} />
            <span className="cd-pie-legend-label">{sl.type}</span>
            <span className="cd-pie-legend-pct">{sl.pct.toFixed(1)}%</span>
            <span className="cd-pie-legend-amount">{sl.value.toLocaleString('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} kr</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Main component ----
function CustomerDetailPage({ customerId }: { customerId: string }) {
  const investor = (investorsData as InvestorRecord[]).find(
    (inv) => inv.customerId === customerId
  );

  const trades = useMemo(
    () =>
      (tradesData as TradeRecord[])
        .filter((t) => t.customerId === customerId)
        .sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()),
    [customerId]
  );

  const allFundOptions = useMemo(() => {
    const funds = new Set(trades.map(t => t.fundName));
    return Array.from(funds).sort();
  }, [trades]);

  const allTypeOptions = useMemo(() => {
    const types = new Set(trades.map(t => t.transactionType));
    return Array.from(types).sort();
  }, [trades]);

  const allYearOptions = useMemo(() => {
    const years = new Set(trades.map(t => String(new Date(t.tradeDate).getFullYear())));
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [trades]);

  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>(10);

  useEffect(() => { setSelectedFunds([...allFundOptions]); }, [allFundOptions]);
  useEffect(() => { setSelectedTypes([...allTypeOptions]); }, [allTypeOptions]);
  useEffect(() => { setSelectedYears([...allYearOptions]); }, [allYearOptions]);

  const visibleTrades = useMemo(() => {
    const activeFunds = selectedFunds.length === 0 ? allFundOptions : selectedFunds;
    const activeTypes = selectedTypes.length === 0 ? allTypeOptions : selectedTypes;
    const activeYears = selectedYears.length === 0 ? allYearOptions : selectedYears;
    return trades.filter(t =>
      activeFunds.includes(t.fundName) &&
      activeTypes.includes(t.transactionType) &&
      activeYears.includes(String(new Date(t.tradeDate).getFullYear()))
    );
  }, [trades, selectedFunds, selectedTypes, selectedYears, allFundOptions, allTypeOptions, allYearOptions]);

  const fundHoldings = useMemo(() => {
    const map = new Map<FundType, number>();
    trades.forEach((t) => {
      const ft = getFundType(t.fundName);
      const isSalg = t.transactionType.toLowerCase() === 'salg';
      const value = isSalg ? -t.amount : t.amount;
      map.set(ft, (map.get(ft) ?? 0) + value);
    });
    const filtered = Array.from(map.entries()).filter(([, v]) => v > 0);
    const total = filtered.reduce((s, [, v]) => s + v, 0);
    return filtered.map(([type, value]) => ({ type, value, pct: total > 0 ? (value / total) * 100 : 0 }));
  }, [trades]);

  const totalBeholdning = fundHoldings.reduce((s, f) => s + f.value, 0);

  const klasse = useMemo(() => {
    if (trades.length === 0) return 'Klasse A';
    const latest = trades[0];
    if (latest.shareClass.includes('Klasse B')) return 'Klasse B';
    if (latest.shareClass.includes('Klasse C')) return 'Klasse C';
    return 'Klasse A';
  }, [trades]);

  function goBack() {
    window.location.hash = '#kundeoversikt';
  }

  if (!investor) {
    return (
      <div className="cd-not-found">
        <button className="cd-back-btn" onClick={goBack}>← Tilbake</button>
        <p>Kunde ikke funnet.</p>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <button className="cd-back-btn" onClick={goBack}>← Tilbake til kunder</button>

      <div className="cd-layout">
        {/* Left column */}
        <div className="cd-left">
          {/* Info card */}
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
                <dd>{investor.phone ?? '—'}</dd>
              </div>
              <div className="cd-info-row">
                <dt>Epost</dt>
                <dd>{investor.email ?? '—'}</dd>
              </div>
              <div className="cd-info-row">
                <dt>PEP-status</dt>
                <dd>Ikke PEP</dd>
              </div>
            </dl>
          </div>

          {/* Pie chart card */}
          <div className="cd-card">
            <h3 className="cd-section-title">Fondsfordeling</h3>
            <PieChart slices={fundHoldings} />
          </div>
        </div>

        {/* Right column — activity */}
        <div className="cd-right">
          <div className="cd-card cd-card--full">
            <div className="cd-section-header">
              <h3 className="cd-section-title">Aktivitet</h3>
              <ActivityPageSizeSelector
                value={pageSize}
                onChange={setPageSize}
                totalCount={visibleTrades.length}
              />
            </div>
            {trades.length === 0 ? (
              <p className="cd-empty">Ingen aktivitet registrert.</p>
            ) : (
              <table className="cd-table">
                <thead>
                  <tr>
                    <th className="th-fondstyper">
                      <CustomerDetailYearFilter
                        options={allYearOptions}
                        selected={selectedYears}
                        onChange={setSelectedYears}
                      />
                    </th>
                    <th className="th-fondstyper">
                      <CustomerDetailTypeFilter
                        options={allTypeOptions}
                        selected={selectedTypes}
                        onChange={setSelectedTypes}
                      />
                    </th>
                    <th className="th-fondstyper">
                      <CustomerDetailFundFilter
                        options={allFundOptions}
                        selected={selectedFunds}
                        onChange={setSelectedFunds}
                      />
                    </th>
                    <th className="td-right">Antall</th>
                    <th className="td-right">Kurs</th>
                    <th className="td-right">Beløp</th>
                  </tr>
                </thead>
                <tbody>
                  {(pageSize === 'all' ? visibleTrades : visibleTrades.slice(0, pageSize)).map((t) => {
                    const isFinancial = t.transactionType !== 'Telefon' && t.transactionType !== 'Epost';
                    const beløp = isFinancial ? t.units * t.price : null;
                    return (
                    <tr key={t.id}>
                      <td>{formatDate(t.tradeDate)}</td>
                      <td>
                        <span className={`cd-badge cd-badge--${t.transactionType === 'Kjøp' ? 'buy' : 'sell'}`}>
                          {t.transactionType}
                        </span>
                      </td>
                      <td>{isFinancial ? t.fundName : '—'}</td>
                      <td className="td-right">{isFinancial ? t.units.toLocaleString('nb-NO', { maximumFractionDigits: 4 }) : '—'}</td>
                      <td className="td-right">{isFinancial ? t.price.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                      <td className="td-right">{beløp !== null ? formatCurrency(beløp) : '—'}</td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} className="cd-table-footer" />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDetailPage;
