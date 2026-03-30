import AmlPepMonitoringSection from '../components/AmlPepMonitoringSection';
import ComplianceActivityPanel from '../components/ComplianceActivityPanel';
import ComplianceStatGrid from '../components/ComplianceStatGrid';
import InvestorClassificationSection from '../components/InvestorClassificationSection';
import ReportingWorkspaceSection from '../components/ReportingWorkspaceSection';
import { getComplianceOverviewStats } from '../lib/getComplianceOverviewStats';
import { getCompliancePageData } from '../lib/getCompliancePageData';

function CompliancePage() {
  const pageData = getCompliancePageData();
  const stats = getComplianceOverviewStats(pageData.overview);

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Rapporter og compliance</p>
      <h1>Compliance</h1>
      <ComplianceStatGrid stats={stats} />
      <ComplianceActivityPanel
        alerts={pageData.overview.alerts}
        reportingRuns={pageData.overview.reportingRuns}
        tasks={pageData.overview.tasks}
      />
      <ReportingWorkspaceSection overview={pageData.reportingWorkspace} />
      <AmlPepMonitoringSection overview={pageData.amlPep} />
      <InvestorClassificationSection overview={pageData.investorClassification} />
    </div>
  );
}

export default CompliancePage;
