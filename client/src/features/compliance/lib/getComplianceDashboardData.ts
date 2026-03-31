import type {
  AmlPepFollowUpRow,
  CompliancePageData,
  ComplianceSubpageId,
  ComplianceWorkQueueItem,
  InvestorClassificationRow,
  ReportingValidationCheck,
  ReportingWorkspaceRun,
} from '../types/compliance';

export type ComplianceDashboardMetric = {
  id: string;
  label: string;
  value: string;
  context: string;
  tone?: 'ok' | 'warning' | 'critical';
};

export type ComplianceDashboardAttentionItem = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  tone: 'ok' | 'warning' | 'critical';
};

export type ComplianceDashboardPriorityItem = {
  id: string;
  title: string;
  summary: string;
  meta: string;
  tone: 'warning' | 'critical' | 'neutral';
  targetSubpageId: ComplianceSubpageId;
};

export type ComplianceDashboardReportingItem = {
  id: string;
  title: string;
  detail: string;
  nextAction: string;
  tone: ReportingWorkspaceRun['statusTone'];
  statusLabel: string;
};

export type ComplianceDashboardValidationItem = {
  id: string;
  label: string;
  detail: string;
  tone: ReportingValidationCheck['status'];
};

export type ComplianceDashboardData = {
  totalInvestors: number;
  metrics: ComplianceDashboardMetric[];
  pepAttention: ComplianceDashboardAttentionItem[];
  missingIndustry: ComplianceDashboardAttentionItem[];
  readyReports: ComplianceDashboardReportingItem[];
  blockedReports: ComplianceDashboardReportingItem[];
  blockingChecks: ComplianceDashboardValidationItem[];
  priorityItems: ComplianceDashboardPriorityItem[];
};

function getPriorityTone(
  priority: ComplianceWorkQueueItem['priority'],
): ComplianceDashboardPriorityItem['tone'] {
  if (priority === 'Kritisk') {
    return 'critical';
  }

  if (priority === 'Høy') {
    return 'warning';
  }

  return 'neutral';
}

function getAttentionTone(
  status: AmlPepFollowUpRow['reviewStatus'],
): ComplianceDashboardAttentionItem['tone'] {
  return status === 'Forfalt' ? 'critical' : 'warning';
}

function getMetricTone(
  count: number,
  warningThreshold = 1,
): ComplianceDashboardMetric['tone'] {
  return count >= warningThreshold ? 'warning' : 'ok';
}

function toPepAttentionItem(row: AmlPepFollowUpRow): ComplianceDashboardAttentionItem {
  return {
    id: row.customerId,
    title: row.investorName,
    detail: `${row.reviewStatus}. ${row.documentationStatus.toLowerCase()}.`,
    meta: `Neste kontroll ${row.nextReviewLabel} • AML-risiko ${row.amlRiskLevel.toLowerCase()}`,
    tone: getAttentionTone(row.reviewStatus),
  };
}

function toMissingIndustryItem(
  row: InvestorClassificationRow,
): ComplianceDashboardAttentionItem {
  return {
    id: row.customerId,
    title: row.investorName,
    detail: `${row.investorType} • ${row.investorCategory}`,
    meta: `PEP ${row.pepStatus} • Neste kontroll ${row.pepNextReviewLabel}`,
    tone: row.classificationStatus === 'pep-forfalt' ? 'critical' : 'warning',
  };
}

function toReportingItem(run: ReportingWorkspaceRun): ComplianceDashboardReportingItem {
  return {
    id: run.id,
    title: run.name,
    detail: `${run.periodLabel} • ${run.statusLabel}`,
    nextAction: run.nextAction,
    tone: run.statusTone,
    statusLabel: run.statusLabel,
  };
}

function toValidationItem(
  check: ReportingValidationCheck,
): ComplianceDashboardValidationItem {
  return {
    id: check.id,
    label: check.label,
    detail: check.detail,
    tone: check.status,
  };
}

export function getComplianceDashboardData(
  pageData: CompliancePageData,
): ComplianceDashboardData {
  const documentationByCustomerId = new Map(
    pageData.amlPep.rows.map((row) => [row.customerId, row.documentationStatus]),
  );

  const compliantInvestors = pageData.investorClassification.rows.filter((row) => {
    const documentationStatus = documentationByCustomerId.get(row.customerId);

    return row.classificationStatus === 'ok' && documentationStatus === 'Komplett';
  }).length;

  const missingRequiredDataIds = new Set<string>();

  pageData.investorClassification.rows.forEach((row) => {
    if (row.industryGroup === null) {
      missingRequiredDataIds.add(row.customerId);
    }
  });

  pageData.amlPep.rows.forEach((row) => {
    if (row.documentationStatus !== 'Komplett') {
      missingRequiredDataIds.add(row.customerId);
    }
  });

  return {
    totalInvestors: pageData.overview.totalInvestors,
    metrics: [
      {
        id: 'compliant-investors',
        label: 'Etterlevende investorer',
        value: String(compliantInvestors),
        context: `${compliantInvestors} av ${pageData.overview.totalInvestors} uten åpne datamangler`,
        tone: 'ok',
      },
      {
        id: 'missing-required-data',
        label: 'Manglende opplysninger',
        value: String(missingRequiredDataIds.size),
        context: 'Mangler industry group eller oppdatert dokumentasjon',
        tone: getMetricTone(missingRequiredDataIds.size, 1),
      },
      {
        id: 'pep-overdue',
        label: 'PEP-kontroller forfalt',
        value: String(pageData.amlPep.overdueReviews),
        context: 'Krever oppfølging for neste rapporteringssyklus',
        tone: pageData.amlPep.overdueReviews > 0 ? 'critical' : 'ok',
      },
      {
        id: 'pep-due-soon',
        label: 'PEP-kontroller snart',
        value: String(pageData.amlPep.dueSoonReviews),
        context: 'Forfaller innen 14 dager',
        tone: pageData.amlPep.dueSoonReviews > 0 ? 'warning' : 'ok',
      },
      {
        id: 'reporting-ready',
        label: 'Klare for rapportering',
        value: String(pageData.reportingWorkspace.readyForSubmission),
        context: 'Rapporter som kan godkjennes nå',
        tone: pageData.reportingWorkspace.readyForSubmission > 0 ? 'ok' : 'warning',
      },
    ],
    pepAttention: pageData.amlPep.rows
      .filter((row) => row.reviewStatus !== 'Planlagt')
      .slice(0, 5)
      .map(toPepAttentionItem),
    missingIndustry: pageData.investorClassification.rows
      .filter((row) => row.industryGroup === null)
      .slice(0, 5)
      .map(toMissingIndustryItem),
    readyReports: pageData.reportingWorkspace.runs
      .filter((run) => run.statusTone === 'ok')
      .map(toReportingItem),
    blockedReports: pageData.reportingWorkspace.runs
      .filter((run) => run.statusTone === 'warning' || run.statusTone === 'critical')
      .map(toReportingItem),
    blockingChecks: pageData.reportingWorkspace.validationChecks
      .filter((check) => check.status !== 'ok')
      .map(toValidationItem),
    priorityItems: pageData.workQueue.items.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      meta: `${item.category} • Frist ${item.dueLabel}`,
      tone: getPriorityTone(item.priority),
      targetSubpageId: item.targetSubpageId,
    })),
  };
}
