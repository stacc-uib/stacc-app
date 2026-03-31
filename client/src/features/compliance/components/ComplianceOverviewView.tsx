import ComplianceDashboardSection from './ComplianceDashboardSection';
import type { CompliancePageData, ComplianceSubpageId } from '../types/compliance';

type ComplianceOverviewViewProps = {
  pageData: CompliancePageData;
  onOpenSubpage: (subpageId: ComplianceSubpageId) => void;
};

function ComplianceOverviewView({
  pageData,
  onOpenSubpage,
}: ComplianceOverviewViewProps) {
  return (
    <ComplianceDashboardSection
      pageData={pageData}
      onOpenSubpage={onOpenSubpage}
    />
  );
}

export default ComplianceOverviewView;
