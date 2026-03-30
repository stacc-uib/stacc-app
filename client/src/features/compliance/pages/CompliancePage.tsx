import AmlPepMonitoringSection from '../components/AmlPepMonitoringSection';
import ComplianceActivityPanel from '../components/ComplianceActivityPanel';
import ComplianceStatGrid from '../components/ComplianceStatGrid';
import InvestorClassificationSection from '../components/InvestorClassificationSection';
import { getAmlPepOverview } from '../lib/getAmlPepOverview';
import { getComplianceOverviewStats } from '../lib/getComplianceOverviewStats';
import { getInvestorClassificationOverview } from '../lib/getInvestorClassificationOverview';
import { complianceOverviewMock } from '../mocks/complianceOverview';

function CompliancePage() {
  const stats = getComplianceOverviewStats(complianceOverviewMock);
  const investorClassificationOverview = getInvestorClassificationOverview();
  const amlPepOverview = getAmlPepOverview();

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
      <AmlPepMonitoringSection overview={amlPepOverview} />
      <InvestorClassificationSection overview={investorClassificationOverview} />
    </div>
  );
}

export default CompliancePage;
