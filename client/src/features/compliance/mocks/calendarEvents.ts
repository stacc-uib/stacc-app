import type { ComplianceCalendarEvent } from '../types/compliance';

export const complianceCalendarStaticEvents: ComplianceCalendarEvent[] = [
  {
    id: 'calendar-1',
    title: 'Kvartalsrapport Q1 2026 til Finanstilsynet',
    category: 'finanstilsynet',
    date: '2026-04-15',
    dateLabel: '15. apr 2026',
    summary:
      'Frist for ferdigstillelse og innsending av kvartalsrapport til Finanstilsynet.',
  },
  {
    id: 'calendar-2',
    title: 'Kontroll av skatteeksport',
    category: 'skatt',
    date: '2026-04-28',
    dateLabel: '28. apr 2026',
    summary:
      'Siste kvalitetssjekk av årsdata og eksport mot Skattemyndighetene.',
  },
  {
    id: 'calendar-3',
    title: 'Årsrapportering til Skattemyndighetene',
    category: 'skatt',
    date: '2026-05-05',
    dateLabel: '05. mai 2026',
    summary:
      'Planlagt innsending av skatterapportering for foregående rapporteringsår.',
  },
  {
    id: 'calendar-4',
    title: 'Oppfølgingsmøte med Finanstilsynet',
    category: 'finanstilsynet',
    date: '2026-05-12',
    dateLabel: '12. mai 2026',
    summary:
      'Internt møtested for gjennomgang av åpne funn og dokumentasjon.',
  },
];
