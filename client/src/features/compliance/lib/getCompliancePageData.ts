import { getAmlPepOverview } from './getAmlPepOverview';
import { getComplianceCalendarOverview } from './getComplianceCalendarOverview';
import { getComplianceOverviewData } from './getComplianceOverviewData';
import { getComplianceWorkQueueOverview } from './getComplianceWorkQueueOverview';
import { getInvestorClassificationOverview } from './getInvestorClassificationOverview';
import { incidentsMock } from '../mocks/incidents';
import { reportingWorkspaceMock } from '../mocks/reportingWorkspace';
import type { CompliancePageData } from '../types/compliance';

export function getCompliancePageData(): CompliancePageData {
  const investorClassification = getInvestorClassificationOverview();
  const amlPep = getAmlPepOverview();
  const overview = getComplianceOverviewData();

  const baseData = {
    overview,
    investorClassification,
    amlPep,
    reportingWorkspace: reportingWorkspaceMock,
    incidents: incidentsMock,
  };

  return {
    ...baseData,
    calendar: getComplianceCalendarOverview(),
    workQueue: getComplianceWorkQueueOverview(baseData),
  };
}
