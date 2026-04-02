import { useState } from 'react';
import AmlPepMonitoringSection from './AmlPepMonitoringSection';
import InvestorClassificationSection from './InvestorClassificationSection';
import type { CompliancePageData } from '../types/compliance';

type Tab = 'aml-pep' | 'register';

type ComplianceInvestorsViewProps = {
  pageData: CompliancePageData;
};

function ComplianceInvestorsView({ pageData }: ComplianceInvestorsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('aml-pep');

  const overdueCount = pageData.amlPep.overdueReviews;
  const missingDataCount = pageData.investorClassification.rows.filter(
    (row) => row.industryGroup === null,
  ).length;

  return (
    <div className="investors-view">
      <div className="investors-view__tabs">
        <button
          type="button"
          className={`investors-view__tab${activeTab === 'aml-pep' ? ' investors-view__tab--active' : ''}`}
          onClick={() => setActiveTab('aml-pep')}
        >
          AML og PEP
          {overdueCount > 0 ? (
            <span className="investors-view__tab-badge investors-view__tab-badge--critical">
              {overdueCount}
            </span>
          ) : null}
        </button>
        <button
          type="button"
          className={`investors-view__tab${activeTab === 'register' ? ' investors-view__tab--active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          Investorregister
          {missingDataCount > 0 ? (
            <span className="investors-view__tab-badge investors-view__tab-badge--warning">
              {missingDataCount}
            </span>
          ) : null}
        </button>
      </div>

      {activeTab === 'aml-pep' ? (
        <AmlPepMonitoringSection overview={pageData.amlPep} />
      ) : (
        <InvestorClassificationSection pageData={pageData} />
      )}
    </div>
  );
}

export default ComplianceInvestorsView;
