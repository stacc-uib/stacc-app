import type {
  CompliancePageData,
  ComplianceWorkQueueItem,
  ComplianceWorkQueueOverview,
} from '../types/compliance';

function toPriorityRank(priority: ComplianceWorkQueueItem['priority']) {
  switch (priority) {
    case 'Kritisk':
      return 0;
    case 'Høy':
      return 1;
    default:
      return 2;
  }
}

function formatClassificationStatus(status: string) {
  return status.split('-').join(' ');
}

function getTaskTargetSubpageId(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('pep')) {
    return 'investorer' as const;
  }

  if (normalizedTitle.includes('næring')) {
    return 'investorer' as const;
  }

  if (normalizedTitle.includes('skatteeksport')) {
    return 'rapportering' as const;
  }

  return 'oversikt' as const;
}

export function getComplianceWorkQueueOverview(
  source: Pick<
    CompliancePageData,
    'overview' | 'amlPep' | 'reportingWorkspace' | 'investorClassification'
  >,
): ComplianceWorkQueueOverview {
  const items: ComplianceWorkQueueItem[] = [];

  if (source.amlPep.rows[0]) {
    const row = source.amlPep.rows[0];

    items.push({
      id: `queue-pep-${row.customerId}`,
      title: `PEP-kontroll må vurderes for ${row.investorName}`,
      category: 'AML og PEP',
      priority: row.reviewStatus === 'Forfalt' ? 'Kritisk' : 'Høy',
      dueLabel: row.nextReviewLabel,
      owner: 'CCO',
      actionLabel: 'Gjennomgå',
      actionType: 'gjennomga',
      targetSubpageId: 'investorer',
      customerId: row.customerId,
      summary: `Status ${row.reviewStatus.toLowerCase()} med ${row.amlRiskLevel.toLowerCase()} risiko og dokumentasjon: ${row.documentationStatus.toLowerCase()}.`,
      filterTags: [
        'alle',
        row.reviewStatus === 'Forfalt' ? 'kritiske' : 'denne-uken',
        'mine-saker',
      ],
    });
  }

  const blockedReport = source.reportingWorkspace.runs.find(
    (run) => run.statusTone === 'warning' || run.statusTone === 'critical',
  );

  if (blockedReport) {
    items.push({
      id: `queue-report-${blockedReport.id}`,
      title: blockedReport.name,
      category: 'Rapportering',
      priority: 'Høy',
      dueLabel: blockedReport.periodLabel,
      owner: blockedReport.owner,
      actionLabel: 'Fullfør',
      actionType: 'fullfor',
      targetSubpageId: 'rapportering',
      summary: blockedReport.nextAction,
      filterTags: ['alle', 'denne-uken', 'mine-saker'],
    });
  }

  if (source.investorClassification.rows[0]) {
    const row = source.investorClassification.rows.find(
      (entry) => entry.classificationStatus !== 'ok',
    );

    if (row) {
      items.push({
        id: `queue-classification-${row.customerId}`,
        title: `Oppdater investorstatus for ${row.investorName}`,
        category: 'Klassifisering',
        priority:
          row.classificationStatus === 'ikke-profesjonell' ? 'Kritisk' : 'Medium',
        dueLabel: row.pepNextReviewLabel,
        owner: 'Drift',
        actionLabel: 'Åpne sak',
        actionType: 'apne-sak',
        targetSubpageId: 'investorer',
        customerId: row.customerId,
        summary: `Investor er markert som ${row.investorCategory.toLowerCase()} med status ${formatClassificationStatus(row.classificationStatus)}.`,
        filterTags: [
          'alle',
          row.classificationStatus === 'ikke-profesjonell'
            ? 'kritiske'
            : 'denne-uken',
        ],
      });
    }
  }

  const openTask = source.overview.tasks.find((task) => task.status !== 'done');

  if (openTask) {
    items.push({
      id: `queue-task-${openTask.id}`,
      title: openTask.title,
      category: 'Oppgaver',
      priority: 'Medium',
      dueLabel: openTask.dueLabel,
      owner: openTask.owner,
      actionLabel: 'Gjennomgå',
      actionType: 'gjennomga',
      targetSubpageId: getTaskTargetSubpageId(openTask.title),
      summary: `Oppgaven er ${
        openTask.status === 'in-progress' ? 'pågående' : 'ikke startet'
      } og ligger i den operative oppfølgingslisten.`,
      filterTags: ['alle', 'mine-saker'],
    });
  }

  return {
    items: items.sort(
      (left, right) => toPriorityRank(left.priority) - toPriorityRank(right.priority),
    ),
  };
}
