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
