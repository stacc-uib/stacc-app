import { useMemo, useState } from 'react';
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
  industryGroup: string;
  complianceStatus: InvestorClassificationStatus;
  missingFields: string[];
  reportingReadiness: 'Klar' | 'Mangler data';
};

const statusLabelByType: Record<InvestorClassificationStatus, string> = {
  ok: 'Klar',
  'mangler-naering': 'Mangler næring',
  'pep-forfaller-snart': 'PEP forfaller snart',
  'pep-forfalt': 'PEP forfalt',
  'ikke-profesjonell': 'Ikke-profesjonell',
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
    case 'ikke-profesjonell':
      return 'status-badge status-badge--critical';
    case 'mangler-naering':
    case 'pep-forfaller-snart':
      return 'status-badge status-badge--warning';
    default:
      return 'status-badge status-badge--ok';
  }
}

function getReportingReadinessClassName(
  readiness: InvestorRegistryRow['reportingReadiness'],
) {
  return readiness === 'Klar'
    ? 'status-badge status-badge--ok'
    : 'status-badge status-badge--warning';
}

function getRegistryRows(pageData: CompliancePageData): InvestorRegistryRow[] {
  const amlByCustomerId = new Map(
    pageData.amlPep.rows.map((row) => [row.customerId, row]),
  );

  return pageData.investorClassification.rows.map((row) => {
    const amlRow = amlByCustomerId.get(row.customerId);
    const missingFields: string[] = [];

    if (row.industryGroup === 'Mangler') {
      missingFields.push('Næringsgruppe');
    }

    if (amlRow && amlRow.documentationStatus !== 'Komplett') {
      missingFields.push('Dokumentasjon');
    }

    return {
      customerId: row.customerId,
      investorName: row.investorName,
      investorType: row.investorType,
      investorClass: row.investorCategory,
      pepStatus: row.pepStatus,
      lastPepCheckLabel: amlRow?.lastReviewLabel ?? 'Ikke registrert',
      nextPepCheckLabel: row.pepNextReviewLabel,
      industryGroup: row.industryGroup,
      complianceStatus: row.classificationStatus,
      missingFields,
      reportingReadiness: missingFields.length === 0 ? 'Klar' : 'Mangler data',
    };
  });
}

function toSeverityRank(status: InvestorClassificationStatus) {
  switch (status) {
    case 'pep-forfalt':
      return 0;
    case 'mangler-naering':
    case 'pep-forfaller-snart':
      return 1;
    case 'ikke-profesjonell':
      return 2;
    default:
      return 3;
  }
}

function InvestorClassificationSection({
  pageData,
}: InvestorClassificationSectionProps) {
  const [activeFilter, setActiveFilter] = useState<RegistryFilter>('alle');
  const [searchQuery, setSearchQuery] = useState('');

  const rows = useMemo(() => getRegistryRows(pageData), [pageData]);

  const visibleRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return rows
      .filter((row) => {
        if (activeFilter === 'mangler-data' && row.missingFields.length === 0) {
          return false;
        }

        if (
          activeFilter === 'pep-oppfolging' &&
          row.complianceStatus !== 'pep-forfalt' &&
          row.complianceStatus !== 'pep-forfaller-snart'
        ) {
          return false;
        }

        if (
          activeFilter === 'ikke-profesjonelle' &&
          row.complianceStatus !== 'ikke-profesjonell'
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return [
          row.investorName,
          row.investorType,
          row.investorClass,
          row.industryGroup,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        return (
          toSeverityRank(left.complianceStatus) - toSeverityRank(right.complianceStatus) ||
          left.investorName.localeCompare(right.investorName, 'nb')
        );
      });
  }, [activeFilter, rows, searchQuery]);

  const missingDataCount = rows.filter((row) => row.missingFields.length > 0).length;
  const pepFollowUpCount = rows.filter(
    (row) =>
      row.complianceStatus === 'pep-forfalt' ||
      row.complianceStatus === 'pep-forfaller-snart',
  ).length;
  const reportingReadyCount = rows.filter(
    (row) => row.reportingReadiness === 'Klar',
  ).length;

  return (
    <section className="feature-section feature-section--classification">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Investorregister</p>
            <h2 className="feature-section__title">Investor compliance registry</h2>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6 col-xl-3">
            <article className="summary-card h-100">
              <p className="summary-card__label">Investorer i registeret</p>
              <p className="summary-card__value">{rows.length}</p>
            </article>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <article className="summary-card summary-card--warning h-100">
              <p className="summary-card__label">Mangler opplysninger</p>
              <p className="summary-card__value">{missingDataCount}</p>
            </article>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <article className="summary-card summary-card--warning h-100">
              <p className="summary-card__label">PEP-oppfølging</p>
              <p className="summary-card__value">{pepFollowUpCount}</p>
            </article>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <article className="summary-card summary-card--ok h-100">
              <p className="summary-card__label">Klar for rapportering</p>
              <p className="summary-card__value">{reportingReadyCount}</p>
            </article>
          </div>
        </div>

        <div className="data-table-card">
          <div className="data-table-card__header compliance-registry__header">
            <div>
              <h3 className="data-table-card__title">Investorregister</h3>
              <p className="data-table-card__description">
                Se status på investorer
              </p>  
            </div>

            <label className="compliance-registry__search">
              <span>Søk i registeret</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Navn, type, klasse eller næringsgruppe"
              />
            </label>
          </div>

          <div className="queue-filter-row">
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

          <div className="table-responsive table-scroll">
            <table className="data-table data-table--wide-first-column table align-middle mb-0">
              <thead>
                <tr>
                  <th>Investor</th>
                  <th>Kundetype</th>
                  <th>Kategori</th>
                  <th>PEP</th>
                  <th>Siste PEP-kontroll</th>
                  <th>Neste PEP-kontroll</th>
                  <th>Næringsgruppe</th>
                  <th>Compliance-status</th>
                  <th>Manglende felt</th>
                  <th>Rapporteringsklar</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.customerId}>
                    <td>
                      <div className="table-primary-cell">
                        <strong>{row.investorName}</strong>
                        <span>Kunde-ID {row.customerId}</span>
                      </div>
                    </td>
                    <td>{row.investorType}</td>
                    <td>{row.investorClass}</td>
                    <td>{row.pepStatus}</td>
                    <td>{row.lastPepCheckLabel}</td>
                    <td>{row.nextPepCheckLabel}</td>
                    <td>{row.industryGroup}</td>
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
                    <td>
                      <span
                        className={getReportingReadinessClassName(row.reportingReadiness)}
                      >
                        {row.reportingReadiness}
                      </span>
                    </td>
                  </tr>
                ))}

                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="compliance-registry__empty">
                      Ingen investorer matcher søk eller valgt filter.
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
