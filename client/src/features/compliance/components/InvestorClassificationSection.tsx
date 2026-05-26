import { useMemo, useState } from 'react';
import InvestorPicker from '../../../shared/components/InvestorPicker';
import type { InvestorPickerItem } from '../../../shared/components/InvestorPicker';
import type {
  CompliancePageData,
  InvestorClassificationStatus,
} from '../types/compliance';

type InvestorClassificationSectionProps = {
  pageData: CompliancePageData;
};

type RegistryFilter = 'alle' | 'mangler-data' | 'pep-oppfolging' | 'ikke-profesjonelle';

type InvestorRegistryRow = {
  customerId: string;
  investorName: string;
  investorType: string;
  investorClass: string;
  pepStatus: 'Ja' | 'Nei';
  lastPepCheckLabel: string;
  nextPepCheckLabel: string;
  industryGroup: CompliancePageData['investorClassification']['rows'][number]['industryGroup'];
  complianceStatus: InvestorClassificationStatus;
  missingFields: string[];
  reportingReadiness: 'Klar' | 'Mangler data';
};

const statusLabelByType: Record<InvestorClassificationStatus, string> = {
  ok: 'Klar',
  'mangler-naering': 'Mangler næringsgruppe',
  'pep-forfaller-snart': 'PEP forfaller snart',
  'pep-forfalt': 'PEP forfalt',
  'ikke-profesjonell': 'Begrenset adgang',
};

const filterOptions: { id: RegistryFilter; label: string }[] = [
  { id: 'alle', label: 'Alle investorer' },
  { id: 'mangler-data', label: 'Mangler data' },
  { id: 'pep-oppfolging', label: 'PEP-oppfølging' },
  { id: 'ikke-profesjonelle', label: 'Ikke-profesjonelle' },
];

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

function toDateFromLabel(dateLabel: string) {
  const [day, month, year] = dateLabel.split('.').map(Number);
  return new Date(year, month - 1, day);
}

function deriveClassificationStatus(
  investorClass: string,
  industryGroup: InvestorRegistryRow['industryGroup'],
  nextPepCheckLabel: string,
): InvestorClassificationStatus {
  if (investorClass === 'Ikke-profesjonell') {
    return 'ikke-profesjonell';
  }

  if (!industryGroup) {
    return 'mangler-naering';
  }

  const today = new Date('2026-03-30');
  const nextReviewDate = toDateFromLabel(nextPepCheckLabel);
  const diffInDays = Math.ceil(
    (nextReviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays < 0) return 'pep-forfalt';
  if (diffInDays <= 14) return 'pep-forfaller-snart';
  return 'ok';
}

function getRegistryRows(pageData: CompliancePageData): InvestorRegistryRow[] {
  const amlByCustomerId = new Map(
    pageData.amlPep.rows.map((row) => [row.customerId, row]),
  );

  return pageData.investorClassification.rows.map((row) => {
    const amlRow = amlByCustomerId.get(row.customerId);
    const complianceStatus = deriveClassificationStatus(
      row.investorCategory,
      row.industryGroup,
      row.pepNextReviewLabel,
    );
    const missingFields: string[] = [];

    if (!row.industryGroup) missingFields.push('Næring');
    if (amlRow && amlRow.documentationStatus !== 'Komplett') missingFields.push('Dokumentasjon');

    return {
      customerId: row.customerId,
      investorName: row.investorName,
      investorType: row.investorType,
      investorClass: row.investorCategory,
      pepStatus: row.pepStatus,
      lastPepCheckLabel: amlRow?.lastReviewLabel ?? 'Ikke registrert',
      nextPepCheckLabel: row.pepNextReviewLabel,
      industryGroup: row.industryGroup,
      complianceStatus,
      missingFields,
      reportingReadiness: missingFields.length === 0 ? 'Klar' : 'Mangler data',
    };
  });
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

function InvestorClassificationSection({ pageData }: InvestorClassificationSectionProps) {
  const [activeFilter, setActiveFilter] = useState<RegistryFilter>('alle');
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const rows = useMemo(() => getRegistryRows(pageData), [pageData]);

  const investorPickerItems: InvestorPickerItem[] = useMemo(
    () => rows.map((row) => ({ id: row.customerId, label: row.investorName, secondaryLabel: row.customerId })),
    [rows],
  );

  const visibleRows = useMemo(() => {
    if (selectedInvestorId) {
      return rows.filter((row) => row.customerId === selectedInvestorId);
    }

    return rows
      .filter((row) => {
        if (activeFilter === 'mangler-data') return row.missingFields.length > 0;
        if (activeFilter === 'pep-oppfolging') {
          return row.complianceStatus === 'pep-forfalt' || row.complianceStatus === 'pep-forfaller-snart';
        }
        if (activeFilter === 'ikke-profesjonelle') return row.complianceStatus === 'ikke-profesjonell';
        return true;
      })
      .sort((left, right) =>
        toSeverityRank(left.complianceStatus) - toSeverityRank(right.complianceStatus) ||
        left.investorName.localeCompare(right.investorName, 'nb'),
      );
  }, [activeFilter, rows, selectedInvestorId]);

  const missingDataCount = rows.filter((row) => row.missingFields.length > 0).length;
  const pepFollowUpCount = rows.filter(
    (row) => row.complianceStatus === 'pep-forfalt' || row.complianceStatus === 'pep-forfaller-snart',
  ).length;
  const reportingReadyCount = rows.filter((row) => row.reportingReadiness === 'Klar').length;

  return (
    <section className="feature-section feature-section--classification">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Investorregister</p>
            <h2 className="feature-section__title">Klassifisering og etterlevelse</h2>
            <p className="feature-section__description">
              Oversikt over investorer, klassifisering, manglende data og PEP-oppfølging.
            </p>
          </div>
        </div>

        <div className="row g-3 compliance-registry__summary-grid">
          <div className="col-6 col-xl-3">
            <article className="summary-card compliance-registry__summary-card h-100">
              <p className="summary-card__label">Investorer totalt</p>
              <p className="summary-card__value">{rows.length}</p>
            </article>
          </div>
          <div className="col-6 col-xl-3">
            <article className="summary-card summary-card--warning compliance-registry__summary-card h-100">
              <p className="summary-card__label">Mangler opplysninger</p>
              <p className="summary-card__value">{missingDataCount}</p>
            </article>
          </div>
          <div className="col-6 col-xl-3">
            <article className="summary-card summary-card--warning compliance-registry__summary-card h-100">
              <p className="summary-card__label">PEP-oppfølging</p>
              <p className="summary-card__value">{pepFollowUpCount}</p>
            </article>
          </div>
          <div className="col-6 col-xl-3">
            <article className="summary-card summary-card--ok compliance-registry__summary-card h-100">
              <p className="summary-card__label">Klar for rapportering</p>
              <p className="summary-card__value">{reportingReadyCount}</p>
            </article>
          </div>
        </div>

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
                  <th>Kundetype</th>
                  <th>Næring</th>
                  <th>PEP-kontroll</th>
                  <th>Status</th>
                  <th>Mangler</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
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
                        <span>ID {row.customerId}</span>
                      </div>
                    </td>
                    <td>{row.investorType}</td>
                    <td>
                      {row.industryGroup ?? (
                        <span className="status-badge status-badge--warning">Mangler</span>
                      )}
                    </td>
                    <td>
                      {row.pepStatus === 'Ja' ? (
                        <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                          <div>
                            <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>PEP · Forrige </span>
                            {row.lastPepCheckLabel}
                          </div>
                          <div>
                            <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>Neste </span>
                            {row.nextPepCheckLabel}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={getStatusClassName(row.complianceStatus)}>
                        {statusLabelByType[row.complianceStatus]}
                      </span>
                    </td>
                    <td>
                      {row.missingFields.length > 0 ? (
                        <div className="compliance-registry__tag-list">
                          {row.missingFields.map((field) => (
                            <span key={field} className="status-badge status-badge--warning">
                              {field}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="status-badge status-badge--ok">Komplett</span>
                      )}
                    </td>
                  </tr>
                ))}

                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="compliance-registry__empty">
                      Ingen investorer matcher søket eller det valgte filteret.
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

export default InvestorClassificationSection;
