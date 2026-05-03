import { useMemo, useState } from 'react';
import { statusBadgeClass } from '../../../shared/lib/statusBadge';
import type { AmlPepFollowUpRow, AmlPepOverview } from '../types/compliance';

type AmlPepMonitoringSectionProps = {
  overview: AmlPepOverview;
};

type ReviewFilter = 'alle' | 'forfalt' | 'snart' | 'hoy-risiko' | 'mangler-dokumentasjon';

const filterOptions: { id: ReviewFilter; label: string }[] = [
  { id: 'alle', label: 'Alle saker' },
  { id: 'forfalt', label: 'Forfalt' },
  { id: 'snart', label: 'Forfaller snart' },
  { id: 'hoy-risiko', label: 'Høy risiko' },
  { id: 'mangler-dokumentasjon', label: 'Manglende dokumentasjon' },
];

function getBadgeClassName(
  value:
    | AmlPepFollowUpRow['reviewStatus']
    | AmlPepFollowUpRow['documentationStatus']
    | AmlPepFollowUpRow['amlRiskLevel']
    | 'Oppdatert',
) {
  if (value === 'Forfalt' || value === 'Mangler dokumentasjon' || value === 'Høy') {
    return statusBadgeClass('critical');
  }
  if (value === 'Forfaller snart' || value === 'Mangler oppdatering' || value === 'Medium') {
    return statusBadgeClass('warning');
  }
  return statusBadgeClass('ok');
}

function getVisibleRows(rows: AmlPepFollowUpRow[], activeFilter: ReviewFilter) {
  return rows.filter((row) => {
    if (activeFilter === 'forfalt') return row.reviewStatus === 'Forfalt';
    if (activeFilter === 'snart') return row.reviewStatus === 'Forfaller snart';
    if (activeFilter === 'hoy-risiko') return row.amlRiskLevel === 'Høy';
    if (activeFilter === 'mangler-dokumentasjon') return row.documentationStatus !== 'Komplett';
    return true;
  });
}

function AmlPepMonitoringSection({ overview }: AmlPepMonitoringSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('alle');
  const [rows, setRows] = useState<AmlPepFollowUpRow[]>(overview.rows);
  const [updatedIds, setUpdatedIds] = useState<string[]>([]);

  const visibleRows = useMemo(() => getVisibleRows(rows, activeFilter), [activeFilter, rows]);

  function handleQuickUpdate(customerId: string) {
    setRows((current) =>
      current.map((row) =>
        row.customerId === customerId
          ? {
              ...row,
              lastReviewLabel: '31.03.2026',
              nextReviewLabel: '31.03.2027',
              reviewStatus: 'Planlagt',
              documentationStatus:
                row.documentationStatus === 'Mangler dokumentasjon'
                  ? 'Mangler oppdatering'
                  : 'Komplett',
            }
          : row,
      ),
    );
    setUpdatedIds((current) =>
      current.includes(customerId) ? current : [...current, customerId],
    );
  }

  const overdueCount = rows.filter((row) => row.reviewStatus === 'Forfalt').length;
  const dueSoonCount = rows.filter((row) => row.reviewStatus === 'Forfaller snart').length;
  const highRiskCount = rows.filter((row) => row.amlRiskLevel === 'Høy').length;
  const missingDocumentationCount = rows.filter(
    (row) => row.documentationStatus === 'Mangler dokumentasjon',
  ).length;

  return (
    <section className="feature-section feature-section--aml">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">AML og PEP</p>
            <h2 className="feature-section__title">PEP-oppfølging</h2>
            <p className="feature-section__description">
              Se hvilke kontroller som må tas nå, åpne en investor og oppdater status uten å
              bla mellom flere visninger.
            </p>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6 col-xl-3">
            <article className="summary-card summary-card--critical h-100">
              <p className="summary-card__label">Forfalte kontroller</p>
              <p className="summary-card__value">{overdueCount}</p>
            </article>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <article className="summary-card summary-card--warning h-100">
              <p className="summary-card__label">Forfaller innen 14 dager</p>
              <p className="summary-card__value">{dueSoonCount}</p>
            </article>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <article className="summary-card summary-card--critical h-100">
              <p className="summary-card__label">Høy risiko</p>
              <p className="summary-card__value">{highRiskCount}</p>
            </article>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <article className="summary-card summary-card--warning h-100">
              <p className="summary-card__label">Mangler dokumentasjon</p>
              <p className="summary-card__value">{missingDocumentationCount}</p>
            </article>
          </div>
        </div>

        <div className="queue-filter-row aml-review__filters">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`queue-filter${
                option.id === activeFilter ? ' queue-filter--active' : ''
              }`}
              onClick={() => setActiveFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="data-table-card">
          <div className="data-table-card__header">
            <div>
              <h3 className="data-table-card__title">PEP-kontroller</h3>
              <p className="data-table-card__description">
                Filtrer og oppdater kontrollstatus direkte i tabellen.
              </p>
            </div>
          </div>

          <div className="table-responsive table-scroll">
            <table className="data-table table align-middle mb-0">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>PEP</th>
                  <th>AML-risiko</th>
                  <th>Dokumentasjon</th>
                  <th>Siste kontroll</th>
                  <th>Neste kontroll</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const isUpdated = updatedIds.includes(row.customerId);
                  return (
                    <tr key={row.customerId}>
                      <td>
                        <div className="table-primary-cell">
                          <button
                            type="button"
                            className="compliance-customer-link"
                            onClick={() => {
                              window.location.hash = `#kundeoversikt/${row.customerId}`;
                            }}
                          >
                            <strong>{row.investorName}</strong>
                          </button>
                        </div>
                      </td>
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
                        <span className={getBadgeClassName(isUpdated ? 'Oppdatert' : row.reviewStatus)}>
                          {isUpdated ? 'Oppdatert' : row.reviewStatus}
                        </span>
                      </td>
                      <td>
                        {!isUpdated ? (
                          <button
                            type="button"
                            className="queue-action queue-action--primary"
                            onClick={() => handleQuickUpdate(row.customerId)}
                          >
                            Oppdater kontroll
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="aml-empty-row">
                      Ingen kontroller matcher valgt filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AmlPepMonitoringSection;
