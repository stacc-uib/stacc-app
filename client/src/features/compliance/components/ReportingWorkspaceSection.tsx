import { useMemo, useState } from 'react';
import type {
  ComplianceCalendarCategory,
  ComplianceCalendarEvent,
  ComplianceCalendarOverview,
  ReportingValidationCheck,
  ReportingWorkspaceOverview,
  ReportingWorkspaceRun,
} from '../types/compliance';

type ReportingWorkspaceSectionProps = {
  overview: ReportingWorkspaceOverview;
  calendar: ComplianceCalendarOverview;
  onNavigateToInvestors?: () => void;
};

const categoryLabels: Record<ComplianceCalendarCategory, string> = {
  finanstilsynet: 'Finanstilsynet',
  skatt: 'Skatt',
  pep: 'PEP',
};

const weekdayLabels = ['Man', 'Tirs', 'Ons', 'Tors', 'Fre', 'Lør', 'Søn'];
const monthLabels = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember',
];

type CalendarMonth = { year: number; monthIndex: number };

function toMonthKey(dateString: string) {
  return dateString.slice(0, 7);
}

function toMonthValue(dateString: string): CalendarMonth {
  const [year, month] = dateString.split('-').map(Number);
  return { year, monthIndex: month - 1 };
}

function getMonthLabel(month: CalendarMonth) {
  return `${monthLabels[month.monthIndex]} ${month.year}`;
}

function getEventsByDate(events: ComplianceCalendarEvent[]) {
  const map = new Map<string, ComplianceCalendarEvent>();
  events.forEach((event) => { map.set(event.date, event); });
  return map;
}

function getToneClassName(
  tone: ReportingWorkspaceRun['statusTone'] | ReportingValidationCheck['status'],
) {
  if (tone === 'critical') {
    return 'status-badge status-badge--critical';
  }

  if (tone === 'warning') {
    return 'status-badge status-badge--warning';
  }

  if (tone === 'ok') {
    return 'status-badge status-badge--ok';
  }

  return 'status-badge status-badge--neutral';
}

function ReportingWorkspaceSection({ overview, calendar, onNavigateToInvestors }: ReportingWorkspaceSectionProps) {
  const availableMonths = useMemo(
    () =>
      Array.from(new Set(calendar.events.map((e) => toMonthKey(e.date)))).map(
        (key) => toMonthValue(`${key}-01`),
      ),
    [calendar.events],
  );

  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const activeMonth = availableMonths[activeMonthIndex] ?? toMonthValue('2026-04-01');

  const monthEvents = calendar.events.filter((e) => {
    const m = toMonthValue(e.date);
    return m.year === activeMonth.year && m.monthIndex === activeMonth.monthIndex;
  });

  const eventsByDate = getEventsByDate(monthEvents);
  const firstDay = new Date(activeMonth.year, activeMonth.monthIndex, 1);
  const daysInMonth = new Date(activeMonth.year, activeMonth.monthIndex + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;

  const dayCells = Array.from({ length: offset + daysInMonth }, (_, i) => {
    const dayNumber = i - offset + 1;
    if (dayNumber <= 0) return null;
    const month = String(activeMonth.monthIndex + 1).padStart(2, '0');
    const day = String(dayNumber).padStart(2, '0');
    const dateKey = `${activeMonth.year}-${month}-${day}`;
    return { dateKey, dayNumber, event: eventsByDate.get(dateKey) };
  });

  // Only show upcoming events that are NOT visible in the current month view
  const visibleDateKeys = new Set(monthEvents.map((e) => e.date));
  const upcomingNotInView = calendar.events
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((e) => !visibleDateKeys.has(e.date))
    .slice(0, 3);

  return (
    <section className="feature-section feature-section--reporting">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Rapportering</p>
            <h2 className="feature-section__title">Status for rapporteringsløp</h2>
            <p className="feature-section__description">
              Oversikt over rapporter som er klare, rapporter som er blokkert, og
              kontroller som fortsatt må lukkes.
            </p>
          </div>
        </div>

        <div className="feature-panel-grid feature-panel-grid--two-up">
          <section className="feature-subsection">
            <div className="feature-subsection__header">
              <p className="feature-subsection__eyebrow">Rapporteringsløp</p>
              <h3 className="feature-subsection__title">Status og neste steg</h3>
            </div>

            <div className="stack-list">
              {overview.runs.map((run) => (
                <article key={run.id} className="stack-card">
                  <div className="stack-card__row">
                    <h3 className="stack-card__title">{run.name}</h3>
                    <span className={getToneClassName(run.statusTone)}>{run.statusLabel}</span>
                  </div>
                  <p className="stack-card__body">Periode: {run.periodLabel}</p>
                  <p className="stack-card__body">Ansvarlig: {run.owner}</p>
                  <p className="stack-card__body">Neste steg: {run.nextAction}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="feature-subsection">
            <div className="feature-subsection__header">
              <p className="feature-subsection__eyebrow">Valideringskontroller</p>
              <h3 className="feature-subsection__title">Klar til godkjenning?</h3>
            </div>

            <div className="stack-list">
              {overview.validationChecks.map((check) => (
                <article
                  key={check.id}
                  className={`stack-card${check.status !== 'ok' && onNavigateToInvestors ? ' stack-card--clickable' : ''}`}
                  onClick={check.status !== 'ok' && onNavigateToInvestors ? onNavigateToInvestors : undefined}
                  style={check.status !== 'ok' && onNavigateToInvestors ? { cursor: 'pointer' } : undefined}
                >
                  <div className="stack-card__row">
                    <h3 className="stack-card__title">{check.label}</h3>
                    <span className={getToneClassName(check.status)}>
                      {check.status === 'ok'
                        ? 'Klar'
                        : check.status === 'warning'
                          ? 'Avventer'
                          : 'Blokkerer'}
                    </span>
                  </div>
                  <p className="stack-card__body">
                    {check.detail}
                    {check.status !== 'ok' && onNavigateToInvestors ? (
                      <span className="stack-card__link"> → Vis investorer</span>
                    ) : null}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="feature-subsection">
          <div className="feature-subsection__header">
            <p className="feature-subsection__eyebrow">Compliance-kalender</p>
            <h3 className="feature-subsection__title">Kommende frister</h3>
          </div>

          <div className="calendar-card">
            <div className="calendar-card__header">
              <button
                type="button"
                className="calendar-card__nav"
                onClick={() => setActiveMonthIndex((c) => Math.max(0, c - 1))}
                disabled={activeMonthIndex === 0}
                aria-label="Forrige måned"
              >
                ‹
              </button>
              <h4 className="calendar-card__title">{getMonthLabel(activeMonth)}</h4>
              <button
                type="button"
                className="calendar-card__nav"
                onClick={() =>
                  setActiveMonthIndex((c) => Math.min(availableMonths.length - 1, c + 1))
                }
                disabled={activeMonthIndex === availableMonths.length - 1}
                aria-label="Neste måned"
              >
                ›
              </button>
            </div>

            <div className="calendar-grid">
              {weekdayLabels.map((label) => (
                <div key={label} className="calendar-grid__weekday">{label}</div>
              ))}
              {dayCells.map((cell, index) =>
                !cell ? (
                  <div key={`empty-${index}`} className="calendar-grid__cell calendar-grid__cell--empty" />
                ) : (
                  <div key={cell.dateKey} className="calendar-grid__cell">
                    {cell.event ? (
                      <button
                        type="button"
                        className={`calendar-day calendar-day--${cell.event.category}`}
                      >
                        {cell.dayNumber}
                        <span className="calendar-day__tooltip">
                          <strong>{cell.event.title}</strong>
                          <span>{cell.event.dateLabel}</span>
                          <span>{cell.event.summary}</span>
                        </span>
                      </button>
                    ) : (
                      <div className="calendar-day">{cell.dayNumber}</div>
                    )}
                  </div>
                ),
              )}
            </div>

            <div className="calendar-legend">
              {(['finanstilsynet', 'skatt', 'pep'] as ComplianceCalendarCategory[]).map((cat) => (
                <div key={cat} className="calendar-legend__item">
                  <span className={`calendar-legend__dot calendar-legend__dot--${cat}`} />
                  <span>{categoryLabels[cat]}</span>
                </div>
              ))}
            </div>
          </div>

          {upcomingNotInView.length > 0 ? (
            <div className="stack-list" style={{ marginTop: '1rem' }}>
              <p className="feature-subsection__eyebrow">Kommende frister utenfor denne måneden</p>
              {upcomingNotInView.map((event) => (
                <article key={event.id} className="stack-card">
                  <div className="stack-card__row">
                    <div className="stack-card__row stack-card__row--dense">
                      <span className={`calendar-legend__dot calendar-legend__dot--${event.category}`} />
                      <h3 className="stack-card__title">{event.title}</h3>
                    </div>
                    <span className="stack-card__meta">{categoryLabels[event.category]}</span>
                  </div>
                  <p className="stack-card__body">{event.dateLabel} — {event.summary}</p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}

export default ReportingWorkspaceSection;
