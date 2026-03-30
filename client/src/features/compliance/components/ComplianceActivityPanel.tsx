import type {
  ComplianceAlert,
  ComplianceTask,
  ReportingRun,
} from '../types/compliance';

type ComplianceActivityPanelProps = {
  alerts: ComplianceAlert[];
  reportingRuns: ReportingRun[];
  tasks: ComplianceTask[];
};

function getReportingStatusLabel(status: ReportingRun['status']) {
  switch (status) {
    case 'in-progress':
      return 'Pågår';
    case 'ready-for-review':
      return 'Klar til gjennomgang';
    case 'submitted':
      return 'Innsendt';
    default:
      return 'Ikke startet';
  }
}

function ComplianceActivityPanel({
  alerts,
  reportingRuns,
  tasks,
}: ComplianceActivityPanelProps) {
  return (
    <section className="feature-section feature-section--alerts">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Dagens fokus</p>
            <h2 className="feature-section__title">Varsler, rapportering og oppgaver</h2>
            <p className="feature-section__description">
              Denne delen gir CCO et raskt bilde av hva som haster, hva som er i flyt, og hvilke oppgaver som må følges opp.
            </p>
          </div>
        </div>

        <div className="feature-panel-grid">
          <section className="feature-subsection">
            <div className="feature-subsection__header">
              <p className="feature-subsection__eyebrow">Varsler</p>
              <h3 className="feature-subsection__title">Aktuelt nå</h3>
            </div>

            <div className="stack-list">
              {alerts.map((alert) => (
                <article key={alert.id} className={`stack-card stack-card--${alert.status}`}>
                  <div className="stack-card__row">
                    <h3 className="stack-card__title">{alert.title}</h3>
                    <span className="stack-card__meta">{alert.dueLabel}</span>
                  </div>
                  <p className="stack-card__body">{alert.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="feature-subsection">
            <div className="feature-subsection__header">
              <p className="feature-subsection__eyebrow">Rapporteringsflyt</p>
              <h3 className="feature-subsection__title">Løp som er i arbeid</h3>
            </div>

            <div className="stack-list">
              {reportingRuns.map((run) => (
                <article key={run.id} className="stack-card">
                  <div className="stack-card__row">
                    <h3 className="stack-card__title">{run.name}</h3>
                    <span className="stack-card__meta">{run.periodLabel}</span>
                  </div>
                  <p className="stack-card__body">Status: {getReportingStatusLabel(run.status)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="feature-subsection">
            <div className="feature-subsection__header">
              <p className="feature-subsection__eyebrow">Oppgaver</p>
              <h3 className="feature-subsection__title">Trenger oppfølging</h3>
            </div>

            <div className="stack-list">
              {tasks.map((task) => (
                <article key={task.id} className="stack-card">
                  <div className="stack-card__row">
                    <h3 className="stack-card__title">{task.title}</h3>
                    <span className="stack-card__meta">{task.dueLabel}</span>
                  </div>
                  <p className="stack-card__body">
                    Eier: {task.owner} | Status: {task.status}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default ComplianceActivityPanel;
