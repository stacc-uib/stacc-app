import type { TransactionsChartData } from '../lib/getTransactionsChartData';

type Props = {
  averageTransactionSize: number;
  chartData: TransactionsChartData;
};

function formatAmount(value: number) {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value);
}

function TransactionsChartRow({ averageTransactionSize, chartData: _chartData }: Props) {
  return (
    <div className="row g-3" style={{ marginBottom: '1.5rem' }}>
      <div className="col-12 col-lg-4">
        <div className="summary-card h-100" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', background: '#f8fafc', border: '1px dashed rgba(17,24,39,0.15)' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>Transaksjonsvolum — placeholder</p>
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="summary-card h-100" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', background: '#f8fafc', border: '1px dashed rgba(17,24,39,0.15)' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>Transaksjonstype — placeholder</p>
        </div>
      </div>

      <div className="col-12 col-lg-4">
        <div className="row g-3 h-100">
          <div className="col-12">
            <article className="summary-card h-100">
              <p className="summary-card__label" style={{ fontSize: '0.8rem' }}>Gjennomsnittlig transaksjonsstørrelse</p>
              <p className="summary-card__value" style={{ fontSize: '1.1rem' }}>{formatAmount(averageTransactionSize)}</p>
            </article>
          </div>
          <div className="col-12">
            <article className="summary-card h-100">
              <p className="summary-card__label" style={{ fontSize: '0.8rem' }}>Vekstprosent fra forrige periode</p>
              <p className="summary-card__value" style={{ fontSize: '1.1rem', color: '#9ca3af' }}>placeholder</p>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionsChartRow;
