import type { Transaction } from '../types/transactions';

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
}

function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

function getShareClassName(shareClass: string) {
  const match = shareClass.match(/Klasse\s+\w+/);
  return match ? match[0] : shareClass;
}

type Props = {
  transactions: Transaction[];
  total: number;
};

function TransactionsTable({ transactions, total }: Props) {
  return (
    <div className="data-table-card">
      <div className="data-table-card__header">
        <h3 className="data-table-card__title">Transaksjoner</h3>
        <p className="data-table-card__description">
          Viser de 25 nyeste av {total} transaksjoner
        </p>
      </div>

      <div className="table-scroll">
        <table className="data-table transactions-table">
          <thead>
            <tr>
              <th>Kunde</th>
              <th>Dato</th>
              <th>Status</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Antall</th>
              <th style={{ textAlign: 'right' }}>Kurs</th>
              <th style={{ textAlign: 'right' }}>Beløp</th>
              <th>Fond</th>
              <th>Klasse</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td>
                  <div className="table-primary-cell">
                    <strong>{tx.customerName}</strong>
                  </div>
                </td>
                <td>{formatDate(tx.tradeDate)}</td>
                <td>Oppgjort</td>
                <td>{tx.transactionType}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(tx.units)}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(tx.price)}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(tx.amount)}</td>
                <td>{tx.fundName}</td>
                <td>{getShareClassName(tx.shareClass)}</td>
              </tr>
            ))}

            {transactions.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Ingen transaksjoner funnet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionsTable;
