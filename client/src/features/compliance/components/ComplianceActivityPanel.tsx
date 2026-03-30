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

function ComplianceActivityPanel({
  alerts,
  reportingRuns,
  tasks,
}: ComplianceActivityPanelProps) {
  return (
    <div className="feature-panel-grid">
      <section className="feature-section">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Varsler</p>
            <h2 className="feature-section__title">Aktuelt</h2>
          </div>
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

      <section className="feature-section">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Rapportering</p>
            <h2 className="feature-section__title">Rapporteringsflyt</h2>
          </div>
        </div>

        <div className="stack-list">
          {reportingRuns.map((run) => (
            <article key={run.id} className="stack-card">
              <div className="stack-card__row">
                <h3 className="stack-card__title">{run.name}</h3>
                <span className="stack-card__meta">{run.periodLabel}</span>
              </div>
              <p className="stack-card__body">Status: {run.status}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-section">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Oppgaver</p>
            <h2 className="feature-section__title">Trengs oppfølging</h2>
          </div>
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
  );
}

export default ComplianceActivityPanel;
