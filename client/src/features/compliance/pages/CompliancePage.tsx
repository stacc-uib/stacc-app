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
    description: 'Samlet startside for CCO med nøkkeltall, varsler og oppgaver.',
  },
  {
    id: 'rapportering',
    label: 'Rapportering',
    description: 'Status for rapporteringsløp, valideringsfunn og neste steg før innsending.',
  },
  {
    id: 'aml-pep',
    label: 'AML og PEP',
    description: 'Oppfølging av risikonivå, dokumentasjon og kommende eller forfalte kontroller.',
  },
  {
    id: 'klassifisering',
    label: 'Investorstatus',
    description: 'Kontroll på investorstatus, næringsgrupper og viktige avvik i kunderegisteret.',
  },
  {
    id: 'brudd-og-avvik',
    label: 'Brudd og avvik',
    description: 'Arbeidsområde for registrering, eierskap og lukking av avvikssaker.',
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
        CCO området for oversikt, rapportering og kontroll.
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
