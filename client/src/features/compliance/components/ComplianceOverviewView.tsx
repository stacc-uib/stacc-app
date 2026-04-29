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
    <div className="compliance-overview">
      {/* Prioritized tasks (arbeidsflate) */}
      <ComplianceWorkQueueSection
        overview={pageData.workQueue}
        onOpenSubpage={onOpenSubpage}
      />

      {/* Reporting pipeline status + calendar */}
      <ReportingWorkspaceSection
        overview={pageData.reportingWorkspace}
        calendar={pageData.calendar}
      />
    </div>
  );
}

export default ComplianceOverviewView;
