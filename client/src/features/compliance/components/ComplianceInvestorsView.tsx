import React, { useMemo, useState } from 'react';
import InvestorPicker from '../../../shared/components/InvestorPicker';
import type { InvestorPickerItem } from '../../../shared/components/InvestorPicker';
import type { CompliancePageData, AmlPepFollowUpRow } from '../types/compliance';

type ComplianceInvestorsViewProps = {
  pageData: CompliancePageData;
};

type InvestorFilter = 'alle' | 'forfalt' | 'snart' | 'hoy-risiko' | 'mangler-data';

type InvestorRow = {
  customerId: string;
  investorName: string;
  investorType: string;
  industryGroup: string | null;
  pepStatus: 'Ja' | 'Nei';
  amlRiskLevel: 'Lav' | 'Medium' | 'Høy';
  documentationStatus: 'Komplett' | 'Mangler oppdatering' | 'Mangler dokumentasjon';
  lastReviewLabel: string;
  nextReviewLabel: string;
  reviewStatus: 'Forfalt' | 'Forfaller snart' | 'Planlagt';
};

const filterOptions: { id: InvestorFilter; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'forfalt', label: 'Forfalt' },
  { id: 'snart', label: 'Forfaller snart' },
  { id: 'hoy-risiko', label: 'Høy risiko' },
  { id: 'mangler-data', label: 'Mangler data' },
];

/**
 * Sorteringsrekkefølge:
 * 0 – Forfalt kontroll (krever umiddelbar handling)
 * 1 – Høy AML-risiko (alvorlig uansett kontrollstatus)
 * 2 – Forfaller snart (bør planlegges)
 * 3 – Dokumentasjon mangler helt
 * 4 – Dokumentasjon utdatert
 * 5 – Mangler næringsgruppe
 * 6 – Alt OK
 */
function severityOf(row: InvestorRow): number {
  if (row.reviewStatus === 'Forfalt') return 0;
  if (row.amlRiskLevel === 'Høy') return 1;
  if (row.reviewStatus === 'Forfaller snart') return 2;
  if (row.documentationStatus === 'Mangler dokumentasjon') return 3;
  if (row.documentationStatus === 'Mangler oppdatering') return 4;
  if (!row.industryGroup) return 5;
  return 6;
}

function hasMissingData(row: InvestorRow): boolean {
  return !row.industryGroup || row.documentationStatus !== 'Komplett';
}

function matchesFilter(row: InvestorRow, filter: InvestorFilter): boolean {
  switch (filter) {
    case 'forfalt':
      return row.reviewStatus === 'Forfalt';
    case 'snart':
      return row.reviewStatus === 'Forfaller snart';
    case 'hoy-risiko':
      return row.amlRiskLevel === 'Høy';
    case 'mangler-data':
      return hasMissingData(row);
    default:
      return true;
  }
}

function buildRows(pageData: CompliancePageData): InvestorRow[] {
  const amlMap = new Map<string, AmlPepFollowUpRow>(
    pageData.amlPep.rows.map((r) => [r.customerId, r]),
  );

  return pageData.investorClassification.rows
    .map((cls) => {
      const aml = amlMap.get(cls.customerId);
      return {
        customerId: cls.customerId,
        investorName: cls.investorName,
        investorType: cls.investorType,
        industryGroup: cls.industryGroup,
        pepStatus: cls.pepStatus,
        amlRiskLevel: aml?.amlRiskLevel ?? 'Lav',
        documentationStatus: aml?.documentationStatus ?? 'Komplett',
        lastReviewLabel: aml?.lastReviewLabel ?? '—',
        nextReviewLabel: aml?.nextReviewLabel ?? cls.pepNextReviewLabel,
        reviewStatus: aml?.reviewStatus ?? 'Planlagt',
      } satisfies InvestorRow;
    })
    .sort(
      (a, b) =>
        severityOf(a) - severityOf(b) ||
        a.investorName.localeCompare(b.investorName, 'nb'),
    );
}

// — Visningshjelpere —
// Badges vises kun ved warning/critical. OK-tilstander vises som vanlig tekst
// for å redusere visuell støy og gjøre problemer tydeligere.

function AmlRiskCell({ level }: { level: InvestorRow['amlRiskLevel'] }) {
  if (level === 'Høy') {
    return <span className="status-badge status-badge--critical">Høy</span>;
  }
  if (level === 'Medium') {
    return <span className="status-badge status-badge--warning">Medium</span>;
  }
  return <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Lav</span>;
}

function DocStatusCell({ status }: { status: InvestorRow['documentationStatus'] }) {
  if (status === 'Mangler dokumentasjon') {
    return (
      <span
        className="status-badge status-badge--critical"
        title="KYC-dokumentasjon mangler helt — legitimasjon, kildeformue og/eller PEP-erklæring er ikke registrert"
      >
        KYC mangler
      </span>
    );
  }
  if (status === 'Mangler oppdatering') {
    return (
      <span
        className="status-badge status-badge--warning"
        title="KYC-dokumentasjon er utdatert — legitimasjon eller kildeformue må fornyes"
      >
        KYC utdatert
      </span>
    );
  }
  return <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>KYC OK</span>;
}

function ReviewStatusCell({
  reviewStatus,
  nextReviewLabel,
}: {
  reviewStatus: InvestorRow['reviewStatus'];
  nextReviewLabel: string;
}) {
  if (reviewStatus === 'Forfalt') {
    return (
      <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
        <div style={{ color: '#111827' }}>{nextReviewLabel}</div>
        <span className="status-badge status-badge--critical">Forfalt</span>
      </div>
    );
  }
  if (reviewStatus === 'Forfaller snart') {
    return (
      <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
        <div style={{ color: '#111827' }}>{nextReviewLabel}</div>
        <span className="status-badge status-badge--warning">Forfaller snart</span>
      </div>
    );
  }
  // Planlagt: vis kun datoen – ingen badge nødvendig
  return (
    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{nextReviewLabel}</span>
  );
}

function ComplianceInvestorsView({ pageData }: ComplianceInvestorsViewProps) {
  const initialRows = useMemo(() => buildRows(pageData), [pageData]);
  const [rows, setRows] = useState<InvestorRow[]>(initialRows);
  const [activeFilter, setActiveFilter] = useState<InvestorFilter>('alle');
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [pendingReviewId, setPendingReviewId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const pickerItems: InvestorPickerItem[] = useMemo(
    () =>
      rows.map((r) => ({
        id: r.customerId,
        label: r.investorName,
        secondaryLabel: r.customerId,
      })),
    [rows],
  );

  const visibleRows = useMemo(() => {
    const baseRows = selectedInvestorId
      ? rows.filter((r) => r.customerId === selectedInvestorId)
      : rows.filter((r) => matchesFilter(r, activeFilter));
    return baseRows;
  }, [rows, activeFilter, selectedInvestorId]);

  /**
   * Åpner bekreftelsespanelet for en rad. Lukker eventuelle andre åpne paneler.
   */
  function handleRequestReview(customerId: string) {
    setPendingReviewId((current) => (current === customerId ? null : customerId));
  }

  /**
   * Bekreftet av bruker: registrerer KYC/AML-gjennomgangen som fullført.
   * Oppdaterer reviewStatus, kontrolldatoer, AML-risikonivå og dokumentasjonsstatus.
   * En fullført gjennomgang bekrefter at alle KYC-krav er oppfylt og at
   * AML-risikovurderingen er vurdert og tilbakestilt.
   */
  function handleConfirmReview(customerId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.customerId !== customerId
          ? r
          : {
              ...r,
              lastReviewLabel: '30.03.2026',
              nextReviewLabel: '30.03.2027',
              reviewStatus: 'Planlagt',
              amlRiskLevel: 'Lav',
              documentationStatus: 'Komplett',
            },
      ),
    );
    setCompletedIds((prev) => (prev.includes(customerId) ? prev : [...prev, customerId]));
    setPendingReviewId(null);
  }

  const overdueCount = rows.filter((r) => r.reviewStatus === 'Forfalt').length;
  const highRiskCount = rows.filter((r) => r.amlRiskLevel === 'Høy').length;
  const missingDataCount = rows.filter(hasMissingData).length;

  return (
    <section className="feature-section feature-section--classification">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Investorer</p>
            <h2 className="feature-section__title">Investoroversikt</h2>
            <p className="feature-section__description">
              Samlet oversikt over alle investorer med AML-risiko, dokumentasjonsstatus og
              kontrollfrist.
            </p>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-6 col-xl-3">
            <article className="summary-card h-100">
              <p className="summary-card__label">Investorer totalt</p>
              <p className="summary-card__value">{rows.length}</p>
            </article>
          </div>
          <div className="col-6 col-xl-3">
            <article className="summary-card summary-card--critical h-100">
              <p className="summary-card__label">Forfalte kontroller</p>
              <p className="summary-card__value">{overdueCount}</p>
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
              <p className="summary-card__label">Mangler data</p>
              <p className="summary-card__value">{missingDataCount}</p>
            </article>
          </div>
        </div>

        <div className="data-table-card compliance-registry__table-card">
          <div className="compliance-registry__toolbar">
            <div className="queue-filter-row compliance-registry__filters">
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`queue-filter${activeFilter === opt.id ? ' queue-filter--active' : ''}`}
                  onClick={() => {
                    setActiveFilter(opt.id);
                    setSelectedInvestorId('');
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <label className="compliance-registry__search">
              <InvestorPicker
                items={pickerItems}
                selectedId={selectedInvestorId}
                onSelect={(id) => {
                  setSelectedInvestorId(id);
                  if (!id) setActiveFilter('alle');
                }}
                placeholder="Søk på investor..."
                ariaLabel="Søk i investoroversikten"
                emptyText="Ingen investorer matcher søket."
              />
            </label>
          </div>

          <p className="compliance-registry__results">
            Viser {visibleRows.length} av {rows.length} investorer
          </p>

          <div className="table-responsive table-scroll compliance-registry__table-scroll">
            <table className="data-table table align-middle mb-0 compliance-registry__table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Næring</th>
                  <th>AML-risiko</th>
                  <th>KYC-status</th>
                  <th>Neste kontroll</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  // Knappen gjelder AML/PEP-kontrollen — ikke dokumentasjon eller næring.
                  const canMarkReviewed =
                    row.reviewStatus === 'Forfalt' || row.reviewStatus === 'Forfaller snart';
                  const isConfirming = pendingReviewId === row.customerId;
                  const isCompleted = completedIds.includes(row.customerId);

                  return (
                    <React.Fragment key={row.customerId}>
                      <tr>
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
                            <span>{row.investorType}</span>
                          </div>
                        </td>

                        <td>
                          {row.industryGroup ?? (
                            <span
                              className="status-badge status-badge--warning"
                              title="Næringsgruppe er ikke registrert"
                            >
                              Ikke registrert
                            </span>
                          )}
                        </td>

                        <td>
                          <AmlRiskCell level={row.amlRiskLevel} />
                        </td>

                        <td>
                          <DocStatusCell status={row.documentationStatus} />
                        </td>

                        <td>
                          <ReviewStatusCell
                            reviewStatus={row.reviewStatus}
                            nextReviewLabel={row.nextReviewLabel}
                          />
                        </td>

                        <td style={{ whiteSpace: 'nowrap' }}>
                          {isCompleted ? (
                            <span className="status-badge status-badge--ok">Gjennomført</span>
                          ) : canMarkReviewed ? (
                            <button
                              type="button"
                              className={`queue-action queue-action--primary${isConfirming ? ' queue-action--active' : ''}`}
                              onClick={() => handleRequestReview(row.customerId)}
                              aria-expanded={isConfirming}
                            >
                              Marker gjennomført
                            </button>
                          ) : null}
                        </td>
                      </tr>

                      {isConfirming && (
                        <tr key={`${row.customerId}-confirm`}>
                          <td
                            colSpan={6}
                            style={{ padding: 0, borderTop: 'none' }}
                          >
                            <div className="aml-review-popover" role="region" aria-label="Bekreft kontrollregistrering">
                              <div className="aml-review-popover__header">
                                <div>
                                  <p className="aml-review-popover__eyebrow">
                                    Bekreft KYC/AML-gjennomgang
                                  </p>
                                  <p style={{ margin: '0 0 0.3rem', fontWeight: 600, color: '#111827' }}>
                                    {row.investorName}
                                  </p>
                                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.5 }}>
                                    Registrerer fullført gjennomgang. Følgende oppdateres:
                                  </p>
                                  <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem', fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.7 }}>
                                    <li>Kontrolldato settes til <strong>30.03.2026</strong>, neste frist <strong>30.03.2027</strong></li>
                                    <li>AML-risikonivå bekreftes som <strong>Lav</strong></li>
                                    <li>KYC-dokumentasjon bekreftes som <strong>Komplett</strong></li>
                                  </ul>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'flex-start' }}>
                                  <button
                                    type="button"
                                    className="queue-action"
                                    onClick={() => setPendingReviewId(null)}
                                  >
                                    Avbryt
                                  </button>
                                  <button
                                    type="button"
                                    className="queue-action queue-action--primary"
                                    onClick={() => handleConfirmReview(row.customerId)}
                                  >
                                    Bekreft
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="compliance-registry__empty">
                      Ingen investorer matcher det valgte filteret.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ComplianceInvestorsView;
