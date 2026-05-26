import { useMemo, useState } from 'react';
import InvestorPicker from '../../../shared/components/InvestorPicker';
import type { InvestorPickerItem } from '../../../shared/components/InvestorPicker';
import type {
  CompliancePageData,
  InvestorClassificationStatus,
} from '../types/compliance';

type ComplianceInvestorsViewProps = {
  pageData: CompliancePageData;
};

type InvestorFilter = 'alle' | 'krever-tiltak' | 'pep' | 'mangler-data';

type InvestorRow = {
  customerId: string;
  investorName: string;
  investorType: string;
  investorClass: string;
  pepStatus: 'Ja' | 'Nei';
  amlRiskLevel: 'Lav' | 'Medium' | 'Høy';
  documentationStatus: 'Komplett' | 'Mangler oppdatering' | 'Mangler dokumentasjon';
  lastPepCheckLabel: string;
  nextPepCheckLabel: string;
  reviewStatus: 'Forfalt' | 'Forfaller snart' | 'Planlagt';
  industryGroup: string | null;
  complianceStatus: InvestorClassificationStatus;
  missingFields: string[];
};

const filterOptions: { id: InvestorFilter; label: string }[] = [
  { id: 'alle', label: 'Alle investorer' },
  { id: 'krever-tiltak', label: 'Krever tiltak' },
  { id: 'pep', label: 'PEP' },
  { id: 'mangler-data', label: 'Mangler data' },
];

const statusLabel: Record<InvestorClassificationStatus, string> = {
  ok: 'OK',
  'mangler-naering': 'Mangler næring',
  'pep-forfaller-snart': 'PEP forfaller snart',
  'pep-forfalt': 'PEP forfalt',
  'ikke-profesjonell': 'Ikke-profesjonell',
};

function getStatusClassName(status: InvestorClassificationStatus) {
  switch (status) {
    case 'pep-forfalt':
      return 'status-badge status-badge--critical';
    case 'mangler-naering':
    case 'pep-forfaller-snart':
      return 'status-badge status-badge--warning';
    case 'ikke-profesjonell':
      return 'status-badge status-badge--neutral';
    default:
      return 'status-badge status-badge--ok';
  }
}

function getAmlClassName(level: InvestorRow['amlRiskLevel']) {
  if (level === 'Høy') return 'status-badge status-badge--critical';
  if (level === 'Medium') return 'status-badge status-badge--warning';
  return 'status-badge status-badge--ok';
}

function toDateFromLabel(dateLabel: string) {
  const [day, month, year] = dateLabel.split('.').map(Number);
  return new Date(year, month - 1, day);
}

function deriveStatus(
  investorClass: string,
  industryGroup: string | null,
  nextPepCheckLabel: string,
): InvestorClassificationStatus {
  if (investorClass === 'Ikke-profesjonell') return 'ikke-profesjonell';
  if (!industryGroup) return 'mangler-naering';

  const today = new Date('2026-03-30');
  const nextDate = toDateFromLabel(nextPepCheckLabel);
  const diffDays = Math.ceil(
    (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return 'pep-forfalt';
  if (diffDays <= 14) return 'pep-forfaller-snart';
  return 'ok';
}

function toSeverityRank(status: InvestorClassificationStatus) {
  switch (status) {
    case 'pep-forfalt': return 0;
    case 'mangler-naering':
    case 'pep-forfaller-snart': return 1;
    case 'ikke-profesjonell': return 2;
    default: return 3;
  }
}

function buildRows(pageData: CompliancePageData): InvestorRow[] {
  const amlByCustomerId = new Map(
    pageData.amlPep.rows.map((row) => [row.customerId, row]),
  );

  return pageData.investorClassification.rows.map((row) => {
    const aml = amlByCustomerId.get(row.customerId);
    const complianceStatus = deriveStatus(
      row.investorCategory,
      row.industryGroup,
      row.pepNextReviewLabel,
    );
    const missingFields: string[] = [];
    if (!row.industryGroup) missingFields.push('Næring');
    if (aml && aml.documentationStatus !== 'Komplett') missingFields.push('Dokumentasjon');

    return {
      customerId: row.customerId,
      investorName: row.investorName,
      investorType: row.investorType,
      investorClass: row.investorCategory,
      pepStatus: row.pepStatus,
      amlRiskLevel: aml?.amlRiskLevel ?? 'Lav',
      documentationStatus: aml?.documentationStatus ?? 'Komplett',
      lastPepCheckLabel: aml?.lastReviewLabel ?? 'Ikke registrert',
      nextPepCheckLabel: row.pepNextReviewLabel,
      reviewStatus: aml?.reviewStatus ?? 'Planlagt',
      industryGroup: row.industryGroup,
      complianceStatus,
      missingFields,
    };
  });
}

function ComplianceInvestorsView({ pageData }: ComplianceInvestorsViewProps) {
  const [activeFilter, setActiveFilter] = useState<InvestorFilter>('alle');
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [updatedIds, setUpdatedIds] = useState<string[]>([]);

  const rows = useMemo(() => buildRows(pageData), [pageData]);

  const investorPickerItems: InvestorPickerItem[] = useMemo(
    () => rows.map((row) => ({ id: row.customerId, label: row.investorName, secondaryLabel: row.customerId })),
    [rows],
  );

  const visibleRows = useMemo(() => {
    let filtered = rows;

    if (selectedInvestorId) {
      return rows.filter((r) => r.customerId === selectedInvestorId);
    }

    if (activeFilter === 'krever-tiltak') {
      filtered = rows.filter(
        (r) => r.complianceStatus === 'pep-forfalt' || r.complianceStatus === 'mangler-naering',
      );
    } else if (activeFilter === 'pep') {
      filtered = rows.filter((r) => r.pepStatus === 'Ja');
    } else if (activeFilter === 'mangler-data') {
      filtered = rows.filter((r) => r.missingFields.length > 0);
    }

    return filtered
      .slice()
      .sort(
        (a, b) =>
          toSeverityRank(a.complianceStatus) - toSeverityRank(b.complianceStatus) ||
          a.investorName.localeCompare(b.investorName, 'nb'),
      );
  }, [activeFilter, rows, selectedInvestorId]);

  // Summary counts
  const requiresActionCount = rows.filter(
    (r) => r.complianceStatus === 'pep-forfalt' || r.complianceStatus === 'mangler-naering',
  ).length;
  const pepCount = rows.filter((r) => r.pepStatus === 'Ja').length;
  const missingDataCount = rows.filter((r) => r.missingFields.length > 0).length;
  const okCount = rows.filter((r) => r.complianceStatus === 'ok').length;

  function handleMarkUpdated(customerId: string) {
    setUpdatedIds((current) =>
      current.includes(customerId) ? current : [...current, customerId],
    );
  }

  return (
    <section className="feature-section feature-section--classification">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Investorer</p>
            <h2 className="feature-section__title">Investorregister</h2>
            <p className="feature-section__description">
              Klassifisering, AML-risiko og PEP-status samlet i én oversikt.
            </p>
          </div>
        </div>

        {/* ── Nøkkeltall ── */}
        <div className="row g-3" style={{ marginBottom: '1rem' }}>
          <div className="col-6 col-md-3">
            <article className="summary-card h-100">
              <p className="summary-card__label">Totalt</p>
              <p className="summary-card__value">{rows.length}</p>
            </article>
          </div>
          <div className="col-6 col-md-3">
            <article className="summary-card summary-card--critical h-100">
              <p className="summary-card__label">Krever tiltak</p>
              <p className="summary-card__value">{requiresActionCount}</p>
            </article>
          </div>
          <div className="col-6 col-md-3">
            <article className="summary-card summary-card--warning h-100">
              <p className="summary-card__label">PEP-investorer</p>
              <p className="summary-card__value">{pepCount}</p>
            </article>
          </div>
          <div className="col-6 col-md-3">
            <article className="summary-card summary-card--ok h-100">
              <p className="summary-card__label">Uten avvik</p>
              <p className="summary-card__value">{okCount}</p>
            </article>
          </div>
        </div>

        {/* ── Tabell ── */}
        <div className="data-table-card compliance-registry__table-card">
          <div className="data-table-card__header compliance-registry__header">
            <div className="compliance-registry__toolbar">
              <div className="queue-filter-row compliance-registry__filters">
                {filterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`queue-filter compliance-registry__filter${
                      option.id === activeFilter ? ' queue-filter--active' : ''
                    }`}
                    onClick={() => {
                      setActiveFilter(option.id);
                      setSelectedInvestorId('');
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="compliance-registry__search">
                <InvestorPicker
                  items={investorPickerItems}
                  selectedId={selectedInvestorId}
                  onSelect={(id) => {
                    setSelectedInvestorId(id);
                    if (!id) setActiveFilter('alle');
                  }}
                  placeholder="Søk på investor..."
                  ariaLabel="Søk i investorregisteret"
                  emptyText="Ingen investorer matcher søket."
                />
              </label>
            </div>

            <p className="compliance-registry__results">
              Viser {visibleRows.length} av {rows.length} investorer
            </p>
          </div>

          <div className="table-responsive table-scroll compliance-registry__table-scroll">
            <table className="data-table data-table--wide-first-column table align-middle mb-0 compliance-registry__table">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Type</th>
                  <th>Næring</th>
                  <th>PEP</th>
                  <th>AML-risiko</th>
                  <th>Neste PEP-kontroll</th>
                  <th>Status</th>
                  <th>Handling</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const isUpdated = updatedIds.includes(row.customerId);
                  const needsAction =
                    row.complianceStatus === 'pep-forfalt' ||
                    row.reviewStatus === 'Forfalt' ||
                    row.reviewStatus === 'Forfaller snart';

                  return (
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
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                            {row.investorClass}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{row.investorType}</td>
                      <td>
                        {row.industryGroup ?? (
                          <span className="status-badge status-badge--warning">Mangler</span>
                        )}
                      </td>
                      <td>
                        {row.pepStatus === 'Ja' ? (
                          <span className="status-badge status-badge--critical">Ja</span>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Nei</span>
                        )}
                      </td>
                      <td>
                        <span className={getAmlClassName(row.amlRiskLevel)}>
                          {row.amlRiskLevel}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        <div style={{ lineHeight: 1.5 }}>
                          <div>{row.nextPepCheckLabel}</div>
                          {row.reviewStatus !== 'Planlagt' ? (
                            <span
                              className={
                                row.reviewStatus === 'Forfalt'
                                  ? 'status-badge status-badge--critical'
                                  : 'status-badge status-badge--warning'
                              }
                            >
                              {row.reviewStatus}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={getStatusClassName(row.complianceStatus)}>
                          {isUpdated ? 'Oppdatert' : statusLabel[row.complianceStatus]}
                        </span>
                      </td>
                      <td>
                        {needsAction && !isUpdated ? (
                          <button
                            type="button"
                            className="queue-action queue-action--primary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                            onClick={() => handleMarkUpdated(row.customerId)}
                          >
                            Marker oppdatert
                          </button>
                        ) : isUpdated ? (
                          <span style={{ fontSize: '0.78rem', color: '#16a34a' }}>✓ Oppdatert</span>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="compliance-registry__empty">
                      Ingen investorer matcher valgt filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Dokumentasjonsstatus — kompakt liste for de med mangler ── */}
        {rows.filter((r) => r.documentationStatus !== 'Komplett').length > 0 ? (
          <section className="feature-subsection" style={{ marginTop: '1.5rem' }}>
            <div className="feature-subsection__header">
              <p className="feature-subsection__eyebrow">Dokumentasjon</p>
              <h3 className="feature-subsection__title">
                Investorer med manglende dokumentasjon ({missingDataCount})
              </h3>
            </div>
            <div className="stack-list">
              {rows
                .filter((r) => r.documentationStatus !== 'Komplett')
                .map((row) => (
                  <article key={row.customerId} className="stack-card">
                    <div className="stack-card__row">
                      <div>
                        <button
                          type="button"
                          className="compliance-customer-link"
                          onClick={() => {
                            window.location.hash = `kundeoversikt/${row.customerId}`;
                          }}
                        >
                          <strong>{row.investorName}</strong>
                        </button>
                      </div>
                      <span
                        className={
                          row.documentationStatus === 'Mangler dokumentasjon'
                            ? 'status-badge status-badge--critical'
                            : 'status-badge status-badge--warning'
                        }
                      >
                        {row.documentationStatus}
                      </span>
                    </div>
                    <p className="stack-card__body" style={{ fontSize: '0.82rem' }}>
                      {row.investorType} · AML-risiko: {row.amlRiskLevel}
                    </p>
                  </article>
                ))}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

export default ComplianceInvestorsView;
