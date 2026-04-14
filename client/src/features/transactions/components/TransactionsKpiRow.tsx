import type { TransactionsKpi } from '../lib/getTransactionsKpi';

function formatAmount(value: number) {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value);
}

type Props = {
  kpi: TransactionsKpi;
};

function TransactionsKpiRow({ kpi }: Props) {
  const items = [
    { label: 'Antall transaksjoner', value: kpi.totalTransactions.toString() },
    { label: 'Antall kjøp', value: kpi.totalKjop.toString() },
    { label: 'Antall salg', value: kpi.totalSalg.toString() },
    { label: 'Brutto tegning', value: formatAmount(kpi.bruttoTegning) },
    { label: 'Netto tegning', value: formatAmount(kpi.nettoTegning) },
  ];

  return (
    <div className="row g-3" style={{ marginBottom: '1.5rem' }}>
      {items.map((item) => (
        <div key={item.label} className="col">
          <article className="summary-card">
            <p className="summary-card__label" style={{ fontSize: '0.8rem' }}>{item.label}</p>
            <p className="summary-card__value" style={{ fontSize: '1.5rem' }}>{item.value}</p>
          </article>
        </div>
      ))}
    </div>
  );
}

export default TransactionsKpiRow;
