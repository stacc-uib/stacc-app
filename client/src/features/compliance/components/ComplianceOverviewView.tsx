import { useMemo, useState } from 'react';
import ComplianceWorkQueueSection from './ComplianceWorkQueueSection';
import type {
  ComplianceCalendarCategory,
  ComplianceCalendarEvent,
  CompliancePageData,
  ComplianceSubpageId,
} from '../types/compliance';

type ComplianceOverviewViewProps = {
  pageData: CompliancePageData;
  onOpenSubpage: (subpageId: ComplianceSubpageId) => void;
};

// ─── Kalender-hjelpere ────────────────────────────────────────────────────────

const weekdayLabels = ['Man', 'Tirs', 'Ons', 'Tors', 'Fre', 'Lør', 'Søn'];
const monthLabels = [
  'Januar', 'Februar', 'Mars', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Desember',
];

const categoryLabels: Record<ComplianceCalendarCategory, string> = {
  finanstilsynet: 'Finanstilsynet',
  skatt: 'Skatt',
  pep: 'PEP',
};

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

// ─── Komponent ────────────────────────────────────────────────────────────────

function ComplianceOverviewView({ pageData, onOpenSubpage }: ComplianceOverviewViewProps) {
  // Kalender-tilstand
  const availableMonths = useMemo(
    () =>
      Array.from(new Set(pageData.calendar.events.map((e) => toMonthKey(e.date)))).map(
        (key) => toMonthValue(`${key}-01`),
      ),
    [pageData.calendar.events],
  );

  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const activeMonth = availableMonths[activeMonthIndex] ?? toMonthValue('2026-04-01');

  const monthEvents = pageData.calendar.events.filter((e) => {
    const m = toMonthValue(e.date);
    return m.year === activeMonth.year && m.monthIndex === activeMonth.monthIndex;
  });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ComplianceCalendarEvent>();
    monthEvents.forEach((event) => map.set(event.date, event));
    return map;
  }, [monthEvents]);

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

  const upcomingDeadlines = useMemo(
    () =>
      pageData.calendar.events
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [pageData.calendar.events],
  );

  return (
    <div className="compliance-overview">

      {/* ── 1. Compliance-kalender ────────────────────────────────────── */}
      <section className="feature-section">
        <div className="feature-section__surface">
          <div className="feature-section__header">
            <div>
              <p className="feature-section__eyebrow">Compliance-kalender</p>
              <h2 className="feature-section__title">Kommende frister</h2>
            </div>
          </div>

          <div className="feature-panel-grid feature-panel-grid--two-up">
            {/* Kalender-widget */}
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
                    <div
                      key={`empty-${index}`}
                      className="calendar-grid__cell calendar-grid__cell--empty"
                    />
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

            {/* Fristliste */}
            <div className="stack-list">
              {upcomingDeadlines.map((event) => (
                <article key={event.id} className="stack-card">
                  <div className="stack-card__row">
                    <div className="stack-card__row stack-card__row--dense">
                      <span
                        className={`calendar-legend__dot calendar-legend__dot--${event.category}`}
                      />
                      <h3 className="stack-card__title">{event.title}</h3>
                    </div>
                    <span className="stack-card__meta">{categoryLabels[event.category]}</span>
                  </div>
                  <p className="stack-card__body">
                    {event.dateLabel} — {event.summary}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Oppgaver ──────────────────────────────────────────────── */}
      <ComplianceWorkQueueSection
        overview={pageData.workQueue}
        onOpenSubpage={onOpenSubpage}
      />
    </div>
  );
}

export default ComplianceOverviewView;
