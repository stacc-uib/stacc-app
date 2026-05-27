import type {
  CompliancePageData,
  ComplianceWorkQueueFilter,
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

export function getComplianceWorkQueueOverview(
  source: Pick<
    CompliancePageData,
    'amlPep' | 'reportingWorkspace' | 'investorClassification'
  >,
): ComplianceWorkQueueOverview {
  const items: ComplianceWorkQueueItem[] = [];

  // ── AML/PEP: ett aggregert element for alle investorer som trenger kontroll ──
  // Viser totalt antall framfor én tilfeldig investor, og navigerer til
  // investortabellen der brukeren kan håndtere alle i riktig rekkefølge.
  const forfaltRows = source.amlPep.rows.filter((r) => r.reviewStatus === 'Forfalt');
  const snartRows = source.amlPep.rows.filter((r) => r.reviewStatus === 'Forfaller snart');
  const totalActionable = forfaltRows.length + snartRows.length;

  if (totalActionable > 0) {
    const priority = forfaltRows.length > 0 ? ('Kritisk' as const) : ('Høy' as const);
    const earliestRow = forfaltRows[0] ?? snartRows[0];

    const parts: string[] = [];
    if (forfaltRows.length > 0)
      parts.push(`${forfaltRows.length} forfalt`);
    if (snartRows.length > 0)
      parts.push(`${snartRows.length} forfaller snart`);

    const highRiskCount = source.amlPep.rows.filter(
      (r) => r.amlRiskLevel === 'Høy' && r.reviewStatus !== 'Planlagt',
    ).length;

    const filterTags: ComplianceWorkQueueFilter[] = ['alle', 'mine-saker'];
    if (forfaltRows.length > 0) filterTags.push('kritiske');
    else filterTags.push('denne-uken');

    items.push({
      id: 'queue-aml-pep',
      title: `${totalActionable} investor${totalActionable > 1 ? 'er' : ''} krever AML/PEP-gjennomgang`,
      category: 'AML og PEP',
      priority,
      dueLabel: earliestRow.nextReviewLabel,
      owner: 'CCO',
      actionLabel: 'Gå til investorer',
      actionType: 'gjennomga',
      targetSubpageId: 'investorer',
      summary: `${parts.join(', ')} — kontrollfrister krever oppfølging.${highRiskCount > 0 ? ` ${highRiskCount} av disse har høy AML-risiko.` : ''}`,
      filterTags,
    });
  }

  // ── Rapportering: blokkerte rapporter ────────────────────────────────────────
  const checksById = new Map(
    source.reportingWorkspace.validationChecks.map((c) => [c.id, c]),
  );

  for (const run of source.reportingWorkspace.runs) {
    if (run.statusTone === 'ok' || run.statusTone === 'neutral') continue;

    const blockingChecks = run.checkIds
      .map((id) => checksById.get(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined)
      .filter((c) => c.status === 'critical' || c.status === 'warning');

    const priority = run.statusTone === 'critical' ? ('Kritisk' as const) : ('Høy' as const);

    const filterTags: ComplianceWorkQueueFilter[] = ['alle', 'rapportering', 'mine-saker'];
    if (run.statusTone === 'critical') filterTags.push('kritiske');

    items.push({
      id: `queue-report-${run.id}`,
      title: run.name,
      category: 'Rapportering',
      priority,
      dueLabel: run.periodLabel,
      owner: run.owner,
      actionLabel: 'Fullfør rapport',
      actionType: 'fullfor',
      targetSubpageId: 'oversikt',
      summary: run.nextAction,
      blockingNotes:
        blockingChecks.length > 0
          ? blockingChecks.map((c) => `${c.label} — ${c.detail}`)
          : undefined,
      filterTags,
    });
  }

  // ── Klassifisering: investorer med avvik i investorstatus ────────────────────
  const classificationRow = source.investorClassification.rows.find(
    (entry) => entry.classificationStatus !== 'ok',
  );

  if (classificationRow) {
    const isCritical = classificationRow.classificationStatus === 'pep-forfalt';

    const summaryText =
      classificationRow.classificationStatus === 'mangler-naering'
        ? 'Næringsgruppe mangler — påkrevd for rapportering til Finanstilsynet.'
        : classificationRow.classificationStatus === 'pep-forfalt'
          ? `PEP-kontrollen er forfalt. Neste planlagte gjennomgang: ${classificationRow.pepNextReviewLabel}.`
          : classificationRow.classificationStatus === 'pep-forfaller-snart'
            ? `PEP-kontrollen forfaller snart. Planlegg gjennomgang innen ${classificationRow.pepNextReviewLabel}.`
            : 'Investorklassifiseringen må gjennomgås.';

    items.push({
      id: `queue-classification-${classificationRow.customerId}`,
      title: `Oppdater investorstatus for ${classificationRow.investorName}`,
      category: 'Investorer',
      priority: isCritical ? 'Kritisk' : 'Medium',
      dueLabel: classificationRow.pepNextReviewLabel,
      owner: 'Drift',
      actionLabel: 'Gå til investor',
      actionType: 'apne-sak',
      targetSubpageId: 'investorer',
      customerId: classificationRow.customerId,
      summary: summaryText,
      filterTags: [
        'alle',
        isCritical ? 'kritiske' : 'denne-uken',
      ],
    });
  }

  return {
    items: items.sort(
      (left, right) => toPriorityRank(left.priority) - toPriorityRank(right.priority),
    ),
  };
}
