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
import { useTradesContext } from '../../trades/TradesContext';
import type { Transaction } from '../types/transactions';

function TransactionsPage() {
  const { transactions: staticTransactions } = getTransactionsPageData();
  const { registeredTrades } = useTradesContext();

  const transactions = useMemo((): Transaction[] => {
    const newTrades: Transaction[] = registeredTrades.map((t) => ({
      id: t.id,
      customerId: t.customerId,
      customerName: t.customerName,
      fundName: t.fundName,
      shareClass: t.shareClass,
      tradeDate: t.tradeDate,
      settlementDate: t.settlementStatus === 'oppgjort' ? t.settlementDate : null,
      settlementStatus: t.settlementStatus,
      transactionType: t.transactionType as Transaction['transactionType'],
      units: t.units,
      price: t.price,
      amount: t.amount,
      unitEffect: t.unitEffect,
    }));
    return [...newTrades, ...staticTransactions];
  }, [registeredTrades, staticTransactions]);
  const { from: minDate, to: maxDate } = getTransactionsDateRange(transactions);

  const [range, setRange] = useState<DateRange>({ from: minDate, to: maxDate });
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [fundFilter, setFundFilter] = useState('');

  const funds = useMemo(() =>
    Array.from(new Set(transactions.map((tx) => tx.fundName as string))).sort(),
    [transactions]
  );

  const filtered = useMemo(() => {
    const byDate = applyDateRange(transactions, range);
    return fundFilter ? byDate.filter((tx) => tx.fundName === fundFilter) : byDate;
  }, [transactions, range, fundFilter]);

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
    setFundFilter('');
  }

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Transaksjoner</p>
      <h1>Transaksjoner</h1>
      <p className="content-card__description">
        Transaksjoner på tvers av fond og kunder.
      </p>

      <TransactionsPeriodFilter
        range={range}
        minDate={minDate}
        maxDate={maxDate}
        activePreset={activePreset}
        funds={funds}
        fundFilter={fundFilter}
        onRangeChange={handleRangeChange}
        onPresetSelect={handlePresetSelect}
        onFundChange={setFundFilter}
        onReset={handleReset}
      />
      <TransactionsKpiRow kpi={kpi} />
      <TransactionsChartRow averageTransactionSize={kpi.averageTransactionSize} chartData={chartData} growth={growth} />
      <TransactionsTable transactions={filtered} />
    </div>
  );
}

export default TransactionsPage;
