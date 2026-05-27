import investors from '../../../mocks/investors.json';
import { investorComplianceDetails } from '../mocks/investorComplianceDetails';
import { formatDateLabel } from '../../../shared/utils/formatDateLabel';
import type { AmlPepFollowUpRow, AmlPepOverview } from '../types/compliance';

type InvestorRecord = {
  customerId: string;
  name: string;
};
function getReviewStatus(nextReviewDate: string): AmlPepFollowUpRow['reviewStatus'] {
  const today = new Date('2026-05-27');
  const reviewDate = new Date(nextReviewDate);
  const diffInDays = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return 'Forfalt';
  }

  if (diffInDays <= 14) {
    return 'Forfaller snart';
  }

  return 'Planlagt';
}

export function getAmlPepOverview(): AmlPepOverview {
  const investorByCustomerId = new Map(
    (investors as InvestorRecord[]).map((investor) => [investor.customerId, investor]),
  );

  const rows = investorComplianceDetails
    .map((detail) => {
      const investor = investorByCustomerId.get(detail.customerId);

      if (!investor) {
        return null;
      }

      return {
        customerId: detail.customerId,
        investorName: investor.name,
        pepStatus: detail.pepStatus ? 'Ja' : 'Nei',
        amlRiskLevel: detail.amlRiskLevel,
        documentationStatus: detail.documentationStatus,
        lastReviewLabel: formatDateLabel(detail.pepLastReviewDate),
        nextReviewLabel: formatDateLabel(detail.pepNextReviewDate),
        reviewStatus: getReviewStatus(detail.pepNextReviewDate),
      } satisfies AmlPepFollowUpRow;
    })
    .filter((row): row is AmlPepFollowUpRow => row !== null)
    .sort((left, right) => {
      const statusRank = {
        Forfalt: 0,
        'Forfaller snart': 1,
        Planlagt: 2,
      };

      return (
        statusRank[left.reviewStatus] - statusRank[right.reviewStatus] ||
        right.amlRiskLevel.localeCompare(left.amlRiskLevel, 'nb') ||
        left.investorName.localeCompare(right.investorName, 'nb')
      );
    });

  return {
    overdueReviews: rows.filter((row) => row.reviewStatus === 'Forfalt').length,
    dueSoonReviews: rows.filter((row) => row.reviewStatus === 'Forfaller snart').length,
    highRiskInvestors: rows.filter((row) => row.amlRiskLevel === 'Høy').length,
    missingDocumentation: rows.filter(
      (row) => row.documentationStatus === 'Mangler dokumentasjon',
    ).length,
    rows,
  };
}
