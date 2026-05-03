import investors from '../../../mocks/investors.json';
import { investorComplianceDetails } from '../mocks/investorComplianceDetails';
import { getClassificationStatus } from '../../../shared/lib/getClassificationStatus';
import { formatDateLabel } from '../../../shared/utils/formatDateLabel';
import type {
  InvestorClassificationOverview,
  InvestorClassificationRow,
} from '../types/compliance';

type InvestorRecord = {
  customerId: string;
  name: string;
  customerType: string;
  category: 'Professional' | 'Retail';
};

function toInvestorCategoryLabel(category: InvestorRecord['category']) {
  return category === 'Professional' ? 'Profesjonell' : 'Ikke-profesjonell';
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
        investor.category === 'Professional',
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
      (row) => row.investorCategory === 'Ikke-profesjonell',
    ).length,
    missingIndustryGroup: rows.filter((row) => row.industryGroup === null).length,
    pepReviewOverdue: rows.filter(
      (row) => row.classificationStatus === 'pep-forfalt',
    ).length,
    rows: rows.sort((left, right) => left.investorName.localeCompare(right.investorName, 'nb')),
  };
}
