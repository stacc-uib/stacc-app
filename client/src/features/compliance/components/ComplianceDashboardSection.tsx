import ComplianceOverviewCalendarPanel from './ComplianceOverviewCalendarPanel';
import { getComplianceDashboardData } from '../lib/getComplianceDashboardData';
import type { CompliancePageData, ComplianceSubpageId } from '../types/compliance';

type ComplianceDashboardSectionProps = {
  pageData: CompliancePageData;
  onOpenSubpage: (subpageId: ComplianceSubpageId) => void;
};

function getToneClassName(
  tone: 'ok' | 'warning' | 'critical' | 'neutral',
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

function ComplianceDashboardSection({
  pageData,
  onOpenSubpage,
}: ComplianceDashboardSectionProps) {
  const dashboard = getComplianceDashboardData(pageData);

  return (
    <section className="feature-section feature-section--dashboard">
      <div className="feature-section__surface compliance-dashboard">
        <div className="compliance-dashboard__hero">
          <div>
            <p className="feature-section__eyebrow compliance-dashboard__eyebrow">
              Complianceoversikt
            </p>
            <h2 className="compliance-dashboard__title">Hva trenger oppmerksomhet nå?</h2>
          </div>

          <div className="compliance-dashboard__hero-meta">
            <span className="status-badge status-badge--neutral">
              {dashboard.totalInvestors} investorer i registeret
            </span>
          </div>
        </div>

        <div className="summary-grid compliance-dashboard__summary-grid">
          {dashboard.metrics.map((metric) => (
            <article
              key={metric.id}
              className={`summary-card compliance-dashboard__metric${
                metric.tone ? ` summary-card--${metric.tone}` : ''
              }`}
            >
              <p className="summary-card__label">{metric.label}</p>
              <p className="summary-card__value">{metric.value}</p>
              <p className="compliance-dashboard__metric-context">{metric.context}</p>
            </article>
          ))}
        </div>

        <div className="compliance-dashboard__grid">
          <section className="feature-subsection compliance-dashboard__panel">
            <div className="feature-subsection__header compliance-dashboard__panel-header">
              <div>
                <p className="feature-subsection__eyebrow">AML og PEP</p>
                <h3 className="feature-subsection__title">PEP-kontroller som må følges opp nå</h3>
              </div>
              <button
                type="button"
                className="queue-action"
                onClick={() => onOpenSubpage('aml-pep')}
              >
                Åpne AML og PEP
              </button>
            </div>

            <div className="stack-list">
              {dashboard.pepAttention.map((item) => (
                <article key={item.id} className="stack-card">
                  <div className="stack-card__row">
                    <h3 className="stack-card__title">{item.title}</h3>
                    <span className={getToneClassName(item.tone)}>
                      {item.tone === 'critical' ? 'Forfalt' : 'Snart'}
                    </span>
                  </div>
                  <p className="stack-card__body">{item.detail}</p>
                  <p className="compliance-dashboard__list-meta">{item.meta}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="feature-subsection compliance-dashboard__panel">
            <div className="feature-subsection__header compliance-dashboard__panel-header">
              <div>
                <p className="feature-subsection__eyebrow">Klassifisering</p>
                <h3 className="feature-subsection__title">Investorer med manglende data</h3>
              </div>
              <button
                type="button"
                className="queue-action"
                onClick={() => onOpenSubpage('klassifisering')}
              >
                Åpne investorstatus
              </button>
            </div>

            <div className="stack-list">
              {dashboard.missingIndustry.map((item) => (
                <article key={item.id} className="stack-card">
                  <div className="stack-card__row">
                    <h3 className="stack-card__title">{item.title}</h3>
                    <span className={getToneClassName(item.tone)}>Mangler data</span>
                  </div>
                  <p className="stack-card__body">{item.detail}</p>
                  <p className="compliance-dashboard__list-meta">{item.meta}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="feature-subsection compliance-dashboard__panel">
            <div className="feature-subsection__header compliance-dashboard__panel-header">
              <div>
                <p className="feature-subsection__eyebrow">Rapportering</p>
                <h3 className="feature-subsection__title">Status før innsending</h3>
              </div>
              <button
                type="button"
                className="queue-action"
                onClick={() => onOpenSubpage('rapportering')}
              >
                Åpne rapportering
              </button>
            </div>

            <div className="compliance-dashboard__report-grid">
              <div className="stack-list">
                {dashboard.readyReports.map((item) => (
                  <article key={item.id} className="stack-card stack-card--ok">
                    <div className="stack-card__row">
                      <h3 className="stack-card__title">{item.title}</h3>
                      <span className={getToneClassName(item.tone)}>{item.statusLabel}</span>
                    </div>
                    <p className="stack-card__body">{item.detail}</p>
                    <p className="compliance-dashboard__list-meta">{item.nextAction}</p>
                  </article>
                ))}
              </div>

              <div className="stack-list">
                {dashboard.blockedReports.map((item) => (
                  <article key={item.id} className="stack-card stack-card--warning">
                    <div className="stack-card__row">
                      <h3 className="stack-card__title">{item.title}</h3>
                      <span className={getToneClassName(item.tone)}>{item.statusLabel}</span>
                    </div>
                    <p className="stack-card__body">{item.detail}</p>
                    <p className="compliance-dashboard__list-meta">{item.nextAction}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="stack-list compliance-dashboard__validation-list">
              {dashboard.blockingChecks.map((item) => (
                <article key={item.id} className="stack-card">
                  <div className="stack-card__row">
                    <h3 className="stack-card__title">{item.label}</h3>
                    <span className={getToneClassName(item.tone)}>
                      {item.tone === 'critical' ? 'Blokkerer' : 'Avventer'}
                    </span>
                  </div>
                  <p className="stack-card__body">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <ComplianceOverviewCalendarPanel overview={pageData.calendar} />

          <section className="feature-subsection compliance-dashboard__panel">
            <div className="feature-subsection__header compliance-dashboard__panel-header">
              <div>
                <p className="feature-subsection__eyebrow">Prioritering</p>
                <h3 className="feature-subsection__title">Arbeidsliste</h3>
              </div>
            </div>

            <div className="stack-list">
              {dashboard.priorityItems.map((item) => (
                <article key={item.id} className="stack-card">
                  <div className="stack-card__row">
                    <h3 className="stack-card__title">{item.title}</h3>
                    <span className={getToneClassName(item.tone)}>
                      {item.tone === 'critical'
                        ? 'Kritisk'
                        : item.tone === 'warning'
                          ? 'Høy'
                          : 'Normal'}
                    </span>
                  </div>
                  <p className="stack-card__body">{item.summary}</p>
                  <div className="compliance-dashboard__priority-footer">
                    <p className="compliance-dashboard__list-meta">{item.meta}</p>
                    <button
                      type="button"
                      className="queue-action"
                      onClick={() => onOpenSubpage(item.targetSubpageId)}
                    >
                      Åpne sak
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default ComplianceDashboardSection;
