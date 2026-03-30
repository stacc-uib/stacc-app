import type { IncidentOverview } from '../types/compliance';

export const incidentsMock: IncidentOverview = {
  openIncidents: 6,
  criticalIncidents: 1,
  dueThisWeek: 3,
  closedThisMonth: 4,
  incidents: [
    {
      id: 'incident-1',
      title: 'Ikke-profesjonell investor registrert i salgsdialog',
      category: 'Investorstatus',
      severity: 'Kritisk',
      status: 'Under vurdering',
      owner: 'CCO',
      relatedEntity: 'Siddis Invest AS',
      detectedDateLabel: '28.03.2026',
      dueDateLabel: '01.04.2026',
      summary:
        'Investor er klassifisert som ikke-profesjonell og må vurderes opp mot markedsføringsreglene.',
    },
    {
      id: 'incident-2',
      title: 'Manglende næringsgruppe blokkerer Finanstilsynet-rapport',
      category: 'Rapportering',
      severity: 'Høy',
      status: 'Tiltak pågår',
      owner: 'Drift',
      relatedEntity: '3 investorer',
      detectedDateLabel: '26.03.2026',
      dueDateLabel: '02.04.2026',
      summary:
        'Næringsgrupper mangler for flere investorer og stopper ferdigstillelse av rapporteringsløpet.',
    },
    {
      id: 'incident-3',
      title: 'PEP-kontroll er forfalt for nøkkelinvestor',
      category: 'AML og PEP',
      severity: 'Høy',
      status: 'Ny',
      owner: 'CCO',
      relatedEntity: 'Nanna Soot',
      detectedDateLabel: '30.03.2026',
      dueDateLabel: '03.04.2026',
      summary:
        'Neste PEP-kontroll passerte frist og krever oppdatering før videre oppfølging.',
    },
    {
      id: 'incident-4',
      title: 'Manglende dokumentasjon i AML-sak',
      category: 'AML og PEP',
      severity: 'Medium',
      status: 'Tiltak pågår',
      owner: 'Drift',
      relatedEntity: 'Homer Invest AS',
      detectedDateLabel: '24.03.2026',
      dueDateLabel: '04.04.2026',
      summary:
        'Kundemappen mangler oppdatert dokumentasjon og saken holdes åpen til dokumentene er mottatt.',
    },
    {
      id: 'incident-5',
      title: 'Skatterapport krever ekstra kontroll av identifikasjonsgrunnlag',
      category: 'Skatt',
      severity: 'Medium',
      status: 'Under vurdering',
      owner: 'CCO',
      relatedEntity: '2 investorer',
      detectedDateLabel: '22.03.2026',
      dueDateLabel: '05.04.2026',
      summary:
        'Identifikasjonsgrunnlag må bekreftes før skatteeksporten kan endelig godkjennes.',
    },
    {
      id: 'incident-6',
      title: 'Avvik lukket etter oppdatert investorinformasjon',
      category: 'Investorstatus',
      severity: 'Lav',
      status: 'Lukket',
      owner: 'Drift',
      relatedEntity: 'Teien Invest AS',
      detectedDateLabel: '12.03.2026',
      dueDateLabel: '18.03.2026',
      summary:
        'Manglende informasjon ble oppdatert og saken er lukket etter kontroll.',
    },
  ],
};
