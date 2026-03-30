import type { ComplianceStat } from '../lib/getComplianceOverviewStats';

type ComplianceStatGridProps = {
  stats: ComplianceStat[];
};

function ComplianceStatGrid({ stats }: ComplianceStatGridProps) {
  return (
    <section className="feature-section">
      <div className="feature-section__header">
        <div>
          <p className="feature-section__eyebrow">Oversikt</p>
          <h2 className="feature-section__title">CCO-oversikt</h2>
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
    </section>
  );
}

export default ComplianceStatGrid;
