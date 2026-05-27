import { useState } from 'react';
import type {
  ComplianceSubpageId,
  ComplianceWorkQueueFilter,
  ComplianceWorkQueueItem,
  ComplianceWorkQueueOverview,
} from '../types/compliance';

type ComplianceWorkQueueSectionProps = {
  overview: ComplianceWorkQueueOverview;
  onOpenSubpage: (subpageId: ComplianceSubpageId) => void;
};

type ActionDialogState = {
  item: ComplianceWorkQueueItem;
} | null;

function getDialogContent(item: ComplianceWorkQueueItem) {
  if (item.actionType === 'gjennomga') {
    return {
      title: 'Gjennomgå sak',
      description: `Du er i ferd med å gjennomgå «${item.title}».`,
      detail: item.summary,
      steps: [
        'Kontroller at all dokumentasjon er oppdatert',
        'Vurder risikonivå og eventuelle avvik',
        'Marker saken som gjennomgått når du er ferdig',
      ],
      primaryLabel: item.customerId ? 'Gå til kunde' : 'Gå til detaljvisning',
      secondaryLabel: 'Marker som gjennomgått',
    };
  }

  if (item.actionType === 'fullfor') {
    return {
      title: 'Fullfør oppgave',
      description: `Du er i ferd med å fullføre «${item.title}».`,
      detail: item.summary,
      steps: [
        'Verifiser at alle valideringskontroller er lukket',
        'Kontroller at rapporten er klar for innsending',
        'Bekreft fullføring for å fjerne oppgaven fra køen',
      ],
      primaryLabel: 'Gå til rapportering',
      secondaryLabel: 'Bekreft fullført',
    };
  }

  return {
    title: 'Åpne sak',
    description: `Du åpner saken «${item.title}».`,
    detail: item.summary,
    steps: [
      'Saken tildeles deg som ansvarlig',
      'Gå til detaljvisningen for å oppdatere investorstatus',
      'Lukk saken når oppfølgingen er ferdig',
    ],
    primaryLabel: item.customerId ? 'Gå til kunde' : 'Gå til detaljvisning',
    secondaryLabel: 'Tildel til meg',
  };
}

const filterOptions: { id: ComplianceWorkQueueFilter; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'kritiske', label: 'Kritiske' },
  { id: 'rapportering', label: 'Rapportering' },
  { id: 'denne-uken', label: 'Denne uken' },
  { id: 'mine-saker', label: 'Mine saker' },
];
// Merk: kategori-taggene på elementene ('AML og PEP', 'Rapportering', 'Investorer')
// brukes kun til visuell visning, ikke filtrering. Filtertaggene er separate.

function getPriorityClassName(priority: ComplianceWorkQueueItem['priority']) {
  if (priority === 'Kritisk') {
    return 'status-badge status-badge--critical';
  }

  if (priority === 'Høy') {
    return 'status-badge status-badge--warning';
  }

  return 'status-badge status-badge--neutral';
}

function ComplianceWorkQueueSection({
  overview,
  onOpenSubpage,
}: ComplianceWorkQueueSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ComplianceWorkQueueFilter>('alle');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<ActionDialogState>(null);

  const visibleItems = overview.items.filter((item) => {
    if (completedIds.includes(item.id)) {
      return false;
    }

    return activeFilter === 'alle' ? true : item.filterTags.includes(activeFilter);
  });

  function handlePrimaryAction(item: ComplianceWorkQueueItem) {
    setDialog({ item });
  }

  function handleDialogPrimary() {
    if (!dialog) return;
    const { item } = dialog;

    if (item.customerId) {
      window.location.hash = `#kundeoversikt/${item.customerId}`;
    } else {
      onOpenSubpage(item.targetSubpageId);
    }

    if (item.actionType === 'apne-sak') {
      setAssignedIds((current) =>
        current.includes(item.id) ? current : [...current, item.id],
      );
    }

    setDialog(null);
  }

  function handleDialogSecondary() {
    if (!dialog) return;
    const { item } = dialog;

    if (item.actionType === 'apne-sak') {
      setAssignedIds((current) =>
        current.includes(item.id) ? current : [...current, item.id],
      );
    } else {
      setCompletedIds((current) => [...current, item.id]);
    }

    setDialog(null);
  }

  return (
    <section className="feature-section feature-section--queue">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Compliance</p>
            <h2 className="feature-section__title">Oppgaver</h2>
            <p className="feature-section__description">
              Alt som trenger handling på tvers av AML, rapportering og investorstatus — sortert etter hastegrad.
            </p>
          </div>
        </div>

        <div className="queue-filter-row">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`queue-filter${
                option.id === activeFilter ? ' queue-filter--active' : ''
              }`}
              onClick={() => setActiveFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="stack-list">
          {visibleItems.map((item) => (
            <article key={item.id} className="queue-card">
              <div className="queue-card__main">
                <div className="stack-card__row">
                  <div>
                    <p className="queue-card__eyebrow">{item.category}</p>
                    <h3 className="queue-card__title">{item.title}</h3>
                  </div>
                  <span className={getPriorityClassName(item.priority)}>{item.priority}</span>
                </div>

                <p className="queue-card__summary">{item.summary}</p>

                {item.blockingNotes && item.blockingNotes.length > 0 && (
                  <ul className="queue-card__blocking-list">
                    {item.blockingNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}

                <div className="queue-card__meta-row">
                  <span>Frist: {item.dueLabel}</span>
                  <span>Ansvarlig: {assignedIds.includes(item.id) ? 'Meg' : item.owner}</span>
                </div>
              </div>

              <div className="queue-card__actions">
                <button
                  type="button"
                  className="queue-action queue-action--primary"
                  onClick={() => handlePrimaryAction(item)}
                >
                  {item.actionType === 'apne-sak' && assignedIds.includes(item.id)
                    ? 'Tildelt meg'
                    : item.actionLabel}
                </button>
                {item.actionType !== 'fullfor' && (
                  <button
                    type="button"
                    className="queue-action"
                    onClick={() => setCompletedIds((current) => [...current, item.id])}
                  >
                    Marker som gjennomgått
                  </button>
                )}
              </div>
            </article>
          ))}

          {visibleItems.length === 0 ? (
            <article className="queue-card queue-card--empty">
              Ingen åpne oppgaver i dette filteret.
            </article>
          ) : null}
        </div>

        {dialog ? (() => {
          const content = getDialogContent(dialog.item);

          return (
            <div className="queue-dialog-overlay" onClick={() => setDialog(null)}>
              <div
                className="queue-dialog"
                role="dialog"
                aria-label={content.title}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="queue-dialog__header">
                  <div>
                    <p className="queue-card__eyebrow">{dialog.item.category}</p>
                    <h3 className="queue-dialog__title">{content.title}</h3>
                  </div>
                  <button
                    type="button"
                    className="queue-dialog__close"
                    onClick={() => setDialog(null)}
                    aria-label="Lukk"
                  >
                    ✕
                  </button>
                </div>

                <p className="queue-dialog__description">{content.description}</p>
                <p className="queue-dialog__detail">{content.detail}</p>

                <div className="queue-dialog__meta">
                  <span>Prioritet: <span className={getPriorityClassName(dialog.item.priority)}>{dialog.item.priority}</span></span>
                  <span>Frist: {dialog.item.dueLabel}</span>
                  <span>Ansvarlig: {assignedIds.includes(dialog.item.id) ? 'Meg' : dialog.item.owner}</span>
                </div>

                <div className="queue-dialog__steps">
                  <p className="queue-dialog__steps-title">Neste steg</p>
                  <ol className="queue-dialog__steps-list">
                    {content.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div className="queue-dialog__actions">
                  <button
                    type="button"
                    className="queue-action queue-action--primary"
                    onClick={handleDialogPrimary}
                  >
                    {content.primaryLabel}
                  </button>
                  <button
                    type="button"
                    className="queue-action"
                    onClick={handleDialogSecondary}
                  >
                    {content.secondaryLabel}
                  </button>
                  <button
                    type="button"
                    className="queue-action"
                    onClick={() => setDialog(null)}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          );
        })() : null}
      </div>
    </section>
  );
}

export default ComplianceWorkQueueSection;
