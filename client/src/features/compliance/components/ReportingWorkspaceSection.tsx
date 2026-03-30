import type {
  ReportingValidationCheck,
  ReportingWorkspaceOverview,
  ReportingWorkspaceRun,
} from '../types/compliance';

type ReportingWorkspaceSectionProps = {
  overview: ReportingWorkspaceOverview;
};

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

function ReportingWorkspaceSection({ overview }: ReportingWorkspaceSectionProps) {
  return (
    <section className="feature-section">
      <div className="feature-section__header">
        <div>
          <p className="feature-section__eyebrow">Rapportering</p>
          <h2 className="feature-section__title">Status for rapporteringsløp</h2>
        </div>
      </div>

      <div className="summary-grid summary-grid--four-up">
        <article className="summary-card summary-card--ok">
          <p className="summary-card__label">Klare for innsending</p>
          <p className="summary-card__value">{overview.readyForSubmission}</p>
        </article>
        <article className="summary-card summary-card--critical">
          <p className="summary-card__label">Blokkerte rapporter</p>
          <p className="summary-card__value">{overview.blockedReports}</p>
        </article>
        <article className="summary-card summary-card--warning">
          <p className="summary-card__label">Åpne valideringsfunn</p>
          <p className="summary-card__value">{overview.openValidationFindings}</p>
        </article>
        <article className="summary-card">
          <p className="summary-card__label">Innsendt dette kvartalet</p>
          <p className="summary-card__value">{overview.submittedThisQuarter}</p>
        </article>
      </div>

      <div className="feature-panel-grid feature-panel-grid--two-up">
        <section className="feature-section">
          <div className="data-table-card">
            <div className="data-table-card__header">
              <div>
                <h3 className="data-table-card__title">Rapporteringsløp</h3>
                <p className="data-table-card__description">
                  Hvert løp viser nåværende status, ansvarlig og neste konkrete handling.
                </p>
              </div>
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
          </div>
        </section>

        <section className="feature-section">
          <div className="data-table-card">
            <div className="data-table-card__header">
              <div>
                <h3 className="data-table-card__title">Valideringskontroller</h3>
                <p className="data-table-card__description">
                  Siste kvalitetssjekker før rapportene kan godkjennes og sendes inn.
                </p>
              </div>
            </div>

            <div className="stack-list">
              {overview.validationChecks.map((check) => (
                <article key={check.id} className="stack-card">
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
                  <p className="stack-card__body">{check.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default ReportingWorkspaceSection;
