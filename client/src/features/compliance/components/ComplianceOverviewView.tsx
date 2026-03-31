import ComplianceCalendarSection from './ComplianceCalendarSection';
import ComplianceStatGrid from './ComplianceStatGrid';
import ComplianceWorkQueueSection from './ComplianceWorkQueueSection';
import type { CompliancePageData, ComplianceSubpageId } from '../types/compliance';
import { getComplianceOverviewStats } from '../lib/getComplianceOverviewStats';

type ComplianceOverviewViewProps = {
  pageData: CompliancePageData;
  onOpenSubpage: (subpageId: ComplianceSubpageId) => void;
};

function ComplianceOverviewView({
  pageData,
  onOpenSubpage,
}: ComplianceOverviewViewProps) {
  const stats = getComplianceOverviewStats(pageData.overview);

  return (
    <>
      <ComplianceStatGrid stats={stats} />
      <ComplianceCalendarSection overview={pageData.calendar} />
      <ComplianceWorkQueueSection
        overview={pageData.workQueue}
        onOpenSubpage={onOpenSubpage}
      />
    </>
  );
}

export default ComplianceOverviewView;
