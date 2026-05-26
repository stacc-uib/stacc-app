import IncomeSubnav from '../components/IncomeSubnav';
import IncomeTable from '../components/IncomeTable';
import IncomeGraph from '../components/IncomeGraph';
import IncomeOverview from '../components/IncomeOverview';
import getIncomeData from '../lib/getIncomeData';
import IncomePeriodFilter from '../components/IncomePeriodFilter';
import { applyDateRange, getPresetRange, getIncomeDateRange, type Preset } from '../lib/getIncomeDateRange';
import type { DateRange } from "../types/dateRange";
import type { ReactNode } from 'react';

import fundPrices from "../../../mocks/fundPrices.json";
import investors from "../../../mocks/investors.json";
import trades from "../../../mocks/trades.json";

import { useMemo, useEffect, useState } from 'react';

export function SummaryCard({
  title,
  description,
  children,
  onClick,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <article
      className="summary-card h-100"
      style={{
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        ...(onClick ? { cursor: 'pointer' } : {}),
      }}
      onClick={onClick}
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

export function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
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

const incomeSubnavItems = [
    {
        id: 'oversikt',
        label: 'Oversikt',
        description: '',
    },
    {
        id: 'tabell',
        label: 'Tabell',
        description: '',
    },
    {
        id: 'grafer',
        label: 'Grafer',
        description: '',
    },
] as const;

function getIncomeSubpageIdFromHash() {
    const hash = window.location.hash.replace(/^#/, '');
    const [, subpageId] = hash.split('/');

    return incomeSubnavItems.some((item) => item.id === subpageId)
        ? subpageId
        : 'oversikt';
}

function IncomePage() {
    const [activeSubpageId, setActiveSubpageId] = useState(
        getIncomeSubpageIdFromHash,
    );

    const [incomeData, setIncomeData] = useState(
        getIncomeData(trades, investors, fundPrices)
    );

    const [splitBy, setSplitBy] = useState<"fund" | "class" | "fundandclass" | "segment" | "category">("fund");

    const { from: minDate, to: maxDate } = getIncomeDateRange(incomeData);
    const [range, setRange] = useState<DateRange>({ from: minDate, to: maxDate });

    const [activePreset, setActivePreset] = useState<Preset | null>(null);

    const filteredIncomeData = useMemo(() => applyDateRange(incomeData, range), [incomeData, range]);

    function handlePresetSelect(preset: Preset) {
        setActivePreset(preset);
        setRange(getPresetRange(preset, maxDate, minDate));
    }

    function handleRangeChange(newRange: DateRange) {
        setActivePreset(null);
        setRange(newRange);
    }

    function handleReset() {
        setActivePreset(null);
        setRange({ from: minDate, to: maxDate });
    }

    useEffect(() => {
        const handleHashChange = () => {
            setActiveSubpageId(getIncomeSubpageIdFromHash());
        };

        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    function handleSubpageSelect(nextSubpageId: string) {
        window.location.hash = `#inntekt/${nextSubpageId}`;
    }

    return (
            <div className="content-card">
            <p className="content-card__eyebrow">Income</p>

            <h1>Inntekt</h1>

            <p className="content-card__description">
                Inntektsoversikt og projeksjoner.
            </p>

            <IncomeSubnav
                items={[...incomeSubnavItems]}
                activeItemId={activeSubpageId}
                onSelect={handleSubpageSelect}
            />

            {activeSubpageId === 'oversikt' ? (
                <IncomeOverview 
                    incomeData={incomeData} 
                    trades={trades}
                    fundPrices={fundPrices}
                />
            ) : null}

            {activeSubpageId === 'grafer' ? (
                <>
                    <IncomePeriodFilter
                        range={range}
                        minDate={minDate}
                        maxDate={maxDate}
                        activePreset={activePreset}
                        onRangeChange={handleRangeChange}
                        onPresetSelect={handlePresetSelect}
                        onReset={handleReset}
                    />
                    <IncomeGraph incomeData={filteredIncomeData} investors={investors} splitBy={splitBy} setSplitBy={setSplitBy}  />
                    </>
            ) : null}

            {activeSubpageId === 'tabell' ? (
                <>
                    <IncomePeriodFilter
                        range={range}
                        minDate={minDate}
                        maxDate={maxDate}
                        activePreset={activePreset}
                        onRangeChange={handleRangeChange}
                        onPresetSelect={handlePresetSelect}
                        onReset={handleReset}
                    />
                    <IncomeTable incomeData={filteredIncomeData} investors={investors} splitBy={splitBy} setSplitBy={setSplitBy} />
                </>
            ) : null}
        </div>
    );
}

export default IncomePage;
