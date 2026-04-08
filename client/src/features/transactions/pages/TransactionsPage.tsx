import TransactionsTable from '../components/TransactionsTable';
import { getTransactionsPageData } from '../lib/getTransactionsPageData';

function TransactionsPage() {
  const pageData = getTransactionsPageData();

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Transaksjoner</p>
      <h1>Transaksjoner</h1>
      <p className="content-card__description">
        Siste registrerte transaksjoner på tvers av fond og kunder.
      </p>

      <TransactionsTable transactions={pageData.transactions.slice(0, 25)} total={pageData.transactions.length} />
    </div>
  );
}

export default TransactionsPage;
