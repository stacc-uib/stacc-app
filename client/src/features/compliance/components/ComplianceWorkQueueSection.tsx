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

const filterOptions: { id: ComplianceWorkQueueFilter; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'kritiske', label: 'Kritiske' },
  { id: 'denne-uken', label: 'Denne uken' },
  { id: 'mine-saker', label: 'Mine saker' },
];

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

  const visibleItems = overview.items.filter((item) => {
    if (completedIds.includes(item.id)) {
      return false;
    }

    return activeFilter === 'alle' ? true : item.filterTags.includes(activeFilter);
  });

  function handlePrimaryAction(item: ComplianceWorkQueueItem) {
    onOpenSubpage(item.targetSubpageId);

    if (item.actionType === 'apne-sak') {
      setAssignedIds((current) =>
        current.includes(item.id) ? current : [...current, item.id],
      );
      return;
    }

    setCompletedIds((current) => [...current, item.id]);
  }

  return (
    <section className="feature-section feature-section--queue">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Prioritert oppgaveliste</p>
            <h2 className="feature-section__title">Det bør gjøres nå</h2>
            <p className="feature-section__description">
              Denne listen samler de viktigste arbeidsoppgavene på tvers av AML,
              rapportering, klassifisering og avvik, slik at det er tydelig hva som må
              løses først.
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
                <button
                  type="button"
                  className="queue-action"
                  onClick={() => setCompletedIds((current) => [...current, item.id])}
                >
                  Marker som gjennomgått
                </button>
              </div>
            </article>
          ))}

          {visibleItems.length === 0 ? (
            <article className="queue-card queue-card--empty">
              Ingen åpne oppgaver i dette filteret.
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default ComplianceWorkQueueSection;
