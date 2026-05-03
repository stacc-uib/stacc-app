import ComplianceWorkQueueSection from './ComplianceWorkQueueSection';
import ReportingWorkspaceSection from './ReportingWorkspaceSection';
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
    <div className="arbeidsflate-layout">
      <ComplianceWorkQueueSection
        overview={pageData.workQueue}
        onOpenSubpage={onOpenSubpage}
      />
      <ReportingWorkspaceSection
        overview={pageData.reportingWorkspace}
        calendar={pageData.calendar}
        onNavigateToInvestors={() => onOpenSubpage('investorer')}
      />
    </div>
  );
}

export default ComplianceOverviewView;
