import ComplianceActivityPanel from '../components/ComplianceActivityPanel';
import ComplianceStatGrid from '../components/ComplianceStatGrid';
import InvestorClassificationSection from '../components/InvestorClassificationSection';
import { getComplianceOverviewStats } from '../lib/getComplianceOverviewStats';
import { getInvestorClassificationOverview } from '../lib/getInvestorClassificationOverview';
import { complianceOverviewMock } from '../mocks/complianceOverview';

function CompliancePage() {
  const stats = getComplianceOverviewStats(complianceOverviewMock);
  const investorClassificationOverview = getInvestorClassificationOverview();

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
      <InvestorClassificationSection overview={investorClassificationOverview} />
    </div>
  );
}

export default CompliancePage;
