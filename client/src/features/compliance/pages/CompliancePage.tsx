import { useEffect, useState } from 'react';
import ComplianceInvestorsView from '../components/ComplianceInvestorsView';
import ComplianceOverviewView from '../components/ComplianceOverviewView';
import ComplianceSubnav from '../components/ComplianceSubnav';
import { getCompliancePageData } from '../lib/getCompliancePageData';
import { getComplianceDashboardData } from '../lib/getComplianceDashboardData';

const complianceSubnavItems = [
  {
    id: 'oversikt',
    label: 'Arbeidsflate',
    description: '',
  },
  {
    id: 'investorer',
    label: 'Investorer',
    description: '',
  },
] as const;

function getComplianceSubpageIdFromHash() {
  const hash = window.location.hash.replace(/^#/, '');
  const [, subpageId] = hash.split('/');

  return complianceSubnavItems.some((item) => item.id === subpageId)
    ? subpageId
    : 'oversikt';
}

function getMetricClassName(tone?: 'ok' | 'warning' | 'critical') {
  if (tone === 'critical') return 'status-badge status-badge--critical';
  if (tone === 'warning') return 'status-badge status-badge--warning';
  if (tone === 'ok') return 'status-badge status-badge--ok';
  return 'status-badge status-badge--neutral';
}

function CompliancePage() {
  const [activeSubpageId, setActiveSubpageId] = useState(
    getComplianceSubpageIdFromHash,
  );
  const pageData = getCompliancePageData();
  const dashboard = getComplianceDashboardData(pageData);

  // Next upcoming calendar deadline
  const nextDeadline = pageData.calendar.events
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  useEffect(() => {
    const handleHashChange = () => {
      setActiveSubpageId(getComplianceSubpageIdFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  function handleSubpageSelect(nextSubpageId: string) {
    window.location.hash = `#rapporter/${nextSubpageId}`;
  }

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Rapporter og compliance</p>
      <h1>Compliance</h1>
      <p className="content-card__description">
        Status, frister og prioriterte oppgaver på tvers av AML, rapportering og investorregister.
      </p>

      {/* Persistent summary bar — cross-cutting statuses above tabs */}
      <section className="compliance-overview__statusbar">
        {dashboard.metrics.map((metric) => (
          <div key={metric.id} className="compliance-overview__stat">
            <span className="compliance-overview__stat-value">
              {metric.value}
            </span>
            <span className="compliance-overview__stat-label">{metric.label}</span>
            <span className={getMetricClassName(metric.tone)}>
              {metric.tone === 'critical'
                ? 'Kritisk'
                : metric.tone === 'warning'
                  ? 'Avvik'
                  : 'OK'}
            </span>
          </div>
        ))}

        {nextDeadline ? (
          <div className="compliance-overview__stat compliance-overview__stat--deadline">
            <span className="compliance-overview__stat-value">
              {nextDeadline.dateLabel}
            </span>
            <span className="compliance-overview__stat-label">Neste frist</span>
            <span className="status-badge status-badge--neutral">
              {nextDeadline.title}
            </span>
          </div>
        ) : null}
      </section>

      <ComplianceSubnav
        items={[...complianceSubnavItems]}
        activeItemId={activeSubpageId}
        onSelect={handleSubpageSelect}
      />

      {activeSubpageId === 'oversikt' ? (
        <ComplianceOverviewView
          pageData={pageData}
          onOpenSubpage={handleSubpageSelect}
        />
      ) : null}

      {activeSubpageId === 'investorer' ? (
        <ComplianceInvestorsView pageData={pageData} />
      ) : null}
    </div>
  );
}

export default CompliancePage;
