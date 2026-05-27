import { useEffect, useState } from 'react';
import ComplianceInvestorsView from '../components/ComplianceInvestorsView';
import ComplianceOverviewView from '../components/ComplianceOverviewView';
import ComplianceSubnav from '../components/ComplianceSubnav';
import { getCompliancePageData } from '../lib/getCompliancePageData';

const complianceSubnavItems = [
  {
    id: 'oversikt',
    label: 'Oversikt',
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
        Status, frister og prioriterte oppgaver på tvers av AML, rapportering og investorregister.
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

      {activeSubpageId === 'investorer' ? (
        <ComplianceInvestorsView pageData={pageData} />
      ) : null}
    </div>
  );
}

export default CompliancePage;
