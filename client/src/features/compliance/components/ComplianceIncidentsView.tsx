import type {
  ComplianceIncident,
  IncidentOverview,
  IncidentSeverity,
  IncidentStatus,
} from '../types/compliance';

type ComplianceIncidentsViewProps = {
  overview: IncidentOverview;
};

function getSeverityClassName(severity: IncidentSeverity) {
  if (severity === 'Kritisk' || severity === 'Høy') {
    return 'status-badge status-badge--critical';
  }

  if (severity === 'Medium') {
    return 'status-badge status-badge--warning';
  }

  return 'status-badge status-badge--ok';
}

function getStatusClassName(status: IncidentStatus) {
  if (status === 'Ny' || status === 'Under vurdering') {
    return 'status-badge status-badge--warning';
  }

  if (status === 'Tiltak pågår') {
    return 'status-badge status-badge--critical';
  }

  return 'status-badge status-badge--ok';
}

function IncidentRow({ incident }: { incident: ComplianceIncident }) {
  return (
    <tr>
      <td>
        <div className="table-primary-cell">
          <strong>{incident.title}</strong>
          <span>{incident.summary}</span>
        </div>
      </td>
      <td>{incident.category}</td>
      <td>
        <span className={getSeverityClassName(incident.severity)}>{incident.severity}</span>
      </td>
      <td>
        <span className={getStatusClassName(incident.status)}>{incident.status}</span>
      </td>
      <td>{incident.owner}</td>
      <td>{incident.relatedEntity}</td>
      <td>{incident.detectedDateLabel}</td>
      <td>{incident.dueDateLabel}</td>
    </tr>
  );
}

function ComplianceIncidentsView({ overview }: ComplianceIncidentsViewProps) {
  const prioritizedIncidents = overview.incidents.filter(
    (incident) => incident.status !== 'Lukket',
  );

  return (
    <section className="feature-section feature-section--incidents">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Brudd og avvik</p>
            <h2 className="feature-section__title">Avvik som må følges opp</h2>
            <p className="feature-section__description">
              Her ser CCO kun det viktigste: åpne saker, alvorlighetsgrad, ansvar,
              berørt enhet og frist for oppfølging.
            </p>
          </div>
        </div>

        <div className="summary-grid summary-grid--four-up">
          <article className="summary-card summary-card--critical">
            <p className="summary-card__label">Åpne avvik</p>
            <p className="summary-card__value">{overview.openIncidents}</p>
          </article>
          <article className="summary-card summary-card--critical">
            <p className="summary-card__label">Kritiske avvik</p>
            <p className="summary-card__value">{overview.criticalIncidents}</p>
          </article>
          <article className="summary-card summary-card--warning">
            <p className="summary-card__label">Frist denne uken</p>
            <p className="summary-card__value">{overview.dueThisWeek}</p>
          </article>
          <article className="summary-card summary-card--ok">
            <p className="summary-card__label">Lukket denne måneden</p>
            <p className="summary-card__value">{overview.closedThisMonth}</p>
          </article>
        </div>

        <div className="data-table-card">
          <div className="data-table-card__header">
            <div>
              <h3 className="data-table-card__title">Prioritert avviksliste</h3>
              <p className="data-table-card__description">
                Listen viser aktive saker sortert for operativ oppfølging. Hver rad
                inneholder en kort oppsummering slik at du slipper et ekstra detaljpanel.
              </p>
            </div>
          </div>

          <div className="table-scroll">
            <table className="data-table data-table--wide-first-column">
              <thead>
                <tr>
                  <th>Sak</th>
                  <th>Kategori</th>
                  <th>Alvorlighet</th>
                  <th>Status</th>
                  <th>Eier</th>
                  <th>Gjelder</th>
                  <th>Oppdaget</th>
                  <th>Frist</th>
                </tr>
              </thead>
              <tbody>
                {prioritizedIncidents.map((incident) => (
                  <IncidentRow key={incident.id} incident={incident} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ComplianceIncidentsView;
