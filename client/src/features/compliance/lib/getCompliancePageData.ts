import { getAmlPepOverview } from './getAmlPepOverview';
import { getComplianceOverviewData } from './getComplianceOverviewData';
import { getInvestorClassificationOverview } from './getInvestorClassificationOverview';
import { complianceCalendarMock } from '../mocks/calendarEvents';
import { incidentsMock } from '../mocks/incidents';
import { reportingWorkspaceMock } from '../mocks/reportingWorkspace';
import type { CompliancePageData } from '../types/compliance';

export function getCompliancePageData(): CompliancePageData {
  const investorClassification = getInvestorClassificationOverview();
  const amlPep = getAmlPepOverview();
  const overview = getComplianceOverviewData();

  return {
    overview,
    investorClassification,
    amlPep,
    reportingWorkspace: reportingWorkspaceMock,
    incidents: incidentsMock,
    calendar: complianceCalendarMock,
  };
}
