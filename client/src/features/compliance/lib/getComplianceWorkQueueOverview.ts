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

  return 'oversikt' as const;
}

export function getComplianceWorkQueueOverview(
  source: Pick<
    CompliancePageData,
    'overview' | 'amlPep' | 'reportingWorkspace' | 'investorClassification'
  >,
): ComplianceWorkQueueOverview {
  const items: ComplianceWorkQueueItem[] = [];

  // All overdue and due-soon PEP reviews
  source.amlPep.rows
    .filter((row) => row.reviewStatus === 'Forfalt' || row.reviewStatus === 'Forfaller snart')
    .forEach((row) => {
      items.push({
        id: `queue-pep-${row.customerId}`,
        title: `PEP-kontroll: ${row.investorName}`,
        category: 'AML og PEP',
        priority: row.reviewStatus === 'Forfalt' ? 'Kritisk' : 'Høy',
        dueLabel: row.nextReviewLabel,
        owner: 'CCO',
        actionLabel: 'Gjennomgå',
        actionType: 'gjennomga',
        targetSubpageId: 'investorer',
        customerId: row.customerId,
        summary: `${row.reviewStatus} — ${row.amlRiskLevel} risiko, dokumentasjon: ${row.documentationStatus.toLowerCase()}.`,
        filterTags: [
          'alle',
          row.reviewStatus === 'Forfalt' ? 'kritiske' : 'denne-uken',
          'mine-saker',
        ],
      });
    });

  // All blocked or in-progress reports
  source.reportingWorkspace.runs
    .filter((run) => run.statusTone === 'warning' || run.statusTone === 'critical')
    .forEach((run) => {
      items.push({
        id: `queue-report-${run.id}`,
        title: run.name,
        category: 'Rapportering',
        priority: run.statusTone === 'critical' ? 'Kritisk' : 'Høy',
        dueLabel: run.periodLabel,
        owner: run.owner,
        actionLabel: 'Fullfør',
        actionType: 'fullfor',
        targetSubpageId: 'oversikt',
        summary: run.nextAction,
        filterTags: ['alle', 'denne-uken', 'mine-saker'],
      });
    });

  // All investors with classification issues
  source.investorClassification.rows
    .filter((row) => row.classificationStatus !== 'ok')
    .forEach((row) => {
      items.push({
        id: `queue-classification-${row.customerId}`,
        title: `Oppdater: ${row.investorName}`,
        category: 'Klassifisering',
        priority:
          row.classificationStatus === 'ikke-profesjonell' ? 'Kritisk' : 'Medium',
        dueLabel: row.pepNextReviewLabel,
        owner: 'Drift',
        actionLabel: 'Åpne sak',
        actionType: 'apne-sak',
        targetSubpageId: 'investorer',
        customerId: row.customerId,
        summary: `${row.investorCategory} — ${formatClassificationStatus(row.classificationStatus)}.`,
        filterTags: [
          'alle',
          row.classificationStatus === 'ikke-profesjonell'
            ? 'kritiske'
            : 'denne-uken',
        ],
      });
    });

  // All open tasks
  source.overview.tasks
    .filter((task) => task.status !== 'done')
    .forEach((task) => {
      items.push({
        id: `queue-task-${task.id}`,
        title: task.title,
        category: 'Oppgaver',
        priority: 'Medium',
        dueLabel: task.dueLabel,
        owner: task.owner,
        actionLabel: 'Gjennomgå',
        actionType: 'gjennomga',
        targetSubpageId: getTaskTargetSubpageId(task.title),
        summary: `${task.status === 'in-progress' ? 'Pågående' : 'Ikke startet'} — frist ${task.dueLabel}.`,
        filterTags: ['alle', 'mine-saker'],
      });
    });

  return {
    items: items.sort(
      (left, right) => toPriorityRank(left.priority) - toPriorityRank(right.priority),
    ),
  };
}
