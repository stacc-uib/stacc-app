import { useMemo, useState } from 'react';
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
  missingData: boolean;
};

const filterOptions: { id: InvestorFilter; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'forfalt', label: 'Forfalt' },
  { id: 'snart', label: 'Forfaller snart' },
  { id: 'hoy-risiko', label: 'Høy risiko' },
  { id: 'mangler-data', label: 'Mangler data' },
];

function severityOf(row: InvestorRow): number {
  if (row.reviewStatus === 'Forfalt' || row.amlRiskLevel === 'Høy') return 0;
  if (row.reviewStatus === 'Forfaller snart' || row.documentationStatus !== 'Komplett') return 1;
  if (row.missingData) return 2;
  return 3;
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
        missingData: !cls.industryGroup || (aml?.documentationStatus ?? 'Komplett') !== 'Komplett',
      } satisfies InvestorRow;
    })
    .sort((a, b) => severityOf(a) - severityOf(b) || a.investorName.localeCompare(b.investorName, 'nb'));
}

function riskBadge(level: InvestorRow['amlRiskLevel']) {
  if (level === 'Høy') return 'status-badge status-badge--critical';
  if (level === 'Medium') return 'status-badge status-badge--warning';
  return 'status-badge status-badge--ok';
}

function docBadge(status: InvestorRow['documentationStatus']) {
  if (status === 'Mangler dokumentasjon') return 'status-badge status-badge--critical';
  if (status === 'Mangler oppdatering') return 'status-badge status-badge--warning';
  return 'status-badge status-badge--ok';
}

function reviewBadge(status: InvestorRow['reviewStatus']) {
  if (status === 'Forfalt') return 'status-badge status-badge--critical';
  if (status === 'Forfaller snart') return 'status-badge status-badge--warning';
  return 'status-badge status-badge--ok';
}

function ComplianceInvestorsView({ pageData }: ComplianceInvestorsViewProps) {
  const allRows = useMemo(() => buildRows(pageData), [pageData]);
  const [rows, setRows] = useState<InvestorRow[]>(allRows);
  const [updatedIds, setUpdatedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<InvestorFilter>('alle');
  const [selectedInvestorId, setSelectedInvestorId] = useState('');

  const pickerItems: InvestorPickerItem[] = useMemo(
    () => rows.map((r) => ({ id: r.customerId, label: r.investorName, secondaryLabel: r.customerId })),
    [rows],
  );

  const visibleRows = useMemo(() => {
    if (selectedInvestorId) {
      return rows.filter((r) => r.customerId === selectedInvestorId);
    }
    return rows.filter((r) => {
      if (activeFilter === 'forfalt') return r.reviewStatus === 'Forfalt';
      if (activeFilter === 'snart') return r.reviewStatus === 'Forfaller snart';
      if (activeFilter === 'hoy-risiko') return r.amlRiskLevel === 'Høy';
      if (activeFilter === 'mangler-data') return r.missingData;
      return true;
    });
  }, [rows, activeFilter, selectedInvestorId]);

  function handleUpdate(customerId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.customerId === customerId
          ? {
              ...r,
              lastReviewLabel: '31.03.2026',
              nextReviewLabel: '31.03.2027',
              reviewStatus: 'Planlagt',
              documentationStatus:
                r.documentationStatus === 'Mangler dokumentasjon'
                  ? 'Mangler oppdatering'
                  : 'Komplett',
              missingData: !r.industryGroup,
            }
          : r,
      ),
    );
    setUpdatedIds((prev) => (prev.includes(customerId) ? prev : [...prev, customerId]));
  }

  const overdueCount = rows.filter((r) => r.reviewStatus === 'Forfalt').length;
  const highRiskCount = rows.filter((r) => r.amlRiskLevel === 'Høy').length;
  const missingDataCount = rows.filter((r) => r.missingData).length;

  return (
    <section className="feature-section feature-section--classification">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Investorer</p>
            <h2 className="feature-section__title">Investoroversikt</h2>
            <p className="feature-section__description">
              Samlet oversikt over alle investorer med AML-risiko, dokumentasjonsstatus og
              neste kontrollfrist.
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
                  <th>Dokumentasjon</th>
                  <th>Neste kontroll</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const isUpdated = updatedIds.includes(row.customerId);
                  const needsAction =
                    !isUpdated &&
                    (row.reviewStatus !== 'Planlagt' || row.documentationStatus !== 'Komplett');

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
                          <span>
                            {row.investorType}
                            {row.pepStatus === 'Ja' && (
                              <span
                                className="status-badge status-badge--critical"
                                style={{ marginLeft: '0.4rem' }}
                              >
                                PEP
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        {row.industryGroup ?? (
                          <span className="status-badge status-badge--warning">Mangler</span>
                        )}
                      </td>
                      <td>
                        <span className={riskBadge(row.amlRiskLevel)}>{row.amlRiskLevel}</span>
                      </td>
                      <td>
                        <span className={docBadge(row.documentationStatus)}>
                          {row.documentationStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                          <div>{row.nextReviewLabel}</div>
                          <span className={reviewBadge(row.reviewStatus)}>
                            {row.reviewStatus}
                          </span>
                        </div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isUpdated ? (
                          <span className="status-badge status-badge--ok">Oppdatert</span>
                        ) : needsAction ? (
                          <button
                            type="button"
                            className="queue-action queue-action--primary"
                            onClick={() => handleUpdate(row.customerId)}
                          >
                            Oppdater
                          </button>
                        ) : null}
                      </td>
                    </tr>
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
