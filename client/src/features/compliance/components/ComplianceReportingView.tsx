import ReportingWorkspaceSection from './ReportingWorkspaceSection';
import type { CompliancePageData } from '../types/compliance';

type ComplianceReportingViewProps = {
  pageData: CompliancePageData;
};

function ComplianceReportingView({ pageData }: ComplianceReportingViewProps) {
  return <ReportingWorkspaceSection overview={pageData.reportingWorkspace} />;
}

export default ComplianceReportingView;
