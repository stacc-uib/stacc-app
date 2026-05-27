import investors from '../../mocks/investors.json';
import { investorComplianceDetails } from '../../features/compliance/mocks/investorComplianceDetails';
import { formatDateLabel } from '../utils/formatDateLabel';
import type { CustomerComplianceData, InvestorClassificationStatus } from '../types/compliance';

type InvestorRecord = {
  customerId: string;
  name: string;
  customerType: string;
  category: 'Professional' | 'Retail';
};

const statusLabelByType: Record<InvestorClassificationStatus, string> = {
  ok: 'Klar',
  'mangler-naering': 'Mangler næringsgruppe',
  'pep-forfaller-snart': 'PEP forfaller snart',
  'pep-forfalt': 'PEP forfalt',
};

function getClassificationStatus(
  industryGroup: string | null,
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

const detailByCustomerId = new Map(
  investorComplianceDetails.map((detail) => [detail.customerId, detail]),
);

const investorByCustomerId = new Map(
  (investors as InvestorRecord[]).map((investor) => [investor.customerId, investor]),
);

export function getCustomerComplianceData(customerId: string): CustomerComplianceData | null {
  const detail = detailByCustomerId.get(customerId);
  if (!detail) {
    return null;
  }

  const investor = investorByCustomerId.get(customerId);
  if (!investor) {
    return null;
  }

  const classificationStatus = getClassificationStatus(
    detail.industryGroup,
    detail.pepNextReviewDate,
  );

  return {
    customerId,
    pepStatus: detail.pepStatus ? 'Ja' : 'Nei',
    amlRiskLevel: detail.amlRiskLevel,
    classificationStatus,
    classificationLabel: statusLabelByType[classificationStatus],
    documentationStatus: detail.documentationStatus,
    nextPepReviewDate: detail.pepNextReviewDate,
    nextPepReviewLabel: formatDateLabel(detail.pepNextReviewDate),
    lastPepReviewLabel: formatDateLabel(detail.pepLastReviewDate),
  };
}
