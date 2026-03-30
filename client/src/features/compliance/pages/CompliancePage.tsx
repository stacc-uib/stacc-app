import AmlPepMonitoringSection from '../components/AmlPepMonitoringSection';
import ComplianceActivityPanel from '../components/ComplianceActivityPanel';
import ComplianceStatGrid from '../components/ComplianceStatGrid';
import InvestorClassificationSection from '../components/InvestorClassificationSection';
import ReportingWorkspaceSection from '../components/ReportingWorkspaceSection';
import { getAmlPepOverview } from '../lib/getAmlPepOverview';
import { getComplianceOverviewData } from '../lib/getComplianceOverviewData';
import { getComplianceOverviewStats } from '../lib/getComplianceOverviewStats';
import { getInvestorClassificationOverview } from '../lib/getInvestorClassificationOverview';
import { reportingWorkspaceMock } from '../mocks/reportingWorkspace';

function CompliancePage() {
  const complianceOverview = getComplianceOverviewData();
  const stats = getComplianceOverviewStats(complianceOverview);
  const investorClassificationOverview = getInvestorClassificationOverview();
  const amlPepOverview = getAmlPepOverview();

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Rapporter og compliance</p>
      <h1>Compliance</h1>
      <ComplianceStatGrid stats={stats} />
      <ComplianceActivityPanel
        alerts={complianceOverview.alerts}
        reportingRuns={complianceOverview.reportingRuns}
        tasks={complianceOverview.tasks}
      />
      <ReportingWorkspaceSection overview={reportingWorkspaceMock} />
      <AmlPepMonitoringSection overview={amlPepOverview} />
      <InvestorClassificationSection overview={investorClassificationOverview} />
    </div>
  );
}

export default CompliancePage;
