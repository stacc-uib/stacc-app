import { getAmlPepOverview } from './getAmlPepOverview';
import { getInvestorClassificationOverview } from './getInvestorClassificationOverview';
import { complianceOverviewMock } from '../mocks/complianceOverview';
import type { ComplianceOverviewData } from '../types/compliance';

function formatInvestorCount(count: number, suffix: string) {
  return `${count} ${suffix}`;
}

export function getComplianceOverviewData(): ComplianceOverviewData {
  const investorClassificationOverview = getInvestorClassificationOverview();
  const amlPepOverview = getAmlPepOverview();

  return {
    totalInvestors: investorClassificationOverview.totalInvestors,
    professionalInvestors: investorClassificationOverview.professionalInvestors,
    pepReviewOverdue: amlPepOverview.overdueReviews,
    missingIndustryClassification: investorClassificationOverview.missingIndustryGroup,
    alerts: [
      {
        id: 'alert-1',
        title: 'Forfalte PEP-kontroller',
        description: formatInvestorCount(
          amlPepOverview.overdueReviews,
          'investorer trenger ny PEP-kontroll for neste rapporteringssyklus.',
        ),
        status: amlPepOverview.overdueReviews > 0 ? 'critical' : 'ok',
        dueLabel:
          amlPepOverview.overdueReviews > 0
            ? 'Krever handling na'
            : 'Ingen forfalte kontroller',
      },
      {
        id: 'alert-2',
        title: 'Missing industry group',
        description: formatInvestorCount(
          investorClassificationOverview.missingIndustryGroup,
          'investorer mangler fortsatt pafordret industry group.',
        ),
        status:
          investorClassificationOverview.missingIndustryGroup > 0 ? 'warning' : 'ok',
        dueLabel:
          investorClassificationOverview.missingIndustryGroup > 0
            ? 'Rapportering til Finanstilsynet'
            : 'Klassifisering er oppdatert',
      },
      {
        id: 'alert-3',
        title: 'Avstemming av skattedata',
        description: 'Markedsverdier ved arsslutt er avstemt for alle tre fond.',
        status: 'ok',
        dueLabel: 'Fullfort denne maneden',
      },
    ],
    reportingRuns: complianceOverviewMock.reportingRuns,
    tasks: complianceOverviewMock.tasks,
  };
}
