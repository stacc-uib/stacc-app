import { useMemo, useState } from 'react';
import type {
  ComplianceCalendarCategory,
  ComplianceCalendarEvent,
  ComplianceCalendarOverview,
} from '../types/compliance';

type ComplianceCalendarSectionProps = {
  overview: ComplianceCalendarOverview;
};

type CalendarMonth = {
  year: number;
  monthIndex: number;
};

const weekdayLabels = ['Man', 'Tirs', 'Ons', 'Tors', 'Fre', 'Lør', 'Søn'];
const monthLabels = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const categoryLabels: Record<ComplianceCalendarCategory, string> = {
  finanstilsynet: 'Finanstilsynet',
  skatt: 'Skatt',
  pep: 'PEP',
};

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

  events.forEach((event) => {
    map.set(event.date, event);
  });

  return map;
}

function getCategoryClassName(category: ComplianceCalendarCategory) {
  return `calendar-day calendar-day--${category}`;
}

function ComplianceCalendarSection({ overview }: ComplianceCalendarSectionProps) {
  const availableMonths = useMemo(
    () =>
      Array.from(new Set(overview.events.map((event) => toMonthKey(event.date)))).map(
        (monthKey) => toMonthValue(`${monthKey}-01`),
      ),
    [overview.events],
  );

  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const activeMonth = availableMonths[activeMonthIndex] ?? toMonthValue('2026-04-01');

  const monthEvents = overview.events.filter((event) => {
    const eventMonth = toMonthValue(event.date);
    return (
      eventMonth.year === activeMonth.year &&
      eventMonth.monthIndex === activeMonth.monthIndex
    );
  });

  const eventsByDate = getEventsByDate(monthEvents);
  const firstDayOfMonth = new Date(activeMonth.year, activeMonth.monthIndex, 1);
  const daysInMonth = new Date(activeMonth.year, activeMonth.monthIndex + 1, 0).getDate();
  const offset = (firstDayOfMonth.getDay() + 6) % 7;

  const dayCells = Array.from({ length: offset + daysInMonth }, (_, index) => {
    const dayNumber = index - offset + 1;

    if (dayNumber <= 0) {
      return null;
    }

    const month = String(activeMonth.monthIndex + 1).padStart(2, '0');
    const day = String(dayNumber).padStart(2, '0');
    const dateKey = `${activeMonth.year}-${month}-${day}`;
    const event = eventsByDate.get(dateKey);

    return {
      dateKey,
      dayNumber,
      event,
    };
  });

  const upcomingEvents = overview.events
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, 5);

  return (
    <section className="feature-section feature-section--calendar">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Compliance-kalender</p>
            <h2 className="feature-section__title">Viktige frister og hendelser</h2>
            <p className="feature-section__description">
              Kalenderen viser kommende frister for PEP-kontroller, rapportering til
              Finanstilsynet og aktiviteter mot Skattemyndighetene.
            </p>
          </div>
        </div>

        <div className="calendar-card">
          <div className="calendar-card__header">
            <button
              type="button"
              className="calendar-card__nav"
              onClick={() => setActiveMonthIndex((current) => Math.max(0, current - 1))}
              disabled={activeMonthIndex === 0}
              aria-label="Forrige måned"
            >
              ‹
            </button>
            <h3 className="calendar-card__title">{getMonthLabel(activeMonth)}</h3>
            <button
              type="button"
              className="calendar-card__nav"
              onClick={() =>
                setActiveMonthIndex((current) =>
                  Math.min(availableMonths.length - 1, current + 1),
                )
              }
              disabled={activeMonthIndex === availableMonths.length - 1}
              aria-label="Neste måned"
            >
              ›
            </button>
          </div>

          <div className="calendar-grid">
            {weekdayLabels.map((label) => (
              <div key={label} className="calendar-grid__weekday">
                {label}
              </div>
            ))}

            {dayCells.map((dayCell, index) => {
              if (!dayCell) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="calendar-grid__cell calendar-grid__cell--empty"
                  />
                );
              }

              return (
                <div key={dayCell.dateKey} className="calendar-grid__cell">
                  <div
                    className={
                      dayCell.event
                        ? getCategoryClassName(dayCell.event.category)
                        : 'calendar-day'
                    }
                  >
                    {dayCell.dayNumber}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="calendar-legend">
            {(['finanstilsynet', 'skatt', 'pep'] as ComplianceCalendarCategory[]).map(
              (category) => (
                <div key={category} className="calendar-legend__item">
                  <span className={`calendar-legend__dot calendar-legend__dot--${category}`} />
                  <span>{categoryLabels[category]}</span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="data-table-card">
          <div className="data-table-card__header">
            <div>
              <h3 className="data-table-card__title">Kommende frister</h3>
              <p className="data-table-card__description">
                De nærmeste fristene vises under kalenderen slik at CCO raskt ser hva
                som må håndteres først.
              </p>
            </div>
          </div>

          <div className="stack-list">
            {upcomingEvents.map((event) => (
              <article key={event.id} className="stack-card">
                <div className="stack-card__row">
                  <div className="stack-card__row stack-card__row--dense">
                    <span
                      className={`calendar-legend__dot calendar-legend__dot--${event.category}`}
                    />
                    <span className="stack-card__meta stack-card__meta--strong">
                      {event.dateLabel}
                    </span>
                  </div>
                  <span className="stack-card__meta">{categoryLabels[event.category]}</span>
                </div>
                <h3 className="stack-card__title stack-card__title--spaced">
                  {event.title}
                </h3>
                <p className="stack-card__body">{event.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ComplianceCalendarSection;
