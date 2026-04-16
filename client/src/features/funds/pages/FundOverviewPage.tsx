import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { formatDateLabel } from '../../../shared/utils/formatDateLabel';
import { getFundOverviewData } from '../lib/getFundOverviewData';
import type {
  FundOverviewChartGrouping,
  FundOverviewClassId,
  FundOverviewFlowPoint,
  FundOverviewLineSeries,
  FundOverviewMetric,
  FundOverviewMetricFormat,
  FundOverviewPeriodId,
} from '../types/funds';

type ChartCoordinate = {
  x: number;
  y: number;
};

const currencyFormatter = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('nb-NO', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const navFormatter = new Intl.NumberFormat('nb-NO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('nb-NO', {
  maximumFractionDigits: 0,
});

function formatMetricValue(value: number, format: FundOverviewMetricFormat) {
  if (format === 'currency') {
    return currencyFormatter.format(value);
  }

  if (format === 'percent') {
    return percentFormatter.format(value);
  }

  if (format === 'nav') {
    return navFormatter.format(value);
  }

  return integerFormatter.format(value);
}

function formatSignedMetricValue(value: number, format: FundOverviewMetricFormat) {
  const prefix = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${prefix}${formatMetricValue(Math.abs(value), format)}`;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('nb-NO', {
    maximumFractionDigits,
  }).format(value);
}

function getTickIndexes(length: number, maxTicks = 5) {
  if (length <= maxTicks) {
    return Array.from({ length }, (_, index) => index);
  }

  const indexes = new Set<number>([0, length - 1]);

  for (let tick = 1; tick < maxTicks - 1; tick += 1) {
    indexes.add(Math.round(((length - 1) * tick) / (maxTicks - 1)));
  }

  return Array.from(indexes).sort((left, right) => left - right);
}

function buildLinePath(points: ChartCoordinate[]) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

function buildAreaPath(points: ChartCoordinate[], baselineY: number) {
  if (points.length === 0) {
    return '';
  }

  return `${buildLinePath(points)} L ${points[points.length - 1].x.toFixed(2)} ${baselineY.toFixed(
    2,
  )} L ${points[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getHoveredPointIndex(
  event: ReactMouseEvent<SVGSVGElement>,
  pointCount: number,
  width: number,
  padding: { left: number; right: number },
) {
  if (pointCount <= 1) {
    return 0;
  }

  const bounds = event.currentTarget.getBoundingClientRect();
  const relativeX = ((event.clientX - bounds.left) / bounds.width) * width;
  const chartWidth = width - padding.left - padding.right;
  const step = chartWidth / Math.max(pointCount - 1, 1);
  const clampedX = clamp(relativeX, padding.left, width - padding.right);
  return clamp(Math.round((clampedX - padding.left) / step), 0, pointCount - 1);
}

function getDeltaArrow(direction: NonNullable<FundOverviewMetric['delta']>['direction']) {
  if (direction === 'up') {
    return '\u2191';
  }

  if (direction === 'down') {
    return '\u2193';
  }

  return '\u2192';
}

function MetricDelta({ delta }: { delta?: FundOverviewMetric['delta'] }) {
  if (!delta) {
    return null;
  }

  return (
    <div className={`fund-overview__delta fund-overview__delta--${delta.direction}`}>
      <span className="fund-overview__delta-arrow" aria-hidden="true">
        {getDeltaArrow(delta.direction)}
      </span>
      <span>{formatSignedMetricValue(delta.value, delta.format)}</span>
      {delta.label ? <span className="fund-overview__delta-label">{delta.label}</span> : null}
    </div>
  );
}

function MetricCard({ metric }: { metric: FundOverviewMetric }) {
  return (
    <article className="fund-overview__metric-card">
      <p className="fund-overview__metric-label">{metric.label}</p>
      <p className="fund-overview__metric-value">{formatMetricValue(metric.value, metric.format)}</p>
      <MetricDelta delta={metric.delta} />
      <p className="fund-overview__metric-meta">{metric.meta}</p>
    </article>
  );
}

function SectionKpiGrid({ metrics }: { metrics: FundOverviewMetric[] }) {
  return (
    <div className="fund-overview__section-kpi-grid">
      {metrics.map((metric) => (
        <article key={metric.id} className="fund-overview__section-kpi">
          <p className="fund-overview__section-kpi-label">{metric.label}</p>
          <p className="fund-overview__section-kpi-value">
            {formatMetricValue(metric.value, metric.format)}
          </p>
          <MetricDelta delta={metric.delta} />
          <p className="fund-overview__section-kpi-meta">{metric.meta}</p>
        </article>
      ))}
    </div>
  );
}

function PeriodRangeSlider({
  options,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: {
  options: { date: string; label: string }[];
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
}) {
  if (options.length === 0) {
    return null;
  }

  const dateIndexByDate = new Map(options.map((option, index) => [option.date, index]));
  const maxIndex = Math.max(options.length - 1, 0);
  const startIndex = dateIndexByDate.get(startDate) ?? 0;
  const endIndex = dateIndexByDate.get(endDate) ?? maxIndex;
  const startPercent = maxIndex === 0 ? 0 : (startIndex / maxIndex) * 100;
  const endPercent = maxIndex === 0 ? 100 : (endIndex / maxIndex) * 100;

  return (
    <div className="fund-overview__range-card">
      <div className="fund-overview__range-header">
        <div>
          <p className="fund-overview__range-label">Datointervall</p>
          <strong>
            {formatDateLabel(startDate)} - {formatDateLabel(endDate)}
          </strong>
        </div>
        <span className="fund-overview__range-caption">
          {options.length} tilgjengelige NAV-datoer
        </span>
      </div>

      <div className="fund-overview__range-values">
        <span>Start: {formatDateLabel(startDate)}</span>
        <span>Slutt: {formatDateLabel(endDate)}</span>
      </div>

      <div className="fund-overview__range-slider-stack">
        <div className="fund-overview__range-track" />
        <div
          className="fund-overview__range-fill"
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(endPercent - startPercent, 0)}%`,
          }}
        />
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={startIndex}
          className="fund-overview__range-input"
          onChange={(event) => {
            const nextIndex = Math.min(Number(event.target.value), endIndex);
            onStartChange(options[nextIndex]?.date ?? startDate);
          }}
        />
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={endIndex}
          className="fund-overview__range-input"
          onChange={(event) => {
            const nextIndex = Math.max(Number(event.target.value), startIndex);
            onEndChange(options[nextIndex]?.date ?? endDate);
          }}
        />
      </div>

      <div className="fund-overview__range-footer">
        <span>{options[0]?.label}</span>
        <span>{options[maxIndex]?.label}</span>
      </div>
    </div>
  );
}

function NavChart({ series }: { series: FundOverviewLineSeries[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const displaySeries = series.filter((seriesItem) => seriesItem.points.length > 0);

  if (displaySeries.length === 0) {
    return <div className="fund-overview__chart-empty">Ingen NAV-data i valgt utvalg.</div>;
  }

  const width = 820;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 42, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const pointCount = displaySeries[0].points.length;
  const step = pointCount > 1 ? chartWidth / Math.max(pointCount - 1, 1) : chartWidth;
  const values = displaySeries.flatMap((seriesItem) => seriesItem.points.map((point) => point.value));
  const valueMin = Math.min(...values);
  const valueMax = Math.max(...values);
  const valueRange = valueMax - valueMin || Math.max(valueMax * 0.08, 1);
  const displayMin = Math.max(0, valueMin - valueRange * 0.14);
  const displayMax = valueMax + valueRange * 0.14;
  const displayRange = displayMax - displayMin || 1;
  const coordinatesBySeries = displaySeries.map((seriesItem) => ({
    ...seriesItem,
    coordinates: seriesItem.points.map((point, index) => ({
      x: padding.left + (pointCount === 1 ? chartWidth / 2 : step * index),
      y:
        padding.top +
        chartHeight -
        ((point.value - displayMin) / displayRange) * chartHeight,
    })),
  }));
  const tickIndexes = getTickIndexes(pointCount);
  const activeIndex = hoveredIndex;
  const activeX =
    activeIndex === null
      ? null
      : padding.left + (pointCount === 1 ? chartWidth / 2 : step * activeIndex);
  const yAxisValues = [displayMax, displayMin + displayRange / 2, displayMin];
  const tooltipLeft =
    activeX === null
      ? 0
      : clamp((activeX / width) * 100, 12, 82);

  return (
    <div className="fund-overview__chart-shell">
      {activeIndex !== null ? (
        <div className="fund-overview__chart-tooltip" style={{ left: `${tooltipLeft}%`, top: '0.85rem' }}>
          <strong>{formatDateLabel(displaySeries[0].points[activeIndex].date)}</strong>
          <div className="fund-overview__chart-tooltip-list">
            {displaySeries.map((seriesItem) => (
              <span key={seriesItem.id}>
                <i className="fund-overview__legend-dot" style={{ background: seriesItem.color }} />
                {seriesItem.label}: {formatMetricValue(seriesItem.points[activeIndex].value, 'nav')}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-label="Net Asset Value for valgt utvalg"
        className="fund-overview__chart-svg"
        role="img"
        onMouseMove={(event) =>
          setHoveredIndex(getHoveredPointIndex(event, pointCount, width, padding))
        }
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {yAxisValues.map((axisValue) => {
          const y =
            padding.top +
            chartHeight -
            ((axisValue - displayMin) / displayRange) * chartHeight;

          return (
            <g key={axisValue}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(17, 24, 39, 0.08)"
                strokeDasharray="4 6"
              />
              <text
                x={width - padding.right}
                y={y - 6}
                className="fund-overview__chart-text fund-overview__chart-text--value"
                textAnchor="end"
              >
                {formatMetricValue(axisValue, 'nav')}
              </text>
            </g>
          );
        })}

        {activeX !== null ? (
          <line
            x1={activeX}
            y1={padding.top}
            x2={activeX}
            y2={padding.top + chartHeight}
            className="fund-overview__chart-hover-line"
          />
        ) : null}

        {coordinatesBySeries.length === 1 ? (
          <path
            d={buildAreaPath(coordinatesBySeries[0].coordinates, padding.top + chartHeight)}
            fill="rgba(15, 118, 110, 0.14)"
          />
        ) : null}

        {coordinatesBySeries.map((seriesItem) => (
          <g key={seriesItem.id}>
            <path
              d={buildLinePath(seriesItem.coordinates)}
              fill="none"
              stroke={seriesItem.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />

            {seriesItem.coordinates.map((point, index) =>
              activeIndex === index ? (
                <circle
                  key={`${seriesItem.id}-${seriesItem.points[index].date}`}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill={seriesItem.color}
                  className="fund-overview__chart-point"
                />
              ) : null,
            )}
          </g>
        ))}

        {tickIndexes.map((index) => (
          <text
            key={displaySeries[0].points[index].date}
            x={padding.left + (pointCount === 1 ? chartWidth / 2 : step * index)}
            y={height - 12}
            className="fund-overview__chart-text"
            textAnchor={index === 0 ? 'start' : index === pointCount - 1 ? 'end' : 'middle'}
          >
            {displaySeries[0].points[index].label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function FlowChart({
  combinedPoints,
  series,
}: {
  combinedPoints: FundOverviewFlowPoint[];
  series: FundOverviewLineSeries[];
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const displaySeries = series.filter((seriesItem) => seriesItem.points.length > 0);

  if (combinedPoints.length === 0 || displaySeries.length === 0) {
    return <div className="fund-overview__chart-empty">Ingen tegningsdata i valgt utvalg.</div>;
  }

  const width = 820;
  const height = 310;
  const padding = { top: 18, right: 20, bottom: 42, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const halfHeight = chartHeight / 2;
  const baselineY = padding.top + halfHeight;
  const pointCount = combinedPoints.length;
  const step = pointCount > 1 ? chartWidth / Math.max(pointCount - 1, 1) : chartWidth;
  const maxAbs = Math.max(
    1,
    ...combinedPoints.map((point) => Math.max(point.grossBuy, point.grossSell, Math.abs(point.net))),
    ...displaySeries.flatMap((seriesItem) => seriesItem.points.map((point) => Math.abs(point.value))),
  );
  const coordinatesBySeries = displaySeries.map((seriesItem) => ({
    ...seriesItem,
    coordinates: seriesItem.points.map((point, index) => ({
      x: padding.left + (pointCount === 1 ? chartWidth / 2 : step * index),
      y: baselineY - (point.value / maxAbs) * (halfHeight - 14),
    })),
  }));
  const tickIndexes = getTickIndexes(pointCount);
  const activeIndex = hoveredIndex;
  const activeX =
    activeIndex === null
      ? null
      : padding.left + (pointCount === 1 ? chartWidth / 2 : step * activeIndex);
  const tooltipLeft =
    activeX === null
      ? 0
      : clamp((activeX / width) * 100, 12, 82);

  return (
    <div className="fund-overview__chart-shell">
      {activeIndex !== null ? (
        <div className="fund-overview__chart-tooltip" style={{ left: `${tooltipLeft}%`, top: '0.85rem' }}>
          <strong>{formatDateLabel(combinedPoints[activeIndex].date)}</strong>
          <div className="fund-overview__chart-tooltip-list">
            <span>
              <i className="fund-overview__legend-dot fund-overview__legend-dot--buy" />
              Brutto kjøp: {formatMetricValue(combinedPoints[activeIndex].grossBuy, 'currency')}
            </span>
            <span>
              <i className="fund-overview__legend-dot fund-overview__legend-dot--sell" />
              Brutto salg: {formatMetricValue(combinedPoints[activeIndex].grossSell, 'currency')}
            </span>
            <span>
              <i className="fund-overview__legend-dot fund-overview__legend-dot--net" />
              Netto: {formatMetricValue(combinedPoints[activeIndex].net, 'currency')}
            </span>
            {displaySeries.length > 1
              ? displaySeries.map((seriesItem) => (
                  <span key={seriesItem.id}>
                    <i className="fund-overview__legend-dot" style={{ background: seriesItem.color }} />
                    {seriesItem.label}: {formatMetricValue(seriesItem.points[activeIndex].value, 'currency')}
                  </span>
                ))
              : null}
          </div>
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-label="Netto tegninger med brutto kjøp og brutto salg"
        className="fund-overview__chart-svg"
        role="img"
        onMouseMove={(event) =>
          setHoveredIndex(getHoveredPointIndex(event, pointCount, width, padding))
        }
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {[0.25, 0.5, 0.75].map((fraction) => (
          <g key={fraction}>
            <line
              x1={padding.left}
              y1={padding.top + fraction * halfHeight}
              x2={width - padding.right}
              y2={padding.top + fraction * halfHeight}
              stroke="rgba(17, 24, 39, 0.06)"
              strokeDasharray="4 6"
            />
            <line
              x1={padding.left}
              y1={baselineY + fraction * halfHeight}
              x2={width - padding.right}
              y2={baselineY + fraction * halfHeight}
              stroke="rgba(17, 24, 39, 0.06)"
              strokeDasharray="4 6"
            />
          </g>
        ))}

        <line
          x1={padding.left}
          y1={baselineY}
          x2={width - padding.right}
          y2={baselineY}
          stroke="rgba(17, 24, 39, 0.18)"
        />

        {activeX !== null ? (
          <line
            x1={activeX}
            y1={padding.top}
            x2={activeX}
            y2={padding.top + chartHeight}
            className="fund-overview__chart-hover-line"
          />
        ) : null}

        <text
          x={width - padding.right}
          y={padding.top - 2}
          className="fund-overview__chart-text fund-overview__chart-text--value"
          textAnchor="end"
        >
          {formatMetricValue(maxAbs, 'currency')}
        </text>
        <text
          x={width - padding.right}
          y={height - 48}
          className="fund-overview__chart-text fund-overview__chart-text--value"
          textAnchor="end"
        >
          -{formatMetricValue(maxAbs, 'currency')}
        </text>

        {combinedPoints.map((point, index) => {
          const centerX = padding.left + (pointCount === 1 ? chartWidth / 2 : step * index);
          const buyHeight = (point.grossBuy / maxAbs) * (halfHeight - 14);
          const sellHeight = (point.grossSell / maxAbs) * (halfHeight - 14);
          const barWidth = Math.max(4, Math.min(14, (pointCount === 1 ? chartWidth / 4 : step * 0.24)));

          return (
            <g key={point.date}>
              <rect
                x={centerX - barWidth - 2}
                y={baselineY - buyHeight}
                width={barWidth}
                height={buyHeight}
                rx="2"
                fill="#16a34a"
              />
              <rect
                x={centerX + 2}
                y={baselineY}
                width={barWidth}
                height={sellHeight}
                rx="2"
                fill="#dc2626"
              />
            </g>
          );
        })}

        {coordinatesBySeries.map((seriesItem) => (
          <g key={seriesItem.id}>
            <path
              d={buildLinePath(seriesItem.coordinates)}
              fill="none"
              stroke={seriesItem.color}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
            {seriesItem.coordinates.map((point, index) =>
              activeIndex === index ? (
                <circle
                  key={`${seriesItem.id}-${seriesItem.points[index].date}`}
                  cx={point.x}
                  cy={point.y}
                  r="4.5"
                  fill={seriesItem.color}
                  className="fund-overview__chart-point"
                />
              ) : null,
            )}
          </g>
        ))}

        {tickIndexes.map((index) => (
          <text
            key={combinedPoints[index].date}
            x={padding.left + (pointCount === 1 ? chartWidth / 2 : step * index)}
            y={height - 12}
            className="fund-overview__chart-text"
            textAnchor={index === 0 ? 'start' : index === pointCount - 1 ? 'end' : 'middle'}
          >
            {combinedPoints[index].label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function FundOverviewPage() {
  const [selectedFundId, setSelectedFundId] = useState('all');
  const [selectedClassId, setSelectedClassId] = useState<FundOverviewClassId>('all');
  const [selectedPeriodId, setSelectedPeriodId] = useState<FundOverviewPeriodId>('12m');
  const [selectedStartDate, setSelectedStartDate] = useState<string | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<string | undefined>(undefined);
  const [navGrouping, setNavGrouping] = useState<FundOverviewChartGrouping>('combined');
  const [flowGrouping, setFlowGrouping] = useState<FundOverviewChartGrouping>('combined');

  const overview = useMemo(
    () =>
      getFundOverviewData({
        fundId: selectedFundId,
        classId: selectedClassId,
        periodId: selectedPeriodId,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        navGrouping,
        flowGrouping,
      }),
    [
      flowGrouping,
      navGrouping,
      selectedClassId,
      selectedEndDate,
      selectedFundId,
      selectedPeriodId,
      selectedStartDate,
    ],
  );

  return (
    <div className="content-card fund-overview-page">
      <p className="content-card__eyebrow">Funds</p>
      <h1>Fondsoversikt</h1>
      <p className="content-card__description">
        Filtrer på fond, andelsklasse og periode for å følge kapital, eiere, utbytte og utvikling i ett samlet overblikk.
      </p>

      <section className="fund-overview__toolbar" aria-label="Filtre for fondsoversikt">
        <div className="fund-overview__toolbar-main">
          <div className="fund-overview__filter-grid">
            <label className="trade-field">
              <span>Fond</span>
              <select
                value={overview.filters.fundId}
                onChange={(event) => setSelectedFundId(event.target.value)}
              >
                {overview.fundOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="trade-field">
              <span>Klasse</span>
              <select
                value={overview.filters.classId}
                onChange={(event) => setSelectedClassId(event.target.value as FundOverviewClassId)}
              >
                {overview.classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="trade-field">
              <span>Periode</span>
              <select
                value={overview.filters.periodId}
                onChange={(event) => {
                  const nextPeriodId = event.target.value as FundOverviewPeriodId;
                  setSelectedPeriodId(nextPeriodId);

                  if (nextPeriodId === 'custom') {
                    setSelectedStartDate(overview.filters.startDate);
                    setSelectedEndDate(overview.filters.endDate);
                  } else {
                    setSelectedStartDate(undefined);
                    setSelectedEndDate(undefined);
                  }
                }}
              >
                {overview.periodOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <PeriodRangeSlider
            options={overview.availableDateOptions}
            startDate={overview.filters.startDate ?? overview.periodStartDate}
            endDate={overview.filters.endDate ?? overview.asOfDate}
            onStartChange={(date) => {
              setSelectedPeriodId('custom');
              setSelectedStartDate(date);
              setSelectedEndDate(overview.filters.endDate ?? overview.asOfDate);
            }}
            onEndChange={(date) => {
              setSelectedPeriodId('custom');
              setSelectedStartDate(overview.filters.startDate ?? overview.periodStartDate);
              setSelectedEndDate(date);
            }}
          />
        </div>

        <div className="fund-overview__toolbar-meta">
          <p className="fund-overview__toolbar-label">Siste datapunkt</p>
          <strong>{formatDateLabel(overview.asOfDate)}</strong>
          <span>
            {overview.selectedFundLabel} / {overview.selectedClassLabel} / {overview.selectedPeriodLabel}
          </span>
        </div>
      </section>

      <section className="fund-overview__metric-grid" aria-label="Nøkkeltall for valgt fondsutvalg">
        {overview.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="fund-overview__detail-grid" aria-label="Detaljer om valgt utvalg">
        <article className="fund-overview__detail-card">
          <p className="fund-overview__detail-label">Utvalg</p>
          <strong>
            {overview.selectedFundLabel} / {overview.selectedClassLabel}
          </strong>
          <span>{overview.notes[0]}</span>
        </article>

        <article className="fund-overview__detail-card">
          <p className="fund-overview__detail-label">Periode</p>
          <strong>{overview.selectedPeriodLabel}</strong>
          <span>
            {formatDateLabel(overview.periodStartDate)} - {formatDateLabel(overview.asOfDate)}
          </span>
        </article>

        <article className="fund-overview__detail-card">
          <p className="fund-overview__detail-label">Datagrunnlag</p>
          <strong>NAV, transaksjoner og utbytte</strong>
          <span>{overview.notes[1]}</span>
        </article>
      </section>

      <section className="data-table-card data-table-card--tight fund-overview__section">
        <div className="data-table-card__header fund-overview__section-header">
          <div>
            <p className="feature-section__eyebrow">NAV</p>
            <h2 className="data-table-card__title">Net Asset Value</h2>
            <p className="data-table-card__description">{overview.navSection.description}</p>
          </div>
        </div>

        <div className="fund-overview__section-grid">
          <div className="fund-overview__chart-card">
            <div className="fund-overview__chart-card-header">
              <div className="fund-overview__chart-card-copy">
                <strong>NAV-utvikling</strong>
                <span>
                  {formatDateLabel(overview.periodStartDate)} - {formatDateLabel(overview.asOfDate)}
                </span>
              </div>

              <label className="trade-field fund-overview__chart-select">
                <span>Vis som</span>
                <select
                  value={overview.navSection.activeGrouping}
                  onChange={(event) => setNavGrouping(event.target.value as FundOverviewChartGrouping)}
                >
                  {overview.navSection.groupingOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {overview.navSection.series.length > 1 ? (
              <div className="fund-overview__chart-legend">
                {overview.navSection.series.map((seriesItem) => (
                  <span key={seriesItem.id}>
                    <i className="fund-overview__legend-dot" style={{ background: seriesItem.color }} />
                    {seriesItem.label}
                  </span>
                ))}
              </div>
            ) : null}

            <NavChart series={overview.navSection.series} />
          </div>

          <SectionKpiGrid metrics={overview.navSection.kpis} />
        </div>
      </section>

      <section className="data-table-card data-table-card--tight fund-overview__section">
        <div className="data-table-card__header fund-overview__section-header">
          <div>
            <p className="feature-section__eyebrow">Tegninger</p>
            <h2 className="data-table-card__title">Netto tegninger</h2>
            <p className="data-table-card__description">{overview.flowSection.description}</p>
          </div>
        </div>

        <div className="fund-overview__section-grid">
          <div className="fund-overview__chart-card">
            <div className="fund-overview__chart-card-header">
              <div className="fund-overview__chart-card-copy">
                <strong>Brutto kjøp og brutto salg</strong>
                <span>Aggregert per {overview.flowSection.granularityLabel}</span>
              </div>

              <label className="trade-field fund-overview__chart-select">
                <span>Vis som</span>
                <select
                  value={overview.flowSection.activeGrouping}
                  onChange={(event) => setFlowGrouping(event.target.value as FundOverviewChartGrouping)}
                >
                  {overview.flowSection.groupingOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="fund-overview__chart-legend">
              <span>
                <i className="fund-overview__legend-dot fund-overview__legend-dot--buy" />
                Brutto kjøp
              </span>
              <span>
                <i className="fund-overview__legend-dot fund-overview__legend-dot--sell" />
                Brutto salg
              </span>
              {overview.flowSection.series.map((seriesItem) => (
                <span key={seriesItem.id}>
                  <i className="fund-overview__legend-dot" style={{ background: seriesItem.color }} />
                  {seriesItem.label === 'Kombinert' ? 'Netto tegninger' : seriesItem.label}
                </span>
              ))}
            </div>

            <FlowChart
              combinedPoints={overview.flowSection.combinedPoints}
              series={overview.flowSection.series}
            />
          </div>

          <SectionKpiGrid metrics={overview.flowSection.kpis} />
        </div>
      </section>

      <section className="data-table-card data-table-card--tight fund-overview__section">
        <div className="data-table-card__header fund-overview__section-header">
          <div>
            <p className="feature-section__eyebrow">Utbytte</p>
            <h2 className="data-table-card__title">Utbytteoversikt</h2>
            <p className="data-table-card__description">{overview.dividendSection.description}</p>
          </div>
        </div>

        <SectionKpiGrid metrics={overview.dividendSection.kpis} />

        <div className="table-responsive table-scroll fund-overview__table-scroll">
          <table className="data-table table align-middle mb-0">
            <thead>
              <tr>
                <th>Dato</th>
                <th>Investor</th>
                <th>Fond</th>
                <th>Klasse</th>
                <th>Beløp</th>
              </tr>
            </thead>
            <tbody>
              {overview.dividendSection.rows.length > 0 ? (
                overview.dividendSection.rows.map((row) => (
                  <tr key={row.tradeId}>
                    <td>{row.dateLabel}</td>
                    <td>
                      <div className="table-primary-cell">
                        <strong>{row.investorName}</strong>
                        <span>{row.investorType}</span>
                      </div>
                    </td>
                    <td>{row.fundLabel}</td>
                    <td>{row.classLabel}</td>
                    <td>{formatMetricValue(row.amount, 'currency')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="fund-overview__table-empty">
                    Ingen utbyttehendelser i valgt utvalg.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="data-table-card data-table-card--tight fund-overview__section">
        <div className="data-table-card__header fund-overview__section-header">
          <div>
            <p className="feature-section__eyebrow">Andelseiere</p>
            <h2 className="data-table-card__title">Topp andelseiere</h2>
            <p className="data-table-card__description">{overview.shareholderSection.description}</p>
          </div>
        </div>

        <SectionKpiGrid metrics={overview.shareholderSection.kpis} />

        <div className="table-responsive table-scroll fund-overview__table-scroll">
          <table className="data-table table align-middle mb-0">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Investor</th>
                <th>{overview.shareholderSection.showUnits ? 'Andeler' : 'Eksponeringer'}</th>
                <th>Markedsverdi</th>
                <th>Andel av AUM</th>
              </tr>
            </thead>
            <tbody>
              {overview.shareholderSection.rows.map((row, index) => (
                <tr key={row.customerId}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="table-primary-cell">
                      <strong>{row.investorName}</strong>
                      <span>
                        {row.investorType} / {row.investorCategory}
                      </span>
                    </div>
                  </td>
                  <td>
                    {overview.shareholderSection.showUnits
                      ? formatNumber(row.units)
                      : formatNumber(row.exposureCount, 0)}
                  </td>
                  <td>{formatMetricValue(row.marketValue, 'currency')}</td>
                  <td>{formatMetricValue(row.ownershipShare, 'percent')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default FundOverviewPage;
