import type { ComplianceStat } from '../lib/getComplianceOverviewStats';

type ComplianceStatGridProps = {
  stats: ComplianceStat[];
};

function ComplianceStatGrid({ stats }: ComplianceStatGridProps) {
  return (
    <section className="feature-section feature-section--overview">
      <div className="feature-section__surface">
        <div className="feature-section__header">
          <div>
            <p className="feature-section__eyebrow">Oversikt</p>
            <h2 className="feature-section__title">Nøkkeltall</h2>
            <p className="feature-section__description">
              Nøkkeltallene for compliance akkurat nå
            </p>
          </div>
        </div>

        <div className="summary-grid">
          {stats.map((stat) => (
            <article
              key={stat.id}
              className={`summary-card${stat.tone ? ` summary-card--${stat.tone}` : ''}`}
            >
              <p className="summary-card__label">{stat.label}</p>
              <p className="summary-card__value">{stat.value}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ComplianceStatGrid;


