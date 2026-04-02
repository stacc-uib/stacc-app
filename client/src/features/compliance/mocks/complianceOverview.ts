import type { ComplianceOverviewContent } from '../types/compliance';

export const complianceOverviewMock: ComplianceOverviewContent = {
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
      name: 'Årlig compliancegjennomgang',
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
      title: 'Fyll inn manglende næringsgruppe',
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

