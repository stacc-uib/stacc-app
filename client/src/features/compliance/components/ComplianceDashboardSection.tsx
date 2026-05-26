import { useMemo, useState } from 'react';
import ComplianceWorkQueueSection from './ComplianceWorkQueueSection';
import { getComplianceDashboardData } from '../lib/getComplianceDashboardData';
import type {
  ComplianceCalendarCategory,
  ComplianceCalendarEvent,
  CompliancePageData,
  ComplianceSubpageId,
  ReportingValidationCheck,
  ReportingWorkspaceRun,
} from '../types/compliance';

export const toneColor: Record<string, string> = {
  critical: '#dc2626',
  warning: '#d97706',
  ok: '#16a34a',
  neutral: '#6b7280',
};

export function ToneTag({ tone, label }: { tone?: string; label: string }) {
  const color = tone ? toneColor[tone] : '#6b7280';
  return (
    <span
      style={{
        fontSize: '0.72rem',
        padding: '0.15rem 0.45rem',
        borderRadius: '0.25rem',
        background: `${color}20`,
        color,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

// ── Kalender-hjelpere ──────────────────────────────────────────────────────

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

function toMonthKey(d: string) { return d.slice(0, 7); }
function toMonthValue(d: string): CalendarMonth {
  const [year, month] = d.split('-').map(Number);
  return { year, monthIndex: month - 1 };
}
function getMonthLabel(m: CalendarMonth) {
  return `${monthLabels[m.monthIndex]} ${m.year}`;
}
function getEventsByDate(events: ComplianceCalendarEvent[]) {
  const map = new Map<string, ComplianceCalendarEvent>();
  events.forEach((e) => map.set(e.date, e));
  return map;
}

// ── Rapportering-hjelpere ──────────────────────────────────────────────────

function getToneClassName(
  tone: ReportingWorkspaceRun['statusTone'] | ReportingValidationCheck['status'],
) {
  if (tone === 'critical') return 'status-badge status-badge--critical';
  if (tone === 'warning')  return 'status-badge status-badge--warning';
  if (tone === 'ok')       return 'status-badge status-badge--ok';
  return 'status-badge status-badge--neutral';
}

// ── Hoved-komponent ────────────────────────────────────────────────────────

type ComplianceDashboardSectionProps = {
  pageData: CompliancePageData;
  onOpenSubpage: (subpageId: ComplianceSubpageId) => void;
};

function ComplianceDashboardSection({
  pageData,
  onOpenSubpage,
}: ComplianceDashboardSectionProps) {
  const dashboard = getComplianceDashboardData(pageData);

  // ── Kalender-state ──
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
  const eventsByDate = getEventsByDate(monthEvents);
  const firstDay   = new Date(activeMonth.year, activeMonth.monthIndex, 1);
  const daysInMonth = new Date(activeMonth.year, activeMonth.monthIndex + 1, 0).getDate();
  const offset     = (firstDay.getDay() + 6) % 7;
  const dayCells   = Array.from({ length: offset + daysInMonth }, (_, i) => {
    const dayNumber = i - offset + 1;
    if (dayNumber <= 0) return null;
    const mo  = String(activeMonth.monthIndex + 1).padStart(2, '0');
    const day = String(dayNumber).padStart(2, '0');
    const dateKey = `${activeMonth.year}-${mo}-${day}`;
    return { dateKey, dayNumber, event: eventsByDate.get(dateKey) };
  });

  const upcomingDeadlines = pageData.calendar.events
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Rapportering-state ──
  const checksById = useMemo(
    () => new Map(pageData.reportingWorkspace.validationChecks.map((c) => [c.id, c])),
    [pageData.reportingWorkspace.validationChecks],
  );

  return (
    <div className="compliance-overview">

      {/* ════════════════════════════════════════════════════════════════
          1. NØKKELTALL — rask statusoversikt øverst
      ════════════════════════════════════════════════════════════════ */}
      <section className="compliance-overview__statusbar">
        {dashboard.metrics.map((metric) => (
          <div key={metric.id} className="compliance-overview__stat">
            <span className="compliance-overview__stat-value">{metric.value}</span>
            <span className="compliance-overview__stat-label">{metric.label}</span>
            <span
              style={{
                fontSize: '0.7rem',
                color:
                  metric.tone === 'critical' ? '#dc2626'
                  : metric.tone === 'warning'  ? '#d97706'
                  : '#16a34a',
              }}
            >
              {metric.context}
            </span>
          </div>
        ))}
      </section>

      {/* ════════════════════════════════════════════════════════════════
          2. ARBEIDSKØ — prioriterte oppgaver som krever handling
      ════════════════════════════════════════════════════════════════ */}
      <ComplianceWorkQueueSection
        overview={pageData.workQueue}
        onOpenSubpage={onOpenSubpage}
      />

      {/* ════════════════════════════════════════════════════════════════
          3. FRISTER OG RAPPORTERING — kalender + rapportstatus side om side
      ════════════════════════════════════════════════════════════════ */}
      <section className="feature-section feature-section--reporting">
        <div className="feature-section__surface">
          <div className="feature-section__header">
            <div>
              <p className="feature-section__eyebrow">Frister og rapportering</p>
              <h2 className="feature-section__title">Kalender og rapportstatus</h2>
              <p className="feature-section__description">
                Kommende frister og status på rapporter som skal sendes inn til Finanstilsynet og skattemyndighetene.
              </p>
            </div>
          </div>

          {/* Kalender + fristliste side om side */}
          <div className="feature-panel-grid feature-panel-grid--two-up">

            {/* Kalender */}
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
                      <span className={`calendar-legend__dot calendar-legend__dot--${event.category}`} />
                      <h3 className="stack-card__title">{event.title}</h3>
                    </div>
                    <span className="stack-card__meta">{categoryLabels[event.category]}</span>
                  </div>
                  <p className="stack-card__body">{event.dateLabel} — {event.summary}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Rapportstatus — KPI + rapportliste */}
          <div style={{ marginTop: '1.5rem' }}>
            <div className="row g-3" style={{ marginBottom: '1rem' }}>
              <div className="col-12 col-md-4">
                <article className="summary-card summary-card--ok h-100">
                  <p className="summary-card__label">Klare for innsending</p>
                  <p className="summary-card__value">{pageData.reportingWorkspace.readyForSubmission}</p>
                </article>
              </div>
              <div className="col-12 col-md-4">
                <article className="summary-card summary-card--critical h-100">
                  <p className="summary-card__label">Blokkerte rapporter</p>
                  <p className="summary-card__value">{pageData.reportingWorkspace.blockedReports}</p>
                </article>
              </div>
              <div className="col-12 col-md-4">
                <article className="summary-card h-100">
                  <p className="summary-card__label">Innsendt dette kvartalet</p>
                  <p className="summary-card__value">{pageData.reportingWorkspace.submittedThisQuarter}</p>
                </article>
              </div>
            </div>

            <div className="stack-list">
              {pageData.reportingWorkspace.runs.map((run) => {
                const linkedChecks = run.checkIds
                  .map((id) => checksById.get(id))
                  .filter((c): c is ReportingValidationCheck => c !== undefined);
                const allPassed =
                  linkedChecks.length > 0 && linkedChecks.every((c) => c.status === 'ok');

                return (
                  <article key={run.id} className="stack-card">
                    <div className="stack-card__row">
                      <h3 className="stack-card__title">{run.name}</h3>
                      <span className={getToneClassName(run.statusTone)}>{run.statusLabel}</span>
                    </div>
                    <p className="stack-card__body">
                      Periode: {run.periodLabel} · Ansvarlig: {run.owner}
                    </p>
                    <p className="stack-card__body">Neste steg: {run.nextAction}</p>

                    {linkedChecks.length > 0 ? (
                      <div
                        style={{
                          marginTop: '0.6rem',
                          paddingTop: '0.6rem',
                          borderTop: '1px solid rgba(17, 24, 39, 0.08)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#6b7280',
                            marginBottom: '0.4rem',
                          }}
                        >
                          Forutsetninger for innsending
                        </p>
                        {allPassed ? (
                          <p className="stack-card__body" style={{ color: '#16a34a', fontWeight: 500 }}>
                            Alle kontroller er bestått — rapporten kan sendes inn.
                          </p>
                        ) : (
                          <div className="stack-list">
                            {linkedChecks.map((check) => (
                              <article
                                key={check.id}
                                className="stack-card"
                                style={{ background: 'rgba(249, 250, 251, 0.8)' }}
                              >
                                <div className="stack-card__row stack-card__row--dense">
                                  <h4 className="stack-card__title">{check.label}</h4>
                                  <span className={getToneClassName(check.status)}>
                                    {check.status === 'ok'
                                      ? 'Klar'
                                      : check.status === 'warning'
                                        ? 'Avventer'
                                        : 'Blokkerer'}
                                  </span>
                                </div>
                                <p className="stack-card__body">{check.detail}</p>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ComplianceDashboardSection;
