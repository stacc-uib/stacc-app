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
