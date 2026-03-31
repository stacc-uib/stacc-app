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

  if (value === 'Oppdatert') {
    return 'status-badge status-badge--ok';
  }

  return 'status-badge status-badge--ok';
}

function getTimelineForRow(row: AmlPepFollowUpRow, isUpdated: boolean): ReviewTimelineItem[] {
  const items: ReviewTimelineItem[] = [
    {
      id: `${row.customerId}-current-status`,
      label: isUpdated ? 'Review oppdatert' : 'Nåværende status',
      detail: isUpdated
        ? 'Kontrollen er markert som gjennomført og ny frist er lagt inn.'
        : `Status er ${row.reviewStatus.toLowerCase()} med neste kontroll ${row.nextReviewLabel}.`,
      tone: isUpdated ? 'ok' : row.reviewStatus === 'Forfalt' ? 'critical' : row.reviewStatus === 'Forfaller snart' ? 'warning' : 'neutral',
    },
    {
      id: `${row.customerId}-last-review`,
      label: 'Siste PEP-kontroll',
      detail: `Sist gjennomført ${row.lastReviewLabel}.`,
      tone: 'neutral',
    },
    {
      id: `${row.customerId}-documentation`,
      label: 'Dokumentasjon',
      detail: `Dokumentasjonsstatus: ${row.documentationStatus.toLowerCase()}.`,
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
      id: `${row.customerId}-pep-flag`,
      label: 'PEP-flagg',
      detail: 'Investor er registrert som politisk eksponert person og krever tett oppfølging.',
      tone: 'critical',
    });
  }

  return items;
}

function AmlPepMonitoringSection({ overview }: AmlPepMonitoringSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('alle');
  const [rows, setRows] = useState<AmlPepFollowUpRow[]>(overview.rows);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [updatedIds, setUpdatedIds] = useState<string[]>([]);

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => {
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
      }),
    [activeFilter, rows],
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
      current.includes(customerId)
        ? current
        : [...current, customerId],
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
            <h2 className="feature-section__title">PEP og review management</h2>
            <p className="feature-section__description">
              CCO skal raskt se hvilke kontroller som er forfalt, hvilke som nærmer seg
              frist, og kunne oppdatere review-status uten å lete i flere flater.
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
              <h3 className="data-table-card__title">Saker som må vurderes nå</h3>
              <p className="data-table-card__description">
                Hold over eller fokuser på en investor for å se review-detaljer og historikk
                uten at siden fylles av en permanent sidepanel.
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
                    <div>
                      <p className="queue-card__eyebrow">
                        {row.pepStatus === 'Ja' ? 'PEP-investor' : 'Standard review'}
                      </p>
                      <h3 className="queue-card__title">{row.investorName}</h3>
                    </div>
                    <div className="aml-review-card__badges">
                      <button
                        type="button"
                        className="aml-review-card__toggle"
                        onClick={() => handleSelectRow(row.customerId)}
                        aria-expanded={isSelected}
                      >
                        {isSelected ? 'Skjul detaljer' : 'Vis detaljer'}
                      </button>
                      {isUpdated ? (
                        <span className={getBadgeClassName('Oppdatert')}>Oppdatert</span>
                      ) : null}
                      <span className={getBadgeClassName(row.reviewStatus)}>
                        {row.reviewStatus}
                      </span>
                    </div>
                  </div>

                  <p className="queue-card__summary">
                    AML-risiko {row.amlRiskLevel.toLowerCase()} og dokumentasjon{' '}
                    {row.documentationStatus.toLowerCase()}.
                  </p>

                  <div className="queue-card__meta-row">
                    <span>Siste kontroll: {row.lastReviewLabel}</span>
                    <span>Neste kontroll: {row.nextReviewLabel}</span>
                  </div>

                  {isSelected ? (
                  <div className="aml-review-popover">
                    <div className="aml-review-popover__header">
                      <div>
                        <h3 className="data-table-card__title">{row.investorName}</h3>
                        <p className="data-table-card__description">
                          PEP-status {row.pepStatus}, neste kontroll {row.nextReviewLabel}.
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
                        Marker review oppdatert
                      </button>
                    </div>

                    <div className="aml-review__detail-grid">
                      <article className="stack-card">
                        <div className="stack-card__row">
                          <h3 className="stack-card__title">Review-status</h3>
                          <span className={getBadgeClassName(row.reviewStatus)}>
                            {row.reviewStatus}
                          </span>
                        </div>
                        <p className="stack-card__body">
                          Siste kontroll {row.lastReviewLabel}. Neste kontroll {row.nextReviewLabel}.
                        </p>
                      </article>

                      <article className="stack-card">
                        <div className="stack-card__row">
                          <h3 className="stack-card__title">Dokumentasjon</h3>
                          <span className={getBadgeClassName(row.documentationStatus)}>
                            {row.documentationStatus}
                          </span>
                        </div>
                        <p className="stack-card__body">
                          Risikonivå {row.amlRiskLevel.toLowerCase()} og PEP-status{' '}
                          {row.pepStatus.toLowerCase()}.
                        </p>
                      </article>
                    </div>

                    <div className="aml-review__timeline">
                      <div className="stack-list">
                        {getTimelineForRow(row, isUpdated).map((item) => (
                          <article key={item.id} className="stack-card">
                            <div className="stack-card__row">
                              <h3 className="stack-card__title">{item.label}</h3>
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
                                      ? 'OK'
                                      : 'Info'}
                              </span>
                            </div>
                            <p className="stack-card__body">{item.detail}</p>
                          </article>
                        ))}
                      </div>
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
                Full oversikt for kontroll og revisjon, med tydelige badges for forfalt,
                snart forfall og dokumentasjonsmangler.
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
                        <strong>{row.investorName}</strong>
                        <span>{updatedIds.includes(row.customerId) ? 'Review oppdatert nå' : 'Operativ oppfølging'}</span>
                      </div>
                    </td>
                    <td>{row.pepStatus}</td>
                    <td>
                      <span className={getBadgeClassName(row.amlRiskLevel)}>
                        {row.amlRiskLevel}
                      </span>
                    </td>
                    <td>
                      <span className={getBadgeClassName(row.documentationStatus)}>
                        {row.documentationStatus}
                      </span>
                    </td>
                    <td>{row.lastReviewLabel}</td>
                    <td>{row.nextReviewLabel}</td>
                    <td>
                      <span className={getBadgeClassName(row.reviewStatus)}>
                        {row.reviewStatus}
                      </span>
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

