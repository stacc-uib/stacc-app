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

// Today: 2026-05-27
// Forfalt   (< today):          1005, 1008, 1014  — all PEP=true, Høy risk, good for demo
// Forfaller snart (≤ 14 days):  1002 (7d), 1029 (10d)
// Planlagt  (> 14 days out):    all others

export const investorComplianceDetails: InvestorComplianceDetail[] = [
  { customerId: '1001', industryGroup: 'Other financial institutions',  pepStatus: false, pepLastReviewDate: '2026-01-27', pepNextReviewDate: '2027-01-27', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1002', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-06-03', pepNextReviewDate: '2026-06-03', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1003', industryGroup: 'Pension funds',                 pepStatus: false, pepLastReviewDate: '2025-08-28', pepNextReviewDate: '2026-08-28', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1004', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-07-18', pepNextReviewDate: '2026-07-18', amlRiskLevel: 'Medium', documentationStatus: 'Mangler dokumentasjon' },
  { customerId: '1005', industryGroup: 'Non-financial corporations',    pepStatus: true,  pepLastReviewDate: '2025-05-10', pepNextReviewDate: '2026-05-10', amlRiskLevel: 'Høy',    documentationStatus: 'Mangler oppdatering' },
  { customerId: '1006', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2026-01-28', pepNextReviewDate: '2027-01-28', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1007', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-08-12', pepNextReviewDate: '2026-08-12', amlRiskLevel: 'Medium', documentationStatus: 'Komplett' },
  { customerId: '1008', industryGroup: 'Households',                   pepStatus: true,  pepLastReviewDate: '2025-04-28', pepNextReviewDate: '2026-04-28', amlRiskLevel: 'Høy',    documentationStatus: 'Mangler dokumentasjon' },
  { customerId: '1009', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-08-12', pepNextReviewDate: '2026-08-12', amlRiskLevel: 'Medium', documentationStatus: 'Komplett' },
  { customerId: '1010', industryGroup: null,                           pepStatus: false, pepLastReviewDate: '2025-07-01', pepNextReviewDate: '2026-07-01', amlRiskLevel: 'Medium', documentationStatus: 'Mangler dokumentasjon' },
  { customerId: '1011', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-10-17', pepNextReviewDate: '2026-10-17', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1012', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-07-08', pepNextReviewDate: '2026-07-08', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1013', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-12-16', pepNextReviewDate: '2026-12-16', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1014', industryGroup: 'Households',                   pepStatus: true,  pepLastReviewDate: '2025-05-15', pepNextReviewDate: '2026-05-15', amlRiskLevel: 'Høy',    documentationStatus: 'Mangler oppdatering' },
  { customerId: '1015', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-11-27', pepNextReviewDate: '2026-11-27', amlRiskLevel: 'Medium', documentationStatus: 'Komplett' },
  { customerId: '1016', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-09-18', pepNextReviewDate: '2026-09-18', amlRiskLevel: 'Medium', documentationStatus: 'Komplett' },
  { customerId: '1017', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2026-01-02', pepNextReviewDate: '2027-01-02', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1018', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-08-26', pepNextReviewDate: '2026-08-26', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1019', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-08-06', pepNextReviewDate: '2026-08-06', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1020', industryGroup: 'Other financial institutions',  pepStatus: false, pepLastReviewDate: '2026-02-11', pepNextReviewDate: '2027-02-11', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1021', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-11-29', pepNextReviewDate: '2026-11-29', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1022', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-10-31', pepNextReviewDate: '2026-10-31', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1023', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-07-19', pepNextReviewDate: '2026-07-19', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1024', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-07-09', pepNextReviewDate: '2026-07-09', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1025', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-07-14', pepNextReviewDate: '2026-07-14', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1026', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-09-13', pepNextReviewDate: '2026-09-13', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1027', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-08-19', pepNextReviewDate: '2026-08-19', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1028', industryGroup: 'Insurance corporations',        pepStatus: false, pepLastReviewDate: '2025-08-23', pepNextReviewDate: '2026-08-23', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1029', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-06-06', pepNextReviewDate: '2026-06-06', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1030', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-07-27', pepNextReviewDate: '2026-07-27', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1031', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-09-28', pepNextReviewDate: '2026-09-28', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1032', industryGroup: null,                           pepStatus: false, pepLastReviewDate: '2025-08-03', pepNextReviewDate: '2026-08-03', amlRiskLevel: 'Medium', documentationStatus: 'Mangler dokumentasjon' },
  { customerId: '1033', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-09-07', pepNextReviewDate: '2026-09-07', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1034', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2025-08-18', pepNextReviewDate: '2026-08-18', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1035', industryGroup: 'Non-financial corporations',    pepStatus: false, pepLastReviewDate: '2026-01-08', pepNextReviewDate: '2027-01-08', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1036', industryGroup: 'Other financial institutions',  pepStatus: false, pepLastReviewDate: '2026-02-16', pepNextReviewDate: '2027-02-16', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1037', industryGroup: 'Households',                   pepStatus: false, pepLastReviewDate: '2025-08-28', pepNextReviewDate: '2026-08-28', amlRiskLevel: 'Medium', documentationStatus: 'Mangler oppdatering' },
  { customerId: '1038', industryGroup: 'Other financial institutions',  pepStatus: false, pepLastReviewDate: '2025-12-07', pepNextReviewDate: '2026-12-07', amlRiskLevel: 'Lav',    documentationStatus: 'Komplett' },
  { customerId: '1039', industryGroup: null,                           pepStatus: false, pepLastReviewDate: '2025-07-29', pepNextReviewDate: '2026-07-29', amlRiskLevel: 'Medium', documentationStatus: 'Mangler dokumentasjon' },
];
