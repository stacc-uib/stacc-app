import { useMemo, useState } from 'react';
import type {
  ComplianceCalendarCategory,
  ComplianceCalendarEvent,
  ComplianceCalendarOverview,
} from '../types/compliance';

type ComplianceOverviewCalendarPanelProps = {
  overview: ComplianceCalendarOverview;
};

type CalendarMonth = {
  year: number;
  monthIndex: number;
};

const weekdayLabels = ['M', 'T', 'O', 'T', 'F', 'L', 'S'];
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

function getCategoryClassName(category: ComplianceCalendarCategory) {
  return `calendar-mini__day calendar-mini__day--${category}`;
}

function getEventsByDate(events: ComplianceCalendarEvent[]) {
  const map = new Map<string, ComplianceCalendarEvent[]>();

  events.forEach((event) => {
    const current = map.get(event.date) ?? [];
    map.set(event.date, [...current, event]);
  });

  return map;
}

function ComplianceOverviewCalendarPanel({
  overview,
}: ComplianceOverviewCalendarPanelProps) {
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
  const upcomingEvents = monthEvents.slice(0, 3);

  const dayCells = Array.from({ length: offset + daysInMonth }, (_, index) => {
    const dayNumber = index - offset + 1;

    if (dayNumber <= 0) {
      return null;
    }

    const month = String(activeMonth.monthIndex + 1).padStart(2, '0');
    const day = String(dayNumber).padStart(2, '0');
    const dateKey = `${activeMonth.year}-${month}-${day}`;

    return {
      dateKey,
      dayNumber,
      events: eventsByDate.get(dateKey) ?? [],
    };
  });

  return (
    <section className="feature-subsection compliance-dashboard__panel">
      <div className="feature-subsection__header compliance-dashboard__panel-header">
        <div>
          <p className="feature-subsection__eyebrow">Compliance-kalender</p>
          <h3 className="feature-subsection__title">Frister denne perioden</h3>
        </div>
      </div>

      <div className="calendar-mini">
        <div className="calendar-mini__header">
          <button
            type="button"
            className="calendar-mini__nav"
            onClick={() => setActiveMonthIndex((current) => Math.max(0, current - 1))}
            disabled={activeMonthIndex === 0}
            aria-label="Forrige måned"
          >
            ‹
          </button>
          <h4 className="calendar-mini__title">{getMonthLabel(activeMonth)}</h4>
          <button
            type="button"
            className="calendar-mini__nav"
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

        <div className="calendar-mini__grid">
          {weekdayLabels.map((label) => (
            <div key={label} className="calendar-mini__weekday">
              {label}
            </div>
          ))}

          {dayCells.map((dayCell, index) => {
            if (!dayCell) {
              return (
                <div
                  key={`empty-${index}`}
                  className="calendar-mini__cell calendar-mini__cell--empty"
                />
              );
            }

            const primaryEvent = dayCell.events[0];

            return (
              <div key={dayCell.dateKey} className="calendar-mini__cell">
                {primaryEvent ? (
                  <button
                    type="button"
                    className={getCategoryClassName(primaryEvent.category)}
                  >
                    <span>{dayCell.dayNumber}</span>
                    <span className="calendar-mini__tooltip">
                      <strong>{primaryEvent.title}</strong>
                      <span>{primaryEvent.dateLabel}</span>
                      <span>{primaryEvent.summary}</span>
                    </span>
                  </button>
                ) : (
                  <div className="calendar-mini__day">{dayCell.dayNumber}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="stack-list">
        {upcomingEvents.map((event) => (
          <article key={event.id} className="stack-card">
            <div className="stack-card__row">
              <h3 className="stack-card__title">{event.title}</h3>
              <span className="stack-card__meta">{categoryLabels[event.category]}</span>
            </div>
            <p className="compliance-dashboard__list-meta">{event.dateLabel}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ComplianceOverviewCalendarPanel;
