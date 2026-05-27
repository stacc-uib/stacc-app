import type { ComplianceCalendarEvent } from '../types/compliance';

export const complianceCalendarStaticEvents: ComplianceCalendarEvent[] = [
  {
    id: 'calendar-1',
    title: 'Kvartalsrapport Q2 2026 til Finanstilsynet',
    category: 'finanstilsynet',
    date: '2026-07-15',
    dateLabel: '15. jul 2026',
    summary:
      'Frist for ferdigstillelse og innsending av kvartalsrapport til Finanstilsynet.',
  },
  {
    id: 'calendar-2',
    title: 'Halvårsrapport 2026 — intern gjennomgang',
    category: 'finanstilsynet',
    date: '2026-08-12',
    dateLabel: '12. aug 2026',
    summary:
      'Intern gjennomgang og kvalitetskontroll av halvårsrapporten før innsending.',
  },
  {
    id: 'calendar-3',
    title: 'Skatteeksport halvår 2026',
    category: 'skatt',
    date: '2026-08-28',
    dateLabel: '28. aug 2026',
    summary:
      'Eksport og innsending av halvårsdata til Skattemyndighetene.',
  },
  {
    id: 'calendar-4',
    title: 'Oppfølgingsmøte med Finanstilsynet',
    category: 'finanstilsynet',
    date: '2026-09-10',
    dateLabel: '10. sep 2026',
    summary:
      'Gjennomgang av åpne funn fra forrige tilsynsrunde og status på dokumentasjon.',
  },
];
