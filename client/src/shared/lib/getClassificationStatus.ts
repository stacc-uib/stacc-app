import type { InvestorClassificationStatus } from '../types/compliance';

/**
 * Single source of truth for investor classification status.
 *
 * Priority order:
 * 1. Missing industry group → 'mangler-naering' (blocks reporting regardless of category)
 * 2. Non-professional → 'ikke-profesjonell'
 * 3. PEP review overdue → 'pep-forfalt'
 * 4. PEP review due within 14 days → 'pep-forfaller-snart'
 * 5. Otherwise → 'ok'
 *
 * @param isProfessional  Whether the investor is categorised as Professional
 * @param industryGroup   The assigned industry group, or null if missing
 * @param pepNextReviewDate  ISO date string (YYYY-MM-DD) for next PEP review
 * @param referenceDate   Date to compare against (defaults to 2026-03-30 for mock data)
 */
export function getClassificationStatus(
  isProfessional: boolean,
  industryGroup: string | null,
  pepNextReviewDate: string,
  referenceDate: Date = new Date('2026-03-30'),
): InvestorClassificationStatus {
  if (!industryGroup) {
    return 'mangler-naering';
  }

  if (!isProfessional) {
    return 'ikke-profesjonell';
  }

  const reviewDate = new Date(pepNextReviewDate);
  const diffInDays = Math.ceil(
    (reviewDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays < 0) {
    return 'pep-forfalt';
  }

  if (diffInDays <= 14) {
    return 'pep-forfaller-snart';
  }

  return 'ok';
}
