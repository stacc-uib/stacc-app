import { useMemo, useState } from 'react';
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
    return 'status-badge status-badge--critical';
  }
  if (value === 'Forfaller snart' || value === 'Mangler oppdatering' || value === 'Medium') {
    return 'status-badge status-badge--warning';
  }
  return 'status-badge status-badge--ok';
}

function getFollowUpItems(row: AmlPepFollowUpRow, isUpdated: boolean) {
  const items: { label: string; detail: string; tone: 'ok' | 'warning' | 'critical' | 'neutral' }[] = [];

  if (!isUpdated) {
    if (row.reviewStatus === 'Forfalt') {
      items.push({ label: 'Kontroll forfalt', detail: `Planlegg gjennomgang snarest. Neste frist: ${row.nextReviewLabel}.`, tone: 'critical' });
    } else if (row.reviewStatus === 'Forfaller snart') {
      items.push({ label: 'Forfaller snart', detail: `Planlegg gjennomgang innen ${row.nextReviewLabel}.`, tone: 'warning' });
    }
  }

  if (row.documentationStatus === 'Mangler dokumentasjon') {
    items.push({ label: 'Dokumentasjon mangler', detail: 'Last opp nødvendige dokumenter før neste kontroll.', tone: 'critical' });
  } else if (row.documentationStatus === 'Mangler oppdatering') {
    items.push({ label: 'Dokumentasjon utdatert', detail: 'Oppdater dokumentasjonen så snart som mulig.', tone: 'warning' });
  }

  if (row.pepStatus === 'Ja') {
    items.push({ label: 'PEP-flagg', detail: 'Registrert som politisk eksponert person — krever tett oppfølging.', tone: 'critical' });
  }

  return items;
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
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [updatedIds, setUpdatedIds] = useState<string[]>([]);

  const visibleRows = useMemo(() => getVisibleRows(rows, activeFilter), [activeFilter, rows]);

  function handleSelectRow(customerId: string) {
    setSelectedCustomerId((current) => (current === customerId ? '' : customerId));
  }

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
    setSelectedCustomerId('');
  }

  const overdueCount = rows.filter((row) => row.reviewStatus === 'Forfalt').length;
  const dueSoonCount = rows.filter((row) => row.reviewStatus === 'Forfaller snart').length;
  const highRiskCount = rows.filter((row) => row.amlRiskLevel === 'Høy').length;
  const missingDocumentationCount = rows.filter(
    (row) => row.documentationStatus !== 'Komplett',
  ).length;

  return (
    <section className="feature-section feature-section--aml">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">AML og PEP</p>
            <h2 className="feature-section__title">PEP-oppfølging</h2>
            <p className="feature-section__description">
              Oversikt over kontroller som krever oppfølging. Klikk på en investor for å se
              detaljer og oppdatere statusen.
            </p>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-6 col-xl-3">
            <article className="summary-card summary-card--critical h-100">
              <p className="summary-card__label">Forfalte kontroller</p>
              <p className="summary-card__value">{overdueCount}</p>
            </article>
          </div>
          <div className="col-6 col-xl-3">
            <article className="summary-card summary-card--warning h-100">
              <p className="summary-card__label">Forfaller innen 14 dager</p>
              <p className="summary-card__value">{dueSoonCount}</p>
            </article>
          </div>
          <div className="col-6 col-xl-3">
            <article className="summary-card summary-card--critical h-100">
              <p className="summary-card__label">Høy risiko</p>
              <p className="summary-card__value">{highRiskCount}</p>
            </article>
          </div>
          <div className="col-6 col-xl-3">
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
              className={`queue-filter${option.id === activeFilter ? ' queue-filter--active' : ''}`}
              onClick={() => setActiveFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <section className="data-table-card">
          <div className="data-table-card__header">
            <div>
              <h3 className="data-table-card__title">Kontroller</h3>
              <p className="data-table-card__description">
                {visibleRows.length} av {rows.length} vises
              </p>
            </div>
          </div>

          <div className="stack-list">
            {visibleRows.map((row) => {
              const isSelected = row.customerId === selectedCustomerId;
              const isUpdated = updatedIds.includes(row.customerId);
              const followUpItems = getFollowUpItems(row, isUpdated);

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
                      {isUpdated ? (
                        <span className="status-badge status-badge--ok">Oppdatert</span>
                      ) : (
                        <>
                          <span className={getBadgeClassName(row.reviewStatus)}>
                            {row.reviewStatus}
                          </span>
                          <span className={getBadgeClassName(row.amlRiskLevel)}>
                            {row.amlRiskLevel}
                          </span>
                        </>
                      )}
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
                        {isSelected ? 'Lukk' : 'Detaljer'}
                      </button>
                    </div>
                  </div>

                  <div className="queue-card__meta-row aml-review-card__meta-row">
                    <span>Siste kontroll: {row.lastReviewLabel}</span>
                    <span>Neste kontroll: {row.nextReviewLabel}</span>
                    <span className={getBadgeClassName(row.documentationStatus)}>
                      {row.documentationStatus}
                    </span>
                  </div>

                  {isSelected ? (
                    <div
                      className="aml-review-popover"
                      role="region"
                      aria-label={`Detaljer for ${row.investorName}`}
                    >
                      {followUpItems.length > 0 ? (
                        <div className="stack-list">
                          {followUpItems.map((item) => (
                            <div key={item.label} className="aml-review-popover__timeline-item">
                              <div className="stack-card__row stack-card__row--dense">
                                <h4 className="stack-card__title">{item.label}</h4>
                                <span
                                  className={getBadgeClassName(
                                    item.tone === 'critical'
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
                                      : 'OK'}
                                </span>
                              </div>
                              <p className="stack-card__body">{item.detail}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="stack-card__body">
                          Ingen utestående oppfølgingspunkter for denne investoren.
                        </p>
                      )}

                      <div className="aml-review-popover__footer">
                        <button
                          type="button"
                          className="queue-action queue-action--primary"
                          onClick={() => handleQuickUpdate(row.customerId)}
                          disabled={isUpdated}
                        >
                          {isUpdated ? 'Kontroll oppdatert' : 'Marker kontroll som oppdatert'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}

            {visibleRows.length === 0 ? (
              <p className="compliance-registry__empty">
                Ingen saker matcher det valgte filteret.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default AmlPepMonitoringSection;
