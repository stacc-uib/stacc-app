import ComplianceCalendarSection from './ComplianceCalendarSection';
import ComplianceStatGrid from './ComplianceStatGrid';
import ComplianceWorkQueueSection from './ComplianceWorkQueueSection';
import type { CompliancePageData } from '../types/compliance';
import { getComplianceOverviewStats } from '../lib/getComplianceOverviewStats';

type ComplianceOverviewViewProps = {
  pageData: CompliancePageData;
};

function ComplianceOverviewView({ pageData }: ComplianceOverviewViewProps) {
  const stats = getComplianceOverviewStats(pageData.overview);

  return (
    <>
      <ComplianceStatGrid stats={stats} />
      <ComplianceCalendarSection overview={pageData.calendar} />
      <ComplianceWorkQueueSection overview={pageData.workQueue} />
    </>
  );
}

export default ComplianceOverviewView;
