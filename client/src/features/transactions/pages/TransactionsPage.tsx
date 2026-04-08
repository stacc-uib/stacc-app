import TransactionsTable from '../components/TransactionsTable';
import { getTransactionsPageData } from '../lib/getTransactionsPageData';

function TransactionsPage() {
  const { transactions, total } = getTransactionsPageData();

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Transaksjoner</p>
      <h1>Transaksjoner</h1>
      <p className="content-card__description">
        Siste registrerte transaksjoner på tvers av fond og kunder.
      </p>

      <TransactionsTable transactions={transactions} total={total} />
    </div>
  );
}

export default TransactionsPage;
