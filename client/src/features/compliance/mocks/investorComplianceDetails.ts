import type { IndustryClassificationOption } from '../types/compliance';

export type InvestorComplianceDetail = {
  customerId: string;
  industryGroup: IndustryClassificationOption | null;
  pepStatus: boolean;
  pepLastReviewDate: string;
  pepNextReviewDate: string;
  amlRiskLevel: 'Lav' | 'Medium' | 'Høy';
  documentationStatus: 'Komplett' | 'Mangler oppdatering' | 'Mangler dokumentasjon';
};

export const investorComplianceDetails: InvestorComplianceDetail[] = [
  { customerId: '1001', industryGroup: 'Other financial institutions', pepStatus: false, pepLastReviewDate: '2025-11-30', pepNextReviewDate: '2026-11-30', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1002', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-04-15', pepNextReviewDate: '2026-04-15', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1003', industryGroup: 'Pension funds', pepStatus: false, pepLastReviewDate: '2025-07-01', pepNextReviewDate: '2026-07-01', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1004', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-03-18', pepNextReviewDate: '2026-03-18', amlRiskLevel: 'Medium', documentationStatus: 'Mangler dokumentasjon' },
  { customerId: '1005', industryGroup: 'Non-financial corporations', pepStatus: true, pepLastReviewDate: '2025-03-10', pepNextReviewDate: '2026-03-10', amlRiskLevel: 'Høy', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1006', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-12-01', pepNextReviewDate: '2026-12-01', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1007', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-06-15', pepNextReviewDate: '2026-06-15', amlRiskLevel: 'Medium', documentationStatus: 'Komplett' },
  { customerId: '1008', industryGroup: 'Households', pepStatus: true, pepLastReviewDate: '2025-03-05', pepNextReviewDate: '2026-03-05', amlRiskLevel: 'Høy', documentationStatus: 'Mangler dokumentasjon' },
  { customerId: '1009', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-05-12', pepNextReviewDate: '2026-05-12', amlRiskLevel: 'Medium', documentationStatus: 'Komplett' },
  { customerId: '1010', industryGroup: null, pepStatus: false, pepLastReviewDate: '2025-05-01', pepNextReviewDate: '2026-05-01', amlRiskLevel: 'Medium', documentationStatus: 'Mangler dokumentasjon' },
  { customerId: '1011', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-08-20', pepNextReviewDate: '2026-08-20', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1012', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-04-11', pepNextReviewDate: '2026-04-11', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1013', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-10-19', pepNextReviewDate: '2026-10-19', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1014', industryGroup: 'Households', pepStatus: true, pepLastReviewDate: '2025-04-08', pepNextReviewDate: '2026-04-08', amlRiskLevel: 'Høy', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1015', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-09-30', pepNextReviewDate: '2026-09-30', amlRiskLevel: 'Medium', documentationStatus: 'Komplett' },
  { customerId: '1016', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-07-22', pepNextReviewDate: '2026-07-22', amlRiskLevel: 'Medium', documentationStatus: 'Komplett' },
  { customerId: '1017', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-11-05', pepNextReviewDate: '2026-11-05', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1018', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-03-29', pepNextReviewDate: '2026-03-29', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1019', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-06-09', pepNextReviewDate: '2026-06-09', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1020', industryGroup: 'Other financial institutions', pepStatus: false, pepLastReviewDate: '2025-12-15', pepNextReviewDate: '2026-12-15', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1021', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-10-02', pepNextReviewDate: '2026-10-02', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1022', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-09-03', pepNextReviewDate: '2026-09-03', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1023', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-04-22', pepNextReviewDate: '2026-04-22', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1024', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-04-12', pepNextReviewDate: '2026-04-12', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1025', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-05-17', pepNextReviewDate: '2026-05-17', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1026', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-07-17', pepNextReviewDate: '2026-07-17', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1027', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-04-02', pepNextReviewDate: '2026-04-02', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1028', industryGroup: 'Insurance corporations', pepStatus: false, pepLastReviewDate: '2025-06-26', pepNextReviewDate: '2026-06-26', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1029', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-03-31', pepNextReviewDate: '2026-03-31', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1030', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-05-30', pepNextReviewDate: '2026-05-30', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1031', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-08-01', pepNextReviewDate: '2026-08-01', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1032', industryGroup: null, pepStatus: false, pepLastReviewDate: '2025-04-06', pepNextReviewDate: '2026-04-06', amlRiskLevel: 'Medium', documentationStatus: 'Mangler dokumentasjon' },
  { customerId: '1033', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-07-11', pepNextReviewDate: '2026-07-11', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1034', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-03-21', pepNextReviewDate: '2026-03-21', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1035', industryGroup: 'Non-financial corporations', pepStatus: false, pepLastReviewDate: '2025-11-11', pepNextReviewDate: '2026-11-11', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1036', industryGroup: 'Other financial institutions', pepStatus: false, pepLastReviewDate: '2025-12-20', pepNextReviewDate: '2026-12-20', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1037', industryGroup: 'Households', pepStatus: false, pepLastReviewDate: '2025-04-01', pepNextReviewDate: '2026-04-01', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1038', industryGroup: 'Other financial institutions', pepStatus: false, pepLastReviewDate: '2025-10-10', pepNextReviewDate: '2026-10-10', amlRiskLevel: 'Lav', documentationStatus: 'Komplett' },
  { customerId: '1039', industryGroup: null, pepStatus: false, pepLastReviewDate: '2025-06-01', pepNextReviewDate: '2026-06-01', amlRiskLevel: 'Medium', documentationStatus: 'Mangler dokumentasjon' },
];
