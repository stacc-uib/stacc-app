import type { AmlPepFollowUpRow, AmlPepOverview } from '../types/compliance';

type AmlPepMonitoringSectionProps = {
  overview: AmlPepOverview;
};

function getBadgeClassName(
  value:
    | AmlPepFollowUpRow['reviewStatus']
    | AmlPepFollowUpRow['documentationStatus']
    | AmlPepFollowUpRow['amlRiskLevel'],
) {
  if (value === 'Forfalt' || value === 'Mangler dokumentasjon' || value === 'Høy') {
    return 'status-badge status-badge--critical';
  }

  if (value === 'Forfaller snart' || value === 'Mangler oppdatering' || value === 'Medium') {
    return 'status-badge status-badge--warning';
  }

  return 'status-badge status-badge--ok';
}

function AmlPepMonitoringSection({ overview }: AmlPepMonitoringSectionProps) {
  const prioritizedRows = overview.rows.slice(0, 8);

  return (
    <section className="feature-section feature-section--aml">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">AML og PEP</p>
            <h2 className="feature-section__title">Oppfølging av hvitvasking og PEP-kontroller</h2>
            <p className="feature-section__description">
              Her ser vi hvem som har forfalte kontroller, hvem som forfaller snart, og hvilke saker som har høy risiko eller mangelfull dokumentasjon.
            </p>
          </div>
        </div>

        <div className="summary-grid summary-grid--four-up">
          <article className="summary-card summary-card--critical">
            <p className="summary-card__label">Forfalte kontroller</p>
            <p className="summary-card__value">{overview.overdueReviews}</p>
          </article>
          <article className="summary-card summary-card--warning">
            <p className="summary-card__label">Forfaller innen 14 dager</p>
            <p className="summary-card__value">{overview.dueSoonReviews}</p>
          </article>
          <article className="summary-card summary-card--critical">
            <p className="summary-card__label">Høy risiko</p>
            <p className="summary-card__value">{overview.highRiskInvestors}</p>
          </article>
          <article className="summary-card summary-card--warning">
            <p className="summary-card__label">Mangler dokumentasjon</p>
            <p className="summary-card__value">{overview.missingDocumentation}</p>
          </article>
        </div>

        <div className="data-table-card">
          <div className="data-table-card__header">
            <div>
              <h3 className="data-table-card__title">Kontroller som bør behandles neste</h3>
              <p className="data-table-card__description">
                Oversikten prioriterer forfalte og kommende kontroller, med risikonivå og dokumentasjonsstatus.
              </p>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>PEP</th>
                  <th>AML-risiko</th>
                  <th>Dokumentasjon</th>
                  <th>Siste kontroll</th>
                  <th>Neste kontroll</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {prioritizedRows.map((row) => (
                  <tr key={row.customerId}>
                    <td>{row.investorName}</td>
                    <td>{row.pepStatus}</td>
                    <td>
                      <span className={getBadgeClassName(row.amlRiskLevel)}>{row.amlRiskLevel}</span>
                    </td>
                    <td>
                      <span className={getBadgeClassName(row.documentationStatus)}>
                        {row.documentationStatus}
                      </span>
                    </td>
                    <td>{row.lastReviewLabel}</td>
                    <td>{row.nextReviewLabel}</td>
                    <td>
                      <span className={getBadgeClassName(row.reviewStatus)}>{row.reviewStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AmlPepMonitoringSection;
