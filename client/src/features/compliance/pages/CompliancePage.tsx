import { useEffect, useState } from 'react';
import ComplianceAmlPepView from '../components/ComplianceAmlPepView';
import ComplianceClassificationView from '../components/ComplianceClassificationView';
import ComplianceIncidentsPageView from '../components/ComplianceIncidentsPageView';
import ComplianceOverviewView from '../components/ComplianceOverviewView';
import ComplianceReportingView from '../components/ComplianceReportingView';
import ComplianceSubnav from '../components/ComplianceSubnav';
import { getCompliancePageData } from '../lib/getCompliancePageData';

const complianceSubnavItems = [
  {
    id: 'oversikt',
    label: 'Oversikt',
    description: '',
  },
  {
    id: 'rapportering',
    label: 'Rapportering',
    description: '',
  },
  {
    id: 'aml-pep',
    label: 'AML og PEP',
    description: '',
  },
  {
    id: 'klassifisering',
    label: 'Investorstatus',
    description: '',
  },
  {
    id: 'brudd-og-avvik',
    label: 'Brudd og avvik',
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

function CompliancePage() {
  const [activeSubpageId, setActiveSubpageId] = useState(
    getComplianceSubpageIdFromHash,
  );
  const pageData = getCompliancePageData();

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
        Fokus på kontroll, frister, manglende data og rapportering.
      </p>

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

      {activeSubpageId === 'rapportering' ? (
        <ComplianceReportingView pageData={pageData} />
      ) : null}

      {activeSubpageId === 'aml-pep' ? (
        <ComplianceAmlPepView pageData={pageData} />
      ) : null}

      {activeSubpageId === 'klassifisering' ? (
        <ComplianceClassificationView pageData={pageData} />
      ) : null}

      {activeSubpageId === 'brudd-og-avvik' ? (
        <ComplianceIncidentsPageView pageData={pageData} />
      ) : null}
    </div>
  );
}

export default CompliancePage;
