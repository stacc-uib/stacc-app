import investors from '../../mocks/investors.json';
import { investorComplianceDetails } from '../../features/compliance/mocks/investorComplianceDetails';
import { getClassificationStatus } from '../lib/getClassificationStatus';
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
  'ikke-profesjonell': 'Ikke-profesjonell',
};

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
    investor.category === 'Professional',
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
  };
}
