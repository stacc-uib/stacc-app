import { useState } from 'react';
import { statusBadgeClass } from '../../../shared/lib/statusBadge';
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

const QUEUE_DEFAULT_VISIBLE = 5;

const filterOptions: { id: ComplianceWorkQueueFilter; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'kritiske', label: 'Kritiske' },
  { id: 'denne-uken', label: 'Denne uken' },
  { id: 'mine-saker', label: 'Mine saker' },
];

function getPriorityClassName(priority: ComplianceWorkQueueItem['priority']) {
  if (priority === 'Kritisk') return statusBadgeClass('critical');
  if (priority === 'Høy') return statusBadgeClass('warning');
  return statusBadgeClass('neutral');
}

function ComplianceWorkQueueSection({
  overview,
  onOpenSubpage,
}: ComplianceWorkQueueSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ComplianceWorkQueueFilter>('alle');
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const visibleItems = overview.items.filter((item) => {
    if (completedIds.includes(item.id)) {
      return false;
    }

    return activeFilter === 'alle' ? true : item.filterTags.includes(activeFilter);
  });

  const displayItems = showAll ? visibleItems : visibleItems.slice(0, QUEUE_DEFAULT_VISIBLE);
  const hiddenCount = visibleItems.length - QUEUE_DEFAULT_VISIBLE;

  function handlePrimaryAction(item: ComplianceWorkQueueItem) {
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
  }

  return (
    <section className="feature-section feature-section--queue">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Arbeidsflate</p>
            <h2 className="feature-section__title">Prioriterte oppgaver</h2>
            <p className="feature-section__description">
              Samler de viktigste sakene på tvers av AML, rapportering og investorstatus.
              Løs det som haster først, gå direkte til detaljfanen for å følge opp.
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
              onClick={() => { setActiveFilter(option.id); setShowAll(false); }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="stack-list">
          {displayItems.map((item) => (
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

        {hiddenCount > 0 && !showAll ? (
          <button
            type="button"
            className="queue-show-more"
            onClick={() => setShowAll(true)}
          >
            Vis {hiddenCount} til
          </button>
        ) : showAll && visibleItems.length > QUEUE_DEFAULT_VISIBLE ? (
          <button
            type="button"
            className="queue-show-more"
            onClick={() => setShowAll(false)}
          >
            Vis færre
          </button>
        ) : null}

      </div>
    </section>
  );
}

export default ComplianceWorkQueueSection;
