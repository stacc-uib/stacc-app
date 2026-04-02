import ComplianceWorkQueueSection from './ComplianceWorkQueueSection';
import { getComplianceDashboardData } from '../lib/getComplianceDashboardData';
import type { CompliancePageData, ComplianceSubpageId } from '../types/compliance';

type ComplianceDashboardSectionProps = {
  pageData: CompliancePageData;
  onOpenSubpage: (subpageId: ComplianceSubpageId) => void;
};

function getMetricClassName(tone?: 'ok' | 'warning' | 'critical') {
  if (tone === 'critical') return 'status-badge status-badge--critical';
  if (tone === 'warning') return 'status-badge status-badge--warning';
  if (tone === 'ok') return 'status-badge status-badge--ok';
  return 'status-badge status-badge--neutral';
}

function ComplianceDashboardSection({
  pageData,
  onOpenSubpage,
}: ComplianceDashboardSectionProps) {
  const dashboard = getComplianceDashboardData(pageData);

  // Next upcoming calendar deadline
  const nextDeadline = pageData.calendar.events
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div className="compliance-overview">
      {/* Status bar */}
      <section className="compliance-overview__statusbar">
        {dashboard.metrics.map((metric) => (
          <div key={metric.id} className="compliance-overview__stat">
            <span className="compliance-overview__stat-value">
              {metric.value}
            </span>
            <span className="compliance-overview__stat-label">{metric.label}</span>
            <span className={getMetricClassName(metric.tone)}>
              {metric.tone === 'critical'
                ? 'Kritisk'
                : metric.tone === 'warning'
                  ? 'Avvik'
                  : 'OK'}
            </span>
          </div>
        ))}

        {nextDeadline ? (
          <div className="compliance-overview__stat compliance-overview__stat--deadline">
            <span className="compliance-overview__stat-value">
              {nextDeadline.dateLabel}
            </span>
            <span className="compliance-overview__stat-label">Neste frist</span>
            <span className="status-badge status-badge--neutral">
              {nextDeadline.title}
            </span>
          </div>
        ) : null}
      </section>

      {/* Full work queue — the primary action surface */}
      <ComplianceWorkQueueSection
        overview={pageData.workQueue}
        onOpenSubpage={onOpenSubpage}
      />
    </div>
  );
}

export default ComplianceDashboardSection;
