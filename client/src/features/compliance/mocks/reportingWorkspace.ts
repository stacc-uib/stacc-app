import type { ReportingWorkspaceOverview } from '../types/compliance';

export const reportingWorkspaceMock: ReportingWorkspaceOverview = {
  readyForSubmission: 1,
  blockedReports: 1,
  openValidationFindings: 3,
  submittedThisQuarter: 2,
  runs: [
    {
      id: 'run-1',
      name: 'Rapportering til Finanstilsynet',
      periodLabel: 'Q1 2026',
      owner: 'CCO',
      statusLabel: 'Pågår',
      statusTone: 'warning',
      nextAction: 'Fyll inn manglende næringsgruppe før rapportering.',
      checkIds: ['check-2'],
    },
    {
      id: 'run-2',
      name: 'Skatterapportering',
      periodLabel: 'Regnskapsår 2025',
      owner: 'CCO',
      statusLabel: 'Klar til godkjenning',
      statusTone: 'ok',
      nextAction: 'Gjennomfør siste kontroll og godkjenn rapport.',
      checkIds: ['check-1', 'check-3'],
    },
    {
      id: 'run-3',
      name: 'Årlig compliance-gjennomgang',
      periodLabel: '2026',
      owner: 'CCO',
      statusLabel: 'Ikke startet',
      statusTone: 'neutral',
      nextAction: 'Opprett kontrollplan og fordel ansvar i teamet.',
      checkIds: [],
    },
  ],
  validationChecks: [
    {
      id: 'check-1',
      label: 'Investor-IDer for skatterapportering',
      status: 'warning',
      detail: '2 investorer mangler komplett identifikasjonsgrunnlag.',
    },
    {
      id: 'check-2',
      label: 'Næringsgruppe for Finanstilsynet',
      status: 'critical',
      detail: '3 investorer mangler næringsgruppe og blokkerer innsending.',
    },
    {
      id: 'check-3',
      label: 'Årsverdier og utbytte',
      status: 'ok',
      detail: 'Årsverdier og utbytte er avstemt mot fondsdata.',
    },
  ],
};
