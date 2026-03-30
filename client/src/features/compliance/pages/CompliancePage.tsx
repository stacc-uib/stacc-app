import ComplianceActivityPanel from '../components/ComplianceActivityPanel';
import ComplianceStatGrid from '../components/ComplianceStatGrid';
import { getComplianceOverviewStats } from '../lib/getComplianceOverviewStats';
import { complianceOverviewMock } from '../mocks/complianceOverview';

function CompliancePage() {
  const stats = getComplianceOverviewStats(complianceOverviewMock);

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Rapporter og compliance</p>
      <h1>Compliance</h1>
      <ComplianceStatGrid stats={stats} />
      <ComplianceActivityPanel
        alerts={complianceOverviewMock.alerts}
        reportingRuns={complianceOverviewMock.reportingRuns}
        tasks={complianceOverviewMock.tasks}
      />
    </div>
  );
}

export default CompliancePage;
