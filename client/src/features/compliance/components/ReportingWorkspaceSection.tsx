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
  if (tone === 'critical') return 'status-badge status-badge--critical';
  if (tone === 'warning') return 'status-badge status-badge--warning';
  if (tone === 'ok') return 'status-badge status-badge--ok';
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

  const visibleDateKeys = new Set(monthEvents.map((e) => e.date));
  const upcomingNotInView = calendar.events
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((e) => !visibleDateKeys.has(e.date))
    .slice(0, 3);

  return (
    <div className="arbeidsflate-panel">
      {/* ── Calendar ── */}
      <p className="feature-subsection__eyebrow">Compliance-kalender</p>
      <h3 className="arbeidsflate-panel__title">Kommende frister</h3>

      <div className="arbeidsflate-cal-header">
        <button
          type="button"
          className="arbeidsflate-cal-nav"
          onClick={() => setActiveMonthIndex((c) => Math.max(0, c - 1))}
          disabled={activeMonthIndex === 0}
          aria-label="Forrige måned"
        >
          ‹
        </button>
        <h4 className="arbeidsflate-cal-title">{getMonthLabel(activeMonth)}</h4>
        <button
          type="button"
          className="arbeidsflate-cal-nav"
          onClick={() => setActiveMonthIndex((c) => Math.min(availableMonths.length - 1, c + 1))}
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

      {upcomingNotInView.length > 0 ? (
        <div style={{ marginTop: '0.75rem' }}>
          {upcomingNotInView.map((event) => (
            <div key={event.id} className="report-run-row">
              <span className="report-run-row__name">
                <span className={`calendar-legend__dot calendar-legend__dot--${event.category}`} style={{ marginRight: '0.4rem' }} />
                {event.title}
              </span>
              <span className="status-badge status-badge--neutral">{categoryLabels[event.category]}</span>
              <span className="report-run-row__meta">{event.dateLabel} — {event.summary}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Reporting runs ── */}
      <hr className="arbeidsflate-panel__divider" />
      <p className="feature-subsection__eyebrow">Rapporteringsløp</p>

      <div style={{ marginTop: '0.5rem' }}>
        {overview.runs.map((run) => (
          <div key={run.id} className="report-run-row">
            <span className="report-run-row__name">{run.name}</span>
            <span className={getToneClassName(run.statusTone)}>{run.statusLabel}</span>
            <span className="report-run-row__meta">{run.periodLabel} · {run.nextAction}</span>
          </div>
        ))}
      </div>

      {/* ── Validation checks ── */}
      <hr className="arbeidsflate-panel__divider" />
      <p className="feature-subsection__eyebrow">Valideringskontroller</p>

      <div style={{ marginTop: '0.5rem' }}>
        {overview.validationChecks.map((check) => (
          <div
            key={check.id}
            className={`validation-check-row${check.status !== 'ok' && onNavigateToInvestors ? ' validation-check-row--clickable' : ''}`}
            onClick={check.status !== 'ok' && onNavigateToInvestors ? onNavigateToInvestors : undefined}
            role={check.status !== 'ok' && onNavigateToInvestors ? 'button' : undefined}
            tabIndex={check.status !== 'ok' && onNavigateToInvestors ? 0 : undefined}
            onKeyDown={check.status !== 'ok' && onNavigateToInvestors
              ? (e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateToInvestors(); }
              : undefined}
          >
            <span className="validation-check-row__label">{check.label}</span>
            <span className={getToneClassName(check.status)}>
              {check.status === 'ok' ? 'Klar' : check.status === 'warning' ? 'Avventer' : 'Blokkerer'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportingWorkspaceSection;
