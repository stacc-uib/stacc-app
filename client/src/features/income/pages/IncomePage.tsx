import IncomeSubnav from '../components/IncomeSubnav';
import IncomeTable from '../components/IncomeTable';
import IncomeGraph from '../components/IncomeGraph';
import IncomeOverview from '../components/IncomeOverview';
import getIncomeData from '../lib/getIncomeData';
import IncomePeriodFilter from '../components/IncomePeriodFilter';
import { applyDateRange, getPresetRange, getIncomeDateRange, type Preset } from '../lib/getIncomeDateRange';
import type { DateRange } from "../types/dateRange";

import fundPrices from "../../../mocks/fundPrices.json";
import investors from "../../../mocks/investors.json";
import trades from "../../../mocks/trades.json";

import { useMemo, useEffect, useState } from 'react';

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
                    <IncomeGraph incomeData={filteredIncomeData} investors={investors} />
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
                    <IncomeTable incomeData={filteredIncomeData}/>
                </>
            ) : null}
        </div>
    );
}

export default IncomePage;
