import type { InvestorClassificationStatus } from '../../features/compliance/types/compliance';
export type { InvestorClassificationStatus } from '../../features/compliance/types/compliance';

export type CustomerComplianceData = {
  customerId: string;
  pepStatus: 'Ja' | 'Nei';
  amlRiskLevel: 'Lav' | 'Medium' | 'Høy';
  classificationStatus: InvestorClassificationStatus;
  classificationLabel: string;
  documentationStatus: 'Komplett' | 'Mangler oppdatering' | 'Mangler dokumentasjon';
  nextPepReviewDate: string;       // ISO format YYYY-MM-DD
  nextPepReviewLabel: string;      // Formatted DD.MM.YYYY
  lastPepReviewLabel: string;      // Formatted DD.MM.YYYY
};
