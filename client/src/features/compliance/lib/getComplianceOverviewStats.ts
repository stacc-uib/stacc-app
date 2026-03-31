import type { ComplianceOverviewData } from '../types/compliance';

export type ComplianceStat = {
  id: string;
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'critical';
};

export function getComplianceOverviewStats(
  overview: ComplianceOverviewData,
): ComplianceStat[] {
  return [
    {
      id: 'total-investors',
      label: 'Totalt antall investorer',
      value: String(overview.totalInvestors),
    },
    {
      id: 'professional-investors',
      label: 'Profesjonelle investorer',
      value: String(overview.professionalInvestors),
    },
    {
      id: 'pep-review-overdue',
      label: 'Forfalte PEP-kontroller',
      value: String(overview.pepReviewOverdue),
      tone: overview.pepReviewOverdue > 0 ? 'critical' : 'default',
    },
    {
      id: 'missing-industry-classification',
      label: 'Manglende næringsklassifisering',
      value: String(overview.missingIndustryClassification),
      tone: overview.missingIndustryClassification > 0 ? 'warning' : 'default',
    },
  ];
}
