import InvestorClassificationSection from './InvestorClassificationSection';
import type { CompliancePageData } from '../types/compliance';

type ComplianceClassificationViewProps = {
  pageData: CompliancePageData;
};

function ComplianceClassificationView({
  pageData,
}: ComplianceClassificationViewProps) {
  return <InvestorClassificationSection pageData={pageData} />;
}

export default ComplianceClassificationView;
