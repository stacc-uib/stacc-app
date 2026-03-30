import type {
  InvestorClassificationOverview,
  InvestorClassificationRow,
  InvestorClassificationStatus,
} from '../types/compliance';

type InvestorClassificationSectionProps = {
  overview: InvestorClassificationOverview;
};

const statusLabelByType: Record<InvestorClassificationStatus, string> = {
  ok: 'Klar',
  'mangler-naering': 'Mangler naering',
  'pep-forfaller-snart': 'PEP forfaller snart',
  'pep-forfalt': 'PEP forfalt',
  'ikke-profesjonell': 'Ikke-profesjonell',
};

function getStatusClassName(status: InvestorClassificationStatus) {
  switch (status) {
    case 'pep-forfalt':
    case 'ikke-profesjonell':
      return 'status-badge status-badge--critical';
    case 'mangler-naering':
    case 'pep-forfaller-snart':
      return 'status-badge status-badge--warning';
    default:
      return 'status-badge status-badge--ok';
  }
}

function InvestorClassificationTableRow({ row }: { row: InvestorClassificationRow }) {
  return (
    <tr>
      <td>{row.investorName}</td>
      <td>{row.investorType}</td>
      <td>{row.investorCategory}</td>
      <td>{row.industryGroup}</td>
      <td>{row.pepStatus}</td>
      <td>{row.pepNextReviewLabel}</td>
      <td>
        <span className={getStatusClassName(row.classificationStatus)}>
          {statusLabelByType[row.classificationStatus]}
        </span>
      </td>
    </tr>
  );
}

function InvestorClassificationSection({
  overview,
}: InvestorClassificationSectionProps) {
  const prioritizedRows = overview.rows
    .filter((row) => row.classificationStatus !== 'ok')
    .slice(0, 8);

  return (
    <section className="feature-section">
      <div className="feature-section__header">
        <div>
          <p className="feature-section__eyebrow">Investorklassifisering</p>
          <h2 className="feature-section__title">Status for kunderegisteret</h2>
        </div>
      </div>


      <div className="data-table-card">
        <div className="data-table-card__header">
          <div>
            <h3 className="data-table-card__title">Investorer som trenger oppfølging</h3>
            <p className="data-table-card__description">
              Tabellen viser de viktigste klassifiseringssakene som CCO bør se pa først.
            </p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Type</th>
                <th>Kategori</th>
                <th>Næringsgruppe</th>
                <th>PEP</th>
                <th>Neste kontroll</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {prioritizedRows.map((row) => (
                <InvestorClassificationTableRow key={row.customerId} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default InvestorClassificationSection;
