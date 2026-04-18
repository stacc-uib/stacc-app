import { useMemo, useState } from 'react';
import TransactionsChartRow from '../components/TransactionsChartRow';
import TransactionsKpiRow from '../components/TransactionsKpiRow';
import TransactionsPeriodFilter from '../components/TransactionsPeriodFilter';
import TransactionsTable from '../components/TransactionsTable';
import { applyDateRange, getPresetRange, getTransactionsDateRange, type DateRange, type Preset } from '../lib/getTransactionsDateRange';
import { getTransactionsChartData } from '../lib/getTransactionsChartData';
import { getTransactionsGrowth } from '../lib/getTransactionsGrowth';
import { getTransactionsKpi } from '../lib/getTransactionsKpi';
import { getTransactionsPageData } from '../lib/getTransactionsPageData';

function TransactionsPage() {
  const { transactions } = getTransactionsPageData();
  const { from: minDate, to: maxDate } = getTransactionsDateRange(transactions);

  const [range, setRange] = useState<DateRange>({ from: minDate, to: maxDate });
  const [activePreset, setActivePreset] = useState<Preset | null>(null);

  const filtered = useMemo(() => applyDateRange(transactions, range), [transactions, range]);
  const kpi = useMemo(() => getTransactionsKpi(filtered), [filtered]);
  const chartData = useMemo(() => getTransactionsChartData(filtered), [filtered]);
  const growth = useMemo(() => getTransactionsGrowth(filtered, range.from, range.to), [filtered, range]);

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

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Transactions</p>
      <h1>Transaksjoner</h1>
      <p className="content-card__description">
        Transaksjonsoversikt og utvikling på tvers av fond og kunder.
      </p>

      <TransactionsPeriodFilter
        range={range}
        minDate={minDate}
        maxDate={maxDate}
        activePreset={activePreset}
        onRangeChange={handleRangeChange}
        onPresetSelect={handlePresetSelect}
        onReset={handleReset}
      />
      <TransactionsKpiRow kpi={kpi} />
      <TransactionsChartRow averageTransactionSize={kpi.averageTransactionSize} chartData={chartData} growth={growth} />
      <TransactionsTable transactions={filtered} />
    </div>
  );
}

export default TransactionsPage;
