import ComplianceActivityPanel from './ComplianceActivityPanel';
import ComplianceCalendarSection from './ComplianceCalendarSection';
import ComplianceStatGrid from './ComplianceStatGrid';
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
      <ComplianceActivityPanel
        alerts={pageData.overview.alerts}
        reportingRuns={pageData.overview.reportingRuns}
        tasks={pageData.overview.tasks}
      />
    </>
  );
}

export default ComplianceOverviewView;
