export type ComplianceStatus = 'ok' | 'warning' | 'critical';

export type ComplianceAlert = {
  id: string;
  title: string;
  description: string;
  status: ComplianceStatus;
  dueLabel: string;
};

export type ReportingRun = {
  id: string;
  name: string;
  periodLabel: string;
  status: 'not-started' | 'in-progress' | 'ready-for-review' | 'submitted';
};

export type ComplianceTask = {
  id: string;
  title: string;
  owner: string;
  dueLabel: string;
  status: 'todo' | 'in-progress' | 'done';
};

export type ComplianceOverviewData = {
  totalInvestors: number;
  professionalInvestors: number;
  pepReviewOverdue: number;
  missingIndustryClassification: number;
  alerts: ComplianceAlert[];
  reportingRuns: ReportingRun[];
  tasks: ComplianceTask[];
};

export type InvestorClassificationStatus =
  | 'ok'
  | 'mangler-naering'
  | 'pep-forfaller-snart'
  | 'pep-forfalt'
  | 'ikke-profesjonell';

export type InvestorClassificationRow = {
  customerId: string;
  investorName: string;
  investorType: string;
  investorCategory: string;
  industryGroup: string;
  pepStatus: 'Ja' | 'Nei';
  pepNextReviewLabel: string;
  classificationStatus: InvestorClassificationStatus;
};

export type InvestorClassificationOverview = {
  totalInvestors: number;
  professionalInvestors: number;
  nonProfessionalInvestors: number;
  missingIndustryGroup: number;
  pepReviewOverdue: number;
  rows: InvestorClassificationRow[];
};

export type AmlPepFollowUpRow = {
  customerId: string;
  investorName: string;
  pepStatus: 'Ja' | 'Nei';
  amlRiskLevel: 'Lav' | 'Medium' | 'Høy';
  documentationStatus: 'Komplett' | 'Mangler oppdatering' | 'Mangler dokumentasjon';
  lastReviewLabel: string;
  nextReviewLabel: string;
  reviewStatus: 'Forfalt' | 'Forfaller snart' | 'Planlagt';
};

export type AmlPepOverview = {
  overdueReviews: number;
  dueSoonReviews: number;
  highRiskInvestors: number;
  missingDocumentation: number;
  rows: AmlPepFollowUpRow[];
};
