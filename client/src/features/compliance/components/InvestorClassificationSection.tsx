import { useMemo, useState } from 'react';
import InvestorPicker from '../../../shared/components/InvestorPicker';
import type { InvestorPickerItem } from '../../../shared/components/InvestorPicker';
import { getClassificationStatus } from '../../../shared/lib/getClassificationStatus';
import type {
  CompliancePageData,
  IndustryClassificationOption,
  InvestorClassificationStatus,
} from '../types/compliance';
import { industryClassificationOptions } from '../types/compliance';
import AmlPepMonitoringSection from './AmlPepMonitoringSection';

type InvestorClassificationSectionProps = {
  pageData: CompliancePageData;
  initialSelectedId?: string;
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

function toDateFromLabel(dateLabel: string) {
  const [day, month, year] = dateLabel.split('.').map(Number);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function deriveClassificationStatus(
  investorClass: string,
  industryGroup: InvestorRegistryRow['industryGroup'],
  nextPepCheckLabel: string,
): InvestorClassificationStatus {
  return getClassificationStatus(
    investorClass === 'Profesjonell',
    industryGroup,
    toDateFromLabel(nextPepCheckLabel),
  );
}

function getRegistryRows(
  pageData: CompliancePageData,
): InvestorRegistryRow[] {
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

    if (!row.industryGroup) {
      missingFields.push('Næring');
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
      complianceStatus,
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

type IndustryGroupCellProps = {
  customerId: string;
  onSave: (customerId: string, value: IndustryClassificationOption) => void;
};

function IndustryGroupCell({ customerId, onSave }: IndustryGroupCellProps) {
  const [selected, setSelected] = useState<IndustryClassificationOption | ''>('');

  return (
    <div className="industry-group-edit">
      <select
        className="industry-group-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value as IndustryClassificationOption | '')}
        aria-label="Velg næringsgruppe"
      >
        <option value="">Velg næring...</option>
        {industryClassificationOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {selected ? (
        <button
          type="button"
          className="industry-group-save"
          onClick={() => onSave(customerId, selected)}
        >
          Lagre
        </button>
      ) : null}
    </div>
  );
}

function InvestorClassificationSection({
  pageData,
  initialSelectedId = '',
}: InvestorClassificationSectionProps) {
  const [activeFilter, setActiveFilter] = useState<RegistryFilter>('alle');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvestorId, setSelectedInvestorId] = useState(initialSelectedId);
  const [industryGroupOverrides, setIndustryGroupOverrides] = useState<Record<string, IndustryClassificationOption>>({});

  const rawRows = useMemo(() => getRegistryRows(pageData), [pageData]);

  const rows = useMemo(() => {
    if (Object.keys(industryGroupOverrides).length === 0) return rawRows;
    return rawRows.map((row) => {
      const override = industryGroupOverrides[row.customerId];
      if (!override) return row;
      const newStatus = deriveClassificationStatus(row.investorClass, override, row.nextPepCheckLabel);
      const newMissingFields = row.missingFields.filter((f) => f !== 'Næring');
      return {
        ...row,
        industryGroup: override,
        complianceStatus: newStatus,
        missingFields: newMissingFields,
        reportingReadiness: newMissingFields.length === 0 ? 'Klar' as const : 'Mangler data' as const,
      };
    });
  }, [rawRows, industryGroupOverrides]);

  function handleIndustrySave(customerId: string, value: IndustryClassificationOption) {
    setIndustryGroupOverrides((prev) => ({ ...prev, [customerId]: value }));
  }

  const investorPickerItems: InvestorPickerItem[] = useMemo(
    () =>
      rows.map((row) => ({
        id: row.customerId,
        label: row.investorName,
        secondaryLabel: row.customerId,
      })),
    [rows],
  );

  const visibleRows = useMemo(() => {
    if (selectedInvestorId) {
      return rows.filter((row) => row.customerId === selectedInvestorId);
    }

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
          row.industryGroup ?? '',
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .sort((left, right) => {
        return (
          toSeverityRank(left.complianceStatus) - toSeverityRank(right.complianceStatus) ||
          left.investorName.localeCompare(right.investorName, 'nb')
        );
      });
  }, [activeFilter, rows, searchQuery, selectedInvestorId]);

  return (
    <>
      <section className="feature-section feature-section--classification">
        <div className="feature-section__surface">
          <div className="feature-section__header">
            <div>
              <h2 className="feature-section__title">Investorregister</h2>
              <p className="feature-section__description">
                Oversikt over klassifisering, manglende data og PEP-oppfølging.
                Investorer som mangler næringsgruppe kan oppdateres direkte i tabellen.
              </p>
            </div>
          </div>

          <div className="row g-3 compliance-registry__summary-grid">
            <div className="col-12 col-md-6 col-xl-4">
              <article className="summary-card compliance-registry__summary-card h-100">
                <p className="summary-card__label">Investorer i registeret</p>
                <p className="summary-card__value">{rows.length}</p>
              </article>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <article className="summary-card summary-card--ok compliance-registry__summary-card h-100">
                <p className="summary-card__label">Profesjonelle</p>
                <p className="summary-card__value">
                  {rows.filter((r) => r.investorClass === 'Profesjonell').length}
                </p>
              </article>
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              <article className="summary-card summary-card--warning compliance-registry__summary-card h-100">
                <p className="summary-card__label">Ikke-profesjonelle</p>
                <p className="summary-card__value">
                  {rows.filter((r) => r.investorClass === 'Ikke-profesjonell').length}
                </p>
              </article>
            </div>
          </div>

          <div className="data-table-card compliance-registry__table-card">
            <div className="data-table-card__header compliance-registry__header">
              <div>
                <h3 className="data-table-card__title">Investorregister</h3>
                <p className="data-table-card__description">
                  Oversikt over investorer, klassifisering og etterlevelsesstatus.
                </p>
              </div>

              <label className="compliance-registry__search">
                <span>Søk i registeret</span>
                <InvestorPicker
                  items={investorPickerItems}
                  selectedId={selectedInvestorId}
                  onSelect={(id) => {
                    setSelectedInvestorId(id);
                    if (!id) setSearchQuery('');
                  }}
                  placeholder="Navn, type, kategori eller næring"
                  ariaLabel="Søk i investorregisteret"
                  emptyText="Ingen investorer matcher søket."
                />
              </label>
            </div>

            <div className="compliance-registry__toolbar">
              <div className="queue-filter-row compliance-registry__filters">
                {filterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`queue-filter compliance-registry__filter${
                      option.id === activeFilter ? ' queue-filter--active' : ''
                    }`}
                    onClick={() => setActiveFilter(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
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
                    <th>Kategori</th>
                    <th>PEP</th>
                    <th>Neste PEP-kontroll</th>
                    <th>Næring</th>
                    <th>Status</th>
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
                              window.location.hash = `#kundeoversikt/${row.customerId}`;
                            }}
                          >
                            <strong>{row.investorName}</strong>
                          </button>
                          <span>Kunde-ID {row.customerId}</span>
                        </div>
                      </td>
                      <td>{row.investorType}</td>
                      <td>{row.investorClass}</td>
                      <td>{row.pepStatus}</td>
                      <td>{row.nextPepCheckLabel}</td>
                      <td>
                        {row.industryGroup ? (
                          row.industryGroup
                        ) : (
                          <IndustryGroupCell
                            customerId={row.customerId}
                            onSave={handleIndustrySave}
                          />
                        )}
                      </td>
                      <td>
                        <span className={getStatusClassName(row.complianceStatus)}>
                          {statusLabelByType[row.complianceStatus]}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="compliance-registry__empty">
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

      <AmlPepMonitoringSection overview={pageData.amlPep} />
    </>
  );
}

export default InvestorClassificationSection;
