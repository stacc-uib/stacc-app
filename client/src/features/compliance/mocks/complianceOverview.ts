import type { ComplianceOverviewData } from '../types/compliance';

export const complianceOverviewMock: ComplianceOverviewData = {
  totalInvestors: 50,
  professionalInvestors: 43,
  pepReviewOverdue: 4,
  missingIndustryClassification: 3,
  alerts: [
    {
      id: 'alert-1',
      title: 'Forfalte PEP-kontroller',
      description: '4 investorer trenger ny PEP-kontroll for neste rapporteringssyklus.',
      status: 'critical',
      dueLabel: 'Krever handling nå',
    },
    {
      id: 'alert-2',
      title: 'Mangler bransjeklassifisering',
      description: '3 investorer mangler fortsatt påkrevd næringsgruppering.',
      status: 'warning',
      dueLabel: 'Rapportering til Finanstilsynet',
    },
    {
      id: 'alert-3',
      title: 'Avstemming av skattedata',
      description: 'Markedsverdier ved årsslutt er avstemt for alle tre fond.',
      status: 'ok',
      dueLabel: 'Fullført denne måneden',
    },
  ],
  reportingRuns: [
    {
      id: 'report-1',
      name: 'Rapportering til Finanstilsynet',
      periodLabel: 'Q1 2026',
      status: 'in-progress',
    },
    {
      id: 'report-2',
      name: 'Skatterapportering',
      periodLabel: 'Regnskapsår 2025',
      status: 'ready-for-review',
    },
    {
      id: 'report-3',
      name: 'Årlig compliance-gjennomgang',
      periodLabel: '2026',
      status: 'not-started',
    },
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Gjennomgå forfalte PEP-saker',
      owner: 'CCO',
      dueLabel: 'Denne uken',
      status: 'in-progress',
    },
    {
      id: 'task-2',
      title: 'Fylle inn manglende næringsgrupper',
      owner: 'Drift',
      dueLabel: 'Neste 5 dager',
      status: 'todo',
    },
    {
      id: 'task-3',
      title: 'Godkjenne skatteeksport for 2025',
      owner: 'CCO',
      dueLabel: 'For innsending',
      status: 'todo',
    },
  ],
};
