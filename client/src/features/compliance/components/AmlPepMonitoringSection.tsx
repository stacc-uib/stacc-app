import { useMemo, useState } from 'react';
import type { AmlPepFollowUpRow, AmlPepOverview } from '../types/compliance';

type AmlPepMonitoringSectionProps = {
  overview: AmlPepOverview;
};

type ReviewFilter = 'alle' | 'forfalt' | 'snart' | 'hoy-risiko' | 'mangler-dokumentasjon';

type ReviewTimelineItem = {
  id: string;
  label: string;
  detail: string;
  tone: 'ok' | 'warning' | 'critical' | 'neutral';
};

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
  if (
    value === 'Forfalt' ||
    value === 'Mangler dokumentasjon' ||
    value === 'Høy'
  ) {
    return 'status-badge status-badge--critical';
  }

  if (
    value === 'Forfaller snart' ||
    value === 'Mangler oppdatering' ||
    value === 'Medium'
  ) {
    return 'status-badge status-badge--warning';
  }

  return 'status-badge status-badge--ok';
}

function getTimelineForRow(row: AmlPepFollowUpRow, isUpdated: boolean): ReviewTimelineItem[] {
  const items: ReviewTimelineItem[] = [
    {
      id: `${row.customerId}-status`,
      label: isUpdated ? 'Kontroll oppdatert' : 'Kontrollstatus',
      detail: isUpdated
        ? 'Kontrollen er markert som gjennomført og ny frist er lagt inn.'
        : `Status er ${row.reviewStatus.toLowerCase()} med neste kontroll ${row.nextReviewLabel}.`,
      tone:
        isUpdated
          ? 'ok'
          : row.reviewStatus === 'Forfalt'
            ? 'critical'
            : row.reviewStatus === 'Forfaller snart'
              ? 'warning'
              : 'neutral',
    },
    {
      id: `${row.customerId}-documentation`,
      label: 'Dokumentasjon',
      detail: `Dokumentasjonsstatus er ${row.documentationStatus.toLowerCase()}.`,
      tone:
        row.documentationStatus === 'Mangler dokumentasjon'
          ? 'critical'
          : row.documentationStatus === 'Mangler oppdatering'
            ? 'warning'
            : 'ok',
    },
  ];

  if (row.pepStatus === 'Ja') {
    items.push({
      id: `${row.customerId}-pep`,
      label: 'PEP-flagg',
      detail: 'Investor er registrert som politisk eksponert person og krever tett oppfølging.',
      tone: 'critical',
    });
  }

  return items;
}

function getVisibleRows(rows: AmlPepFollowUpRow[], activeFilter: ReviewFilter) {
  return rows.filter((row) => {
    if (activeFilter === 'forfalt') {
      return row.reviewStatus === 'Forfalt';
    }

    if (activeFilter === 'snart') {
      return row.reviewStatus === 'Forfaller snart';
    }

    if (activeFilter === 'hoy-risiko') {
      return row.amlRiskLevel === 'Høy';
    }

    if (activeFilter === 'mangler-dokumentasjon') {
      return row.documentationStatus !== 'Komplett';
    }

    return true;
  });
}

function AmlPepMonitoringSection({ overview }: AmlPepMonitoringSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('alle');
  const [rows, setRows] = useState<AmlPepFollowUpRow[]>(overview.rows);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [updatedIds, setUpdatedIds] = useState<string[]>([]);

  const visibleRows = useMemo(() => getVisibleRows(rows, activeFilter), [activeFilter, rows]);

  const selectedRow = useMemo(
    () => visibleRows.find((row) => row.customerId === selectedCustomerId) ?? null,
    [selectedCustomerId, visibleRows],
  );

  function handleSelectRow(customerId: string) {
    setSelectedCustomerId((current) => (current === customerId ? '' : customerId));
  }

  function handleQuickUpdate(customerId: string) {
    const targetRow = rows.find((row) => row.customerId === customerId);

    if (!targetRow) {
      return;
    }

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

        <section className="data-table-card">
          <div className="data-table-card__header">
            <div>
              <h3 className="data-table-card__title">Kontroller som krever oppfølging</h3>
              <p className="data-table-card__description">
                Velg en investor for å se detaljer og oppdatere kontrollen.
              </p>
            </div>
          </div>

          <div className="stack-list">
            {visibleRows.slice(0, 8).map((row) => {
              const isSelected = row.customerId === selectedCustomerId;
              const isUpdated = updatedIds.includes(row.customerId);

              return (
                <article
                  key={row.customerId}
                  className={`aml-review-card${isSelected ? ' aml-review-card--selected' : ''}`}
                >
                  <div className="stack-card__row">
                    <div className="aml-review-card__main">
                      <p className="queue-card__eyebrow">
                        {row.pepStatus === 'Ja' ? 'PEP-investor' : 'Ordinær kontroll'}
                      </p>
                      <h3 className="queue-card__title">{row.investorName}</h3>
                    </div>

                    <div className="aml-review-card__badges">
                      <span className={getBadgeClassName(row.reviewStatus)}>{row.reviewStatus}</span>
                      <span className={getBadgeClassName(row.amlRiskLevel)}>{row.amlRiskLevel}</span>
                      <button
                        type="button"
                        className="compliance-customer-link"
                        onClick={() => {
                          window.location.hash = `kundeoversikt/${row.customerId}`;
                        }}
                      >
                        Vis kundeprofil
                      </button>
                      <button
                        type="button"
                        className="aml-review-card__toggle"
                        onClick={() => handleSelectRow(row.customerId)}
                        aria-expanded={isSelected}
                      >
                        {isSelected ? 'Skjul detaljer' : 'Vis detaljer'}
                      </button>
                    </div>
                  </div>

                  <div className="queue-card__meta-row aml-review-card__meta-row">
                    <span>Siste kontroll: {row.lastReviewLabel}</span>
                    <span>Neste kontroll: {row.nextReviewLabel}</span>
                    <span>Dokumentasjon: {row.documentationStatus}</span>
                    {isUpdated ? <span>Kontroll oppdatert</span> : null}
                  </div>

                  {isSelected ? (
                    <div className="aml-review-popover" role="region" aria-label={`Detaljer for ${row.investorName}`}>
                      <div className="aml-review-popover__header">
                        <div>
                          <p className="aml-review-popover__eyebrow">Valgt investor</p>
                          <h3 className="data-table-card__title">{row.investorName}</h3>
                          <p className="data-table-card__description">
                            PEP-status {row.pepStatus}. Neste kontroll {row.nextReviewLabel}.
                          </p>
                        </div>

                        <button
                          type="button"
                          className="queue-action queue-action--primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleQuickUpdate(row.customerId);
                          }}
                        >
                          Marker kontroll som oppdatert
                        </button>
                      </div>

                      <div className="aml-review__detail-grid">
                        <article className="stack-card aml-review-popover__panel">
                          <h3 className="stack-card__title">Status nå</h3>
                          <div className="aml-review-popover__status-row">
                            <span className={getBadgeClassName(row.reviewStatus)}>{row.reviewStatus}</span>
                            <span className={getBadgeClassName(row.documentationStatus)}>
                              {row.documentationStatus}
                            </span>
                            <span className={getBadgeClassName(row.amlRiskLevel)}>{row.amlRiskLevel}</span>
                          </div>
                          <p className="stack-card__body">
                            Siste kontroll ble gjennomført {row.lastReviewLabel}, og neste kontroll er satt til {row.nextReviewLabel}.
                          </p>
                        </article>

                        <article className="stack-card aml-review-popover__panel">
                          <h3 className="stack-card__title">Hva må følges opp?</h3>
                          <div className="stack-list">
                            {getTimelineForRow(row, isUpdated).map((item) => (
                              <article key={item.id} className="aml-review-popover__timeline-item">
                                <div className="stack-card__row stack-card__row--dense">
                                  <h4 className="stack-card__title">{item.label}</h4>
                                  <span
                                    className={getBadgeClassName(
                                      item.tone === 'neutral'
                                        ? 'Planlagt'
                                        : item.tone === 'critical'
                                          ? 'Forfalt'
                                          : item.tone === 'warning'
                                            ? 'Forfaller snart'
                                            : 'Oppdatert',
                                    )}
                                  >
                                    {item.tone === 'critical'
                                      ? 'Krever tiltak'
                                      : item.tone === 'warning'
                                        ? 'Følg opp'
                                        : item.tone === 'ok'
                                          ? 'Oppdatert'
                                          : 'Til info'}
                                  </span>
                                </div>
                                <p className="stack-card__body">{item.detail}</p>
                              </article>
                            ))}
                          </div>
                        </article>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <div className="data-table-card">
          <div className="data-table-card__header">
            <div>
              <h3 className="data-table-card__title">Alle PEP-kontroller</h3>
              <p className="data-table-card__description">
                Full oversikt for kontroll og revisjon.
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
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.customerId}>
                    <td>
                      <div className="table-primary-cell">
                        <button
                          type="button"
                          className="compliance-customer-link"
                          onClick={() => {
                            window.location.hash = `kundeoversikt/${row.customerId}`;
                          }}
                        >
                          <strong>{row.investorName}</strong>
                        </button>
                        <span>
                          {updatedIds.includes(row.customerId)
                            ? 'Kontroll oppdatert'
                            : 'Operativ oppfølging'}
                        </span>
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
