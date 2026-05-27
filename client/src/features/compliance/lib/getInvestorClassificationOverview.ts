import investors from '../../../mocks/investors.json';
import { investorComplianceDetails } from '../mocks/investorComplianceDetails';
import { formatDateLabel } from '../../../shared/utils/formatDateLabel';
import type {
  InvestorClassificationOverview,
  InvestorClassificationRow,
  InvestorClassificationStatus,
} from '../types/compliance';

type InvestorRecord = {
  customerId: string;
  name: string;
  customerType: string;
  category: 'Professional' | 'Retail';
};

function getClassificationStatus(
  industryGroup: InvestorClassificationRow['industryGroup'],
  pepNextReviewDate: string,
): InvestorClassificationStatus {
  const today = new Date('2026-05-27');
  const reviewDate = new Date(pepNextReviewDate);
  const diffInDays = Math.ceil(
    (reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (!industryGroup) {
    return 'mangler-naering';
  }

  if (diffInDays < 0) {
    return 'pep-forfalt';
  }

  if (diffInDays <= 14) {
    return 'pep-forfaller-snart';
  }

  return 'ok';
}

function toInvestorCategoryLabel(category: InvestorRecord['category']) {
  return category === 'Professional' ? 'Profesjonell' : 'Retail';
}

export function getInvestorClassificationOverview(): InvestorClassificationOverview {
  const detailByCustomerId = new Map(
    investorComplianceDetails.map((detail) => [detail.customerId, detail]),
  );

  const rows = (investors as InvestorRecord[]).map((investor) => {
    const detail = detailByCustomerId.get(investor.customerId);
    const industryGroup = detail?.industryGroup ?? null;
    const pepNextReviewDate = detail?.pepNextReviewDate ?? '2026-12-31';

    return {
      customerId: investor.customerId,
      investorName: investor.name,
      investorType: investor.customerType,
      investorCategory: toInvestorCategoryLabel(investor.category),
      industryGroup,
      pepStatus: detail?.pepStatus ? 'Ja' : 'Nei',
      pepNextReviewLabel: formatDateLabel(pepNextReviewDate),
      classificationStatus: getClassificationStatus(
        industryGroup,
        pepNextReviewDate,
      ),
    } satisfies InvestorClassificationRow;
  });

  return {
    totalInvestors: rows.length,
    professionalInvestors: rows.filter(
      (row) => row.investorCategory === 'Profesjonell',
    ).length,
    nonProfessionalInvestors: rows.filter(
      (row) => row.investorCategory === 'Retail',
    ).length,
    missingIndustryGroup: rows.filter((row) => row.industryGroup === null).length,
    pepReviewOverdue: rows.filter(
      (row) => row.classificationStatus === 'pep-forfalt',
    ).length,
    rows: rows.sort((left, right) => left.investorName.localeCompare(right.investorName, 'nb')),
  };
}
