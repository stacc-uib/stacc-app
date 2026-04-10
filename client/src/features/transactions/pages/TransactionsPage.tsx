import TransactionsChartRow from '../components/TransactionsChartRow';
import TransactionsKpiRow from '../components/TransactionsKpiRow';
import TransactionsTable from '../components/TransactionsTable';
import { getTransactionsPageData } from '../lib/getTransactionsPageData';

function TransactionsPage() {
  const { transactions, kpi, chartData } = getTransactionsPageData();

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Transactions</p>
      <h1>Transaksjoner</h1>
      <p className="content-card__description">
        Transaksjonsaktivitet og utvikling på tvers av fond og kunder.
      </p>

      <TransactionsKpiRow kpi={kpi} />
      <TransactionsChartRow
        averageTransactionSize={kpi.averageTransactionSize}
        chartData={chartData}
      />
      <TransactionsTable transactions={transactions} />
    </div>
  );
}

export default TransactionsPage;
