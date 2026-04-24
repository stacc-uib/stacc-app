import InvestorClassificationSection from './InvestorClassificationSection';
import type { CompliancePageData } from '../types/compliance';

type ComplianceInvestorsViewProps = {
  pageData: CompliancePageData;
};

function ComplianceInvestorsView({ pageData }: ComplianceInvestorsViewProps) {
  return (
    <div className="investors-view">
      <InvestorClassificationSection pageData={pageData} />
    </div>
  );
}

export default ComplianceInvestorsView;
