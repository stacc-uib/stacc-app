import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { formatDateLabel } from '../../../shared/utils/formatDateLabel';
import { getFundOverviewData } from '../lib/getFundOverviewData';
import type {
  FundOverviewChartGrouping,
  FundOverviewCompositionPoint,
  FundOverviewDividendRow,
  FundOverviewFlowContributorRow,
  FundOverviewFlowPoint,
  FundOverviewLineSeries,
  FundOverviewMetric,
  FundOverviewMetricFormat,
  FundOverviewPeriodId,
  FundOverviewSelectOption,
  FundOverviewShareClassId,
  FundOverviewTopShareholder,
} from '../types/funds';

type ChartCoordinate = {
  x: number;
  y: number;
};

type ChartRange = {
  startIndex: number;
  endIndex: number;
};

type ChartDragState = {
  startIndex: number;
  pointerId: number;
} | null;

type ZoomHandle = 'start' | 'end' | 'window';

type ZoomDragState = {
  handle: ZoomHandle;
  pointerId: number;
  startIndex: number;
  range: ChartRange;
} | null;

type CompositionMode = 'funds' | 'classes' | 'investorCategories' | 'largestOwners';
export type NavValueMode = 'nav' | 'return';
type SortDirection = 'asc' | 'desc';
type SortState<TSortKey extends string> = {
  key: TSortKey;
  direction: SortDirection;
};
type DividendSortKey = 'date' | 'investorName' | 'fundLabel' | 'classLabel' | 'amount';
type ShareholderSortKey =
  | 'rank'
  | 'investorName'
  | 'units'
  | 'exposureCount'
  | 'marketValue'
  | 'ownershipShare';

const TABLE_PAGE_SIZE = 10;
const TOP_METRIC_IDS_TO_HIDE = new Set(['net-flow-ratio', 'dividend-yield']);
const FUND_CHART_PRIMARY = '#ff7415';
const FUND_CHART_MUTED = '#6b7280';
const FUND_CHART_NET = '#1f2937';
const FUND_CHART_AREA_FILL = 'rgba(255, 116, 21, 0.14)';

const compositionModeOptions: { id: CompositionMode; label: string }[] = [
  { id: 'funds', label: 'Fond' },
  { id: 'classes', label: 'Andelsklasse' },
  { id: 'investorCategories', label: 'Investorsegment' },
  { id: 'largestOwners', label: 'Storste eiere' },
];

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

export function formatMetricValue(value: number, format: FundOverviewMetricFormat) {
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
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

function getChartXForIndex(index: number, pointCount: number, chartWidth: number, paddingLeft: number) {
  if (pointCount <= 1) {
    return paddingLeft + chartWidth / 2;
  }

  return paddingLeft + (chartWidth / Math.max(pointCount - 1, 1)) * index;
}

function getPointIndexFromClientX(
  clientX: number,
  svgElement: SVGSVGElement,
  pointCount: number,
  width: number,
  padding: { left: number; right: number },
) {
  if (pointCount <= 1) {
    return 0;
  }

  const bounds = svgElement.getBoundingClientRect();
  const relativeX = ((clientX - bounds.left) / bounds.width) * width;
  const chartWidth = width - padding.left - padding.right;
  const step = chartWidth / Math.max(pointCount - 1, 1);
  const clampedX = clamp(relativeX, padding.left, width - padding.right);
  return clamp(Math.round((clampedX - padding.left) / step), 0, pointCount - 1);
}

function normalizeChartRange(startIndex: number, endIndex: number): ChartRange {
  return {
    startIndex: Math.min(startIndex, endIndex),
    endIndex: Math.max(startIndex, endIndex),
  };
}

function getClampedChartRange(range: ChartRange | null, pointCount: number): ChartRange | null {
  if (!range || pointCount <= 0) {
    return null;
  }

  return normalizeChartRange(
    clamp(range.startIndex, 0, pointCount - 1),
    clamp(range.endIndex, 0, pointCount - 1),
  );
}

function getFullChartRange(pointCount: number): ChartRange {
  return {
    startIndex: 0,
    endIndex: Math.max(pointCount - 1, 0),
  };
}

function isFullChartRange(range: ChartRange, pointCount: number) {
  return range.startIndex === 0 && range.endIndex === Math.max(pointCount - 1, 0);
}

function getRangeWindowSize(range: ChartRange) {
  return range.endIndex - range.startIndex + 1;
}

function getVisibleSelectionRange(selectionRange: ChartRange | null, zoomRange: ChartRange) {
  if (!selectionRange) {
    return null;
  }

  const startIndex = Math.max(selectionRange.startIndex, zoomRange.startIndex);
  const endIndex = Math.min(selectionRange.endIndex, zoomRange.endIndex);

  if (startIndex > endIndex) {
    return null;
  }

  return {
    startIndex: startIndex - zoomRange.startIndex,
    endIndex: endIndex - zoomRange.startIndex,
  } satisfies ChartRange;
}

function getWheelZoomRange(
  activeRange: ChartRange,
  focusIndex: number,
  scrollDelta: number,
  pointCount: number,
) {
  if (pointCount <= 1) {
    return getFullChartRange(pointCount);
  }

  const currentWindowSize = getRangeWindowSize(activeRange);
  const zoomFactor = scrollDelta > 0 ? 1.28 : 0.76;
  const minWindowSize = Math.min(2, pointCount);
  const nextWindowSize = clamp(Math.round(currentWindowSize * zoomFactor), minWindowSize, pointCount);
  const focusRatio =
    currentWindowSize <= 1 ? 0.5 : (focusIndex - activeRange.startIndex) / Math.max(currentWindowSize - 1, 1);
  const nextStartIndex = clamp(
    Math.round(focusIndex - focusRatio * (nextWindowSize - 1)),
    0,
    Math.max(pointCount - nextWindowSize, 0),
  );

  return {
    startIndex: nextStartIndex,
    endIndex: nextStartIndex + nextWindowSize - 1,
  } satisfies ChartRange;
}

function getCenteredChartRange(centerIndex: number, windowSize: number, pointCount: number) {
  const safeWindowSize = clamp(windowSize, Math.min(2, pointCount), pointCount);
  const startIndex = clamp(
    Math.round(centerIndex - (safeWindowSize - 1) / 2),
    0,
    Math.max(pointCount - safeWindowSize, 0),
  );

  return {
    startIndex,
    endIndex: startIndex + safeWindowSize - 1,
  } satisfies ChartRange;
}

function getSeriesAsPercentChangeFromStart(series: FundOverviewLineSeries[]): FundOverviewLineSeries[] {
  return series.map((seriesItem) => {
    const startValue = seriesItem.points[0]?.value ?? 0;

    return {
      ...seriesItem,
      points: seriesItem.points.map((point) => ({
        ...point,
        value: startValue > 0 ? point.value / startValue - 1 : 0,
      })),
    };
  });
}

function getChartDataKey(series: FundOverviewLineSeries[]) {
  return series
    .map((seriesItem) => {
      const firstPoint = seriesItem.points[0];
      const lastPoint = seriesItem.points[seriesItem.points.length - 1];
      return `${seriesItem.id}:${firstPoint?.date ?? 'empty'}:${lastPoint?.date ?? 'empty'}:${seriesItem.points.length}`;
    })
    .join('|');
}

function compareString(left: string, right: string) {
  return left.localeCompare(right, 'nb', { sensitivity: 'base' });
}

function getNextSortState<TSortKey extends string>(currentSort: SortState<TSortKey>, key: TSortKey) {
  if (currentSort.key !== key) {
    return { key, direction: 'asc' } satisfies SortState<TSortKey>;
  }

  return {
    key,
    direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
  } satisfies SortState<TSortKey>;
}

function getPaginatedRows<T>(rows: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = clamp(page, 1, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, rows.length);

  return {
    currentPage,
    totalPages,
    rows: rows.slice(startIndex, endIndex),
    startRow: rows.length === 0 ? 0 : startIndex + 1,
    endRow: endIndex,
  };
}

function getMultiSelectSummary(
  options: FundOverviewSelectOption[],
  selectedIds: string[],
  allLabel: string,
) {
  if (selectedIds.length === options.length) {
    return allLabel;
  }

  const labels = options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => option.label);

  return labels.length === 0 ? allLabel : labels.join(', ');
}

function usePreventWheelScroll<TElement extends HTMLElement>() {
  const ref = useRef<TElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, []);

  return ref;
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

function MetricRowList({ metric }: { metric: FundOverviewMetric }) {
  const rows = metric.rows ?? [];

  return (
    <div className="fund-overview__metric-row-list">
      {rows.map((row) => (
        <div key={row.id} className="fund-overview__metric-row">
          <span>{row.label}</span>
          <strong>{formatMetricValue(row.value, row.format ?? metric.format)}</strong>
          {row.meta ? <small>{row.meta}</small> : null}
        </div>
      ))}
    </div>
  );
}

function SectionKpiGrid({
  metrics,
  compact = false,
}: {
  metrics: FundOverviewMetric[];
  compact?: boolean;
}) {
  return (
    <div className={`fund-overview__section-kpi-grid${compact ? ' fund-overview__section-kpi-grid--compact' : ''}`}>
      {metrics.map((metric) => (
        <article key={metric.id} className="fund-overview__section-kpi">
          <p className="fund-overview__section-kpi-label">{metric.label}</p>
          {metric.rows?.length ? (
            <MetricRowList metric={metric} />
          ) : (
            <>
              <p className="fund-overview__section-kpi-value">{formatMetricValue(metric.value, metric.format)}</p>
              <MetricDelta delta={metric.delta} />
              <p className="fund-overview__section-kpi-meta">{metric.meta}</p>
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function PairedNavMetric({ metric }: { metric: FundOverviewMetric }) {
  if (metric.rows?.length) {
    return (
      <div className="fund-overview__paired-kpi-block">
        <p className="fund-overview__paired-kpi-subtitle">{metric.label}</p>
        <MetricRowList metric={metric} />
      </div>
    );
  }

  return (
    <div className="fund-overview__paired-kpi-row">
      <span>{metric.label}</span>
      <strong>{formatMetricValue(metric.value, metric.format)}</strong>
      <small>{metric.meta}</small>
    </div>
  );
}

function PairedNavKpiGrid({ metrics }: { metrics: FundOverviewMetric[] }) {
  const navStart = metrics.find((metric) => metric.id === 'nav-start');
  const navEnd = metrics.find((metric) => metric.id === 'nav-end');
  const navHigh = metrics.find((metric) => metric.id === 'nav-high');
  const navLow = metrics.find((metric) => metric.id === 'nav-low');
  const pairs = [
    { id: 'start-end', title: 'NAV start / siste', metrics: [navStart, navEnd] },
    { id: 'high-low', title: 'NAV topp / bunn', metrics: [navHigh, navLow] },
  ];

  return (
    <div className="fund-overview__paired-kpi-grid">
      {pairs.map((pair) => (
        <article key={pair.id} className="fund-overview__paired-kpi">
          <p className="fund-overview__section-kpi-label">{pair.title}</p>
          {pair.metrics.map((metric) =>
            metric ? (
              <PairedNavMetric key={metric.id} metric={metric} />
            ) : null,
          )}
        </article>
      ))}
    </div>
  );
}

function CustomerOverviewLink({
  customerId,
  children,
}: {
  customerId: string;
  children: string;
}) {
  return (
    <a
      className="fund-overview__owner-link"
      href={`#kundeoversikt/${customerId}`}
      aria-label={`Apne kundeoversikt for ${children}`}
    >
      {children}
    </a>
  );
}

function SortableHeader<TSortKey extends string>({
  label,
  sortKey,
  sortState,
  onSort,
}: {
  label: string;
  sortKey: TSortKey;
  sortState: SortState<TSortKey>;
  onSort: (key: TSortKey) => void;
}) {
  const isActive = sortState.key === sortKey;

  return (
    <button
      type="button"
      className={`fund-overview__sort-button${isActive ? ' fund-overview__sort-button--active' : ''}`}
      onClick={() => onSort(sortKey)}
      aria-sort={isActive ? (sortState.direction === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <span>{label}</span>
      <span aria-hidden="true">{isActive ? (sortState.direction === 'asc' ? '\u2191' : '\u2193') : '\u2195'}</span>
    </button>
  );
}

function MultiSelectFilter({
  label,
  options,
  selectedIds,
  allLabel,
  onChange,
}: {
  label: string;
  options: FundOverviewSelectOption[];
  selectedIds: string[];
  allLabel: string;
  onChange: (selectedIds: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const optionIds = options.map((option) => option.id);
  const allSelected = selectedIds.length === optionIds.length;
  const selectedSummary = getMultiSelectSummary(options, selectedIds, allLabel);

  const toggleAll = () => {
    onChange(allSelected ? [] : optionIds);
  };

  const toggleOption = (optionId: string) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
      return;
    }

    onChange([...selectedIds, optionId]);
  };

  return (
    <div className="fund-overview__multi-filter">
      <span className="fund-overview__range-label">{label}</span>
      <div className="fund-overview__multi-filter-control">
        <button
          type="button"
          className="fund-overview__multi-filter-button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          <span>{selectedSummary}</span>
          <span aria-hidden="true">{isOpen ? '\u25b2' : '\u25bc'}</span>
        </button>
        {isOpen ? (
          <div className="fund-overview__multi-filter-menu">
            <label className="fund-overview__multi-filter-option fund-overview__multi-filter-option--all">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              <span>{allLabel}</span>
            </label>
            {options.map((option) => (
              <label key={option.id} className="fund-overview__multi-filter-option">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(option.id)}
                  onChange={() => toggleOption(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
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
  const rawStartIndex = dateIndexByDate.get(startDate) ?? 0;
  const rawEndIndex = dateIndexByDate.get(endDate) ?? maxIndex;
  const startIndex = Math.min(rawStartIndex, rawEndIndex);
  const endIndex = Math.max(rawStartIndex, rawEndIndex);
  const startPercent = maxIndex === 0 ? 0 : (startIndex / maxIndex) * 100;
  const endPercent = maxIndex === 0 ? 100 : (endIndex / maxIndex) * 100;

  return (
    <div className="fund-overview__range-card">
      <div className="fund-overview__range-header">
        <div>
          <p className="fund-overview__range-label">Datointervall</p>
          <strong>
            {formatDateLabel(options[startIndex]?.date ?? startDate)} - {formatDateLabel(options[endIndex]?.date ?? endDate)}
          </strong>
        </div>
        <span className="fund-overview__range-caption">{formatNumber(options.length, 0)} tilgjengelige NAV-datoer</span>
      </div>

      <div className="fund-overview__range-values">
        <span>Start: {formatDateLabel(options[startIndex]?.date ?? startDate)}</span>
        <span>Slutt: {formatDateLabel(options[endIndex]?.date ?? endDate)}</span>
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
          aria-label="Velg startdato for datointervall"
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
          aria-label="Velg sluttdato for datointervall"
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

function MiniLineOverview({
  series,
  zoomRange,
  onZoomRangeChange,
}: {
  series: FundOverviewLineSeries[];
  zoomRange: ChartRange;
  onZoomRangeChange: (range: ChartRange) => void;
}) {
  const [dragState, setDragState] = useState<ZoomDragState>(null);
  const displaySeries = series.filter((seriesItem) => seriesItem.points.length > 0);

  if (displaySeries.length === 0) {
    return null;
  }

  const width = 900;
  const height = 58;
  const padding = { top: 7, right: 16, bottom: 9, left: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const pointCount = displaySeries[0].points.length;

  if (pointCount <= 1) {
    return null;
  }

  const values = displaySeries.flatMap((seriesItem) => seriesItem.points.map((point) => point.value));
  const valueMin = Math.min(...values);
  const valueMax = Math.max(...values);
  const valueRange = valueMax - valueMin || Math.max(Math.abs(valueMax), 1);
  const displayMin = valueMin - valueRange * 0.1;
  const displayMax = valueMax + valueRange * 0.1;
  const displayRange = displayMax - displayMin || 1;
  const safeZoomRange = getClampedChartRange(zoomRange, pointCount) ?? getFullChartRange(pointCount);
  const startX = getChartXForIndex(safeZoomRange.startIndex, pointCount, chartWidth, padding.left);
  const endX = getChartXForIndex(safeZoomRange.endIndex, pointCount, chartWidth, padding.left);
  const selectionX = Math.min(startX, endX);
  const selectionWidth = Math.max(Math.abs(endX - startX), 4);
  const handleWidth = 10;
  const getIndex = (event: ReactPointerEvent<SVGSVGElement>) =>
    getPointIndexFromClientX(event.clientX, event.currentTarget, pointCount, width, padding);
  const getIndexFromElement = (event: ReactPointerEvent<SVGElement>) => {
    const svgElement = event.currentTarget.ownerSVGElement;

    if (!svgElement) {
      return safeZoomRange.startIndex;
    }

    return getPointIndexFromClientX(event.clientX, svgElement, pointCount, width, padding);
  };
  const emitRange = (nextRange: ChartRange) => {
    const safeRange = getClampedChartRange(nextRange, pointCount) ?? getFullChartRange(pointCount);
    onZoomRangeChange(safeRange);
  };
  const updateDragRange = (nextIndex: number) => {
    if (!dragState) {
      return;
    }

    if (dragState.handle === 'start') {
      emitRange({
        startIndex: Math.min(nextIndex, dragState.range.endIndex - 1),
        endIndex: dragState.range.endIndex,
      });
      return;
    }

    if (dragState.handle === 'end') {
      emitRange({
        startIndex: dragState.range.startIndex,
        endIndex: Math.max(nextIndex, dragState.range.startIndex + 1),
      });
      return;
    }

    const windowSize = getRangeWindowSize(dragState.range);
    const maxStart = Math.max(pointCount - windowSize, 0);
    const nextStartIndex = clamp(dragState.range.startIndex + nextIndex - dragState.startIndex, 0, maxStart);

    emitRange({
      startIndex: nextStartIndex,
      endIndex: Math.min(nextStartIndex + windowSize - 1, pointCount - 1),
    });
  };
  const startDragFromSvg = (event: ReactPointerEvent<SVGSVGElement>) => {
    const nextIndex = getIndex(event);
    const nextRange = getCenteredChartRange(nextIndex, getRangeWindowSize(safeZoomRange), pointCount);

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    emitRange(nextRange);
    setDragState({
      handle: 'window',
      pointerId: event.pointerId,
      startIndex: nextIndex,
      range: nextRange,
    });
  };
  const startDragFromElement = (event: ReactPointerEvent<SVGElement>, handle: ZoomHandle) => {
    const svgElement = event.currentTarget.ownerSVGElement;

    if (!svgElement) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    svgElement.setPointerCapture(event.pointerId);
    setDragState({
      handle,
      pointerId: event.pointerId,
      startIndex: getIndexFromElement(event),
      range: safeZoomRange,
    });
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="fund-overview__mini-chart"
      aria-label="Zoomintervall"
      role="img"
      onPointerDown={startDragFromSvg}
      onPointerMove={(event) => {
        if (!dragState) {
          return;
        }

        event.preventDefault();
        updateDragRange(getIndex(event));
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }

        setDragState(null);
      }}
      onPointerCancel={() => setDragState(null)}
    >
      <rect
        x={padding.left}
        y={padding.top}
        width={chartWidth}
        height={chartHeight}
        className="fund-overview__mini-chart-track"
      />
      {displaySeries.map((seriesItem) => {
        const coordinates = seriesItem.points.map((point, index) => ({
          x: getChartXForIndex(index, pointCount, chartWidth, padding.left),
          y: padding.top + chartHeight - ((point.value - displayMin) / displayRange) * chartHeight,
        }));

        return (
          <path
            key={seriesItem.id}
            d={buildLinePath(coordinates)}
            fill="none"
            stroke={seriesItem.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            opacity="0.65"
          />
        );
      })}
      <rect
        x={selectionX}
        y={padding.top + 1}
        width={selectionWidth}
        height={chartHeight - 2}
        className="fund-overview__mini-chart-window"
        onPointerDown={(event) => startDragFromElement(event, 'window')}
      />
      <rect
        x={startX - handleWidth / 2}
        y={padding.top - 2}
        width={handleWidth}
        height={chartHeight + 4}
        rx="2"
        className="fund-overview__mini-chart-handle"
        onPointerDown={(event) => startDragFromElement(event, 'start')}
      />
      <rect
        x={endX - handleWidth / 2}
        y={padding.top - 2}
        width={handleWidth}
        height={chartHeight + 4}
        rx="2"
        className="fund-overview__mini-chart-handle"
        onPointerDown={(event) => startDragFromElement(event, 'end')}
      />
    </svg>
  );
}

function ChartRangeBadge({
  range,
  pointCount,
  onReset,
}: {
  range: ChartRange;
  pointCount: number;
  onReset: () => void;
}) {
  const isFullRange = isFullChartRange(range, pointCount);

  return (
    <div className="fund-overview__chart-actions">
      <span>
        {isFullRange
          ? 'Viser hele perioden'
          : `Zoom: punkt ${formatNumber(range.startIndex + 1, 0)}-${formatNumber(range.endIndex + 1, 0)}`}
      </span>
      <button type="button" onClick={onReset} disabled={isFullRange}>
        Nullstill zoom
      </button>
    </div>
  );
}

function LineRangeSummary({
  range,
  series,
  mode,
}: {
  range: ChartRange | null;
  series: FundOverviewLineSeries[];
  mode: NavValueMode;
}) {
  if (!range || range.endIndex <= range.startIndex || series.length === 0) {
    return null;
  }

  const startPoint = series[0]?.points[range.startIndex];
  const endPoint = series[0]?.points[range.endIndex];

  if (!startPoint || !endPoint) {
    return null;
  }

  return (
    <div className="fund-overview__chart-period">
      <div>
        <span>Valgt intervall</span>
        <strong>
          {formatDateLabel(startPoint.date)} - {formatDateLabel(endPoint.date)}
        </strong>
      </div>
      <div className="fund-overview__chart-period-list">
        {series.map((seriesItem) => {
          const seriesStart = seriesItem.points[range.startIndex];
          const seriesEnd = seriesItem.points[range.endIndex];

          if (!seriesStart || !seriesEnd) {
            return null;
          }

          const delta = seriesEnd.value - seriesStart.value;
          const relativeDelta = seriesStart.value !== 0 ? seriesEnd.value / seriesStart.value - 1 : 0;

          return (
            <span key={seriesItem.id}>
              <i className="fund-overview__legend-dot" style={{ background: seriesItem.color }} />
              {seriesItem.label}:{' '}
              {mode === 'nav'
                ? `${formatSignedMetricValue(delta, 'nav')} (${formatSignedMetricValue(relativeDelta, 'percent')})`
                : formatSignedMetricValue(delta, 'percent')}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function FlowRangeSummary({
  range,
  combinedPoints,
}: {
  range: ChartRange | null;
  combinedPoints: FundOverviewFlowPoint[];
}) {
  if (!range || range.endIndex <= range.startIndex) {
    return null;
  }

  const selectedPoints = combinedPoints.slice(range.startIndex, range.endIndex + 1);
  const startPoint = selectedPoints[0];
  const endPoint = selectedPoints[selectedPoints.length - 1];

  if (!startPoint || !endPoint) {
    return null;
  }

  const grossBuy = selectedPoints.reduce((total, point) => total + point.grossBuy, 0);
  const grossSell = selectedPoints.reduce((total, point) => total + point.grossSell, 0);
  const net = selectedPoints.reduce((total, point) => total + point.net, 0);

  return (
    <div className="fund-overview__chart-period">
      <div>
        <span>Valgt intervall</span>
        <strong>
          {formatDateLabel(startPoint.date)} - {formatDateLabel(endPoint.date)}
        </strong>
      </div>
      <div className="fund-overview__chart-period-list">
        <span>
          <i className="fund-overview__legend-dot fund-overview__legend-dot--buy" />
          Tegninger: {formatMetricValue(grossBuy, 'currency')}
        </span>
        <span>
          <i className="fund-overview__legend-dot fund-overview__legend-dot--sell" />
          Innløsninger: {formatMetricValue(grossSell, 'currency')}
        </span>
        <span>
          <i className="fund-overview__legend-dot fund-overview__legend-dot--net" />
          Nettoflyt: {formatSignedMetricValue(net, 'currency')}
        </span>
      </div>
    </div>
  );
}

export function LineChart({
  series,
  mode = 'return',
  compact = false,
}: {
  series: FundOverviewLineSeries[];
  mode?: NavValueMode;
  compact?: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectionRange, setSelectionRange] = useState<ChartRange | null>(null);
  const [zoomRange, setZoomRange] = useState<ChartRange | null>(null);
  const [dragState, setDragState] = useState<ChartDragState>(null);
  const chartShellRef = usePreventWheelScroll<HTMLDivElement>();
  const rawDisplaySeries = series.filter((seriesItem) => seriesItem.points.length > 0);
  const displaySeries = mode === 'return' ? getSeriesAsPercentChangeFromStart(rawDisplaySeries) : rawDisplaySeries;
  const chartDataKey = `${mode}:${getChartDataKey(rawDisplaySeries)}`;

  useEffect(() => {
    setHoveredIndex(null);
    setSelectionRange(null);
    setZoomRange(null);
    setDragState(null);
  }, [chartDataKey]);

  if (displaySeries.length === 0) {
    return <div className="fund-overview__chart-empty">Ingen NAV-data i valgt utvalg.</div>;
  }

  const width = 900;
  const height = 300;
  const padding = { top: 18, right: 64, bottom: 36, left: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const totalPointCount = displaySeries[0].points.length;
  const activeZoomRange = getClampedChartRange(zoomRange, totalPointCount) ?? getFullChartRange(totalPointCount);
  const visibleSeries = displaySeries.map((seriesItem) => ({
    ...seriesItem,
    points: seriesItem.points.slice(activeZoomRange.startIndex, activeZoomRange.endIndex + 1),
  }));
  const pointCount = visibleSeries[0].points.length;
  const values = visibleSeries.flatMap((seriesItem) => seriesItem.points.map((point) => point.value));
  const valueMin = Math.min(...values);
  const valueMax = Math.max(...values);
  const valueRange = valueMax - valueMin || Math.max(Math.abs(valueMax), Math.abs(valueMin), 0.01);
  const displayMin = mode === 'nav' ? Math.max(0, valueMin - valueRange * 0.16) : valueMin - valueRange * 0.18;
  const displayMax = valueMax + valueRange * 0.18;
  const displayRange = displayMax - displayMin || 1;
  const coordinatesBySeries = visibleSeries.map((seriesItem) => ({
    ...seriesItem,
    coordinates: seriesItem.points.map((point, index) => ({
      x: getChartXForIndex(index, pointCount, chartWidth, padding.left),
      y: padding.top + chartHeight - ((point.value - displayMin) / displayRange) * chartHeight,
    })),
  }));
  const tickIndexes = getTickIndexes(pointCount);
  const axisFormat: FundOverviewMetricFormat = mode === 'return' ? 'percent' : 'nav';
  const yAxisValues = [displayMax, displayMin + displayRange / 2, displayMin];
  const activeIndex = hoveredIndex;
  const activeX = activeIndex === null ? null : getChartXForIndex(activeIndex, pointCount, chartWidth, padding.left);
  const activePoint = activeIndex === null ? null : visibleSeries[0].points[activeIndex];
  const tooltipLeft = activeX === null ? 0 : clamp((activeX / width) * 100, 12, 82);
  const zeroLineY =
    mode === 'return' && displayMin <= 0 && displayMax >= 0
      ? padding.top + chartHeight - ((0 - displayMin) / displayRange) * chartHeight
      : null;
  const visibleSelectionRange = getVisibleSelectionRange(selectionRange, activeZoomRange);
  const selectionStartX =
    visibleSelectionRange === null
      ? null
      : getChartXForIndex(visibleSelectionRange.startIndex, pointCount, chartWidth, padding.left);
  const selectionEndX =
    visibleSelectionRange === null
      ? null
      : getChartXForIndex(visibleSelectionRange.endIndex, pointCount, chartWidth, padding.left);
  const selectionX =
    selectionStartX === null || selectionEndX === null ? null : Math.min(selectionStartX, selectionEndX);
  const selectionWidth =
    selectionStartX === null || selectionEndX === null ? 0 : Math.max(Math.abs(selectionEndX - selectionStartX), 4);
  const getLocalIndex = (event: ReactPointerEvent<SVGSVGElement> | ReactWheelEvent<SVGSVGElement>) =>
    getPointIndexFromClientX(event.clientX, event.currentTarget, pointCount, width, padding);
  const getAbsoluteIndex = (event: ReactPointerEvent<SVGSVGElement> | ReactWheelEvent<SVGSVGElement>) =>
    activeZoomRange.startIndex + getLocalIndex(event);
  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) {
      return;
    }

    const nextIndex = getAbsoluteIndex(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ startIndex: nextIndex, pointerId: event.pointerId });
    setHoveredIndex(nextIndex - activeZoomRange.startIndex);
    setSelectionRange(null);
  };
  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const nextLocalIndex = getLocalIndex(event);
    const nextAbsoluteIndex = activeZoomRange.startIndex + nextLocalIndex;
    setHoveredIndex(nextLocalIndex);

    if (dragState) {
      setSelectionRange(normalizeChartRange(dragState.startIndex, nextAbsoluteIndex));
    }
  };
  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragState) {
      return;
    }

    const nextRange = normalizeChartRange(dragState.startIndex, getAbsoluteIndex(event));
    setDragState(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setSelectionRange(nextRange.endIndex > nextRange.startIndex ? nextRange : null);
  };
  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();

    const scrollDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

    if (scrollDelta === 0) {
      return;
    }

    const focusIndex = getAbsoluteIndex(event);
    const nextRange = getWheelZoomRange(activeZoomRange, focusIndex, scrollDelta, totalPointCount);
    setZoomRange(isFullChartRange(nextRange, totalPointCount) ? null : nextRange);
    setHoveredIndex(clamp(focusIndex - nextRange.startIndex, 0, getRangeWindowSize(nextRange) - 1));
  };

  return (
    <div className="fund-overview__chart-shell" ref={chartShellRef}>
      {activeIndex !== null && activePoint ? (
        <div className="fund-overview__chart-tooltip" style={{ left: `${tooltipLeft}%`, top: '0.85rem' }}>
          <strong>{formatDateLabel(activePoint.date)}</strong>
          <div className="fund-overview__chart-tooltip-list">
            {visibleSeries.map((seriesItem) => (
              <span key={seriesItem.id}>
                <i className="fund-overview__legend-dot" style={{ background: seriesItem.color }} />
                {seriesItem.label}: {formatMetricValue(seriesItem.points[activeIndex].value, axisFormat)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-label={mode === 'return' ? 'Prosentvis NAV-endring fra grafstart' : 'NAV-verdi over tid per fond'}
        className="fund-overview__chart-svg"
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={() => {
          if (!dragState) {
            setHoveredIndex(null);
          }
        }}
        onWheel={handleWheel}
      >
        {yAxisValues.map((axisValue) => {
          const y = padding.top + chartHeight - ((axisValue - displayMin) / displayRange) * chartHeight;

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
                x={width - 8}
                y={y - 6}
                className="fund-overview__chart-text fund-overview__chart-text--value"
                textAnchor="end"
              >
                {formatMetricValue(axisValue, axisFormat)}
              </text>
            </g>
          );
        })}

        {zeroLineY !== null ? (
          <g>
            <line
              x1={padding.left}
              y1={zeroLineY}
              x2={width - padding.right}
              y2={zeroLineY}
              className="fund-overview__chart-zero-line"
            />
            <text x={padding.left + 8} y={zeroLineY - 7} className="fund-overview__chart-zero-label">
              0%
            </text>
          </g>
        ) : null}

        {activeX !== null ? (
          <line
            x1={activeX}
            y1={padding.top}
            x2={activeX}
            y2={padding.top + chartHeight}
            className="fund-overview__chart-hover-line"
          />
        ) : null}

        {selectionX !== null ? (
          <rect
            x={selectionX}
            y={padding.top}
            width={selectionWidth}
            height={chartHeight}
            className="fund-overview__chart-selection"
          />
        ) : null}

        {coordinatesBySeries.length === 1 ? (
          <path d={buildAreaPath(coordinatesBySeries[0].coordinates, padding.top + chartHeight)} fill={FUND_CHART_AREA_FILL} />
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
            {activeIndex !== null && seriesItem.coordinates[activeIndex] ? (
              <circle
                cx={seriesItem.coordinates[activeIndex].x}
                cy={seriesItem.coordinates[activeIndex].y}
                r="5"
                fill={seriesItem.color}
                className="fund-overview__chart-point"
              />
            ) : null}
          </g>
        ))}

        {tickIndexes.map((index) => (
          <text
            key={visibleSeries[0].points[index].date}
            x={getChartXForIndex(index, pointCount, chartWidth, padding.left)}
            y={height - 12}
            className="fund-overview__chart-text"
            textAnchor={index === 0 ? 'start' : index === pointCount - 1 ? 'end' : 'middle'}
          >
            {visibleSeries[0].points[index].label}
          </text>
        ))}
      </svg>
      <LineRangeSummary range={selectionRange} series={displaySeries} mode={mode} />
      {!compact && (
        <>
          <ChartRangeBadge range={activeZoomRange} pointCount={totalPointCount} onReset={() => setZoomRange(null)} />
          <MiniLineOverview
            series={displaySeries}
            zoomRange={activeZoomRange}
            onZoomRangeChange={(range) => setZoomRange(isFullChartRange(range, totalPointCount) ? null : range)}
          />
        </>
      )}
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
  const [selectionRange, setSelectionRange] = useState<ChartRange | null>(null);
  const [zoomRange, setZoomRange] = useState<ChartRange | null>(null);
  const [dragState, setDragState] = useState<ChartDragState>(null);
  const chartShellRef = usePreventWheelScroll<HTMLDivElement>();
  const displaySeries = series.filter((seriesItem) => seriesItem.points.length > 0);
  const chartDataKey = `${combinedPoints[0]?.date ?? 'empty'}:${combinedPoints[combinedPoints.length - 1]?.date ?? 'empty'}:${combinedPoints.length}:${getChartDataKey(displaySeries)}`;

  useEffect(() => {
    setHoveredIndex(null);
    setSelectionRange(null);
    setZoomRange(null);
    setDragState(null);
  }, [chartDataKey]);

  if (combinedPoints.length === 0 || displaySeries.length === 0) {
    return <div className="fund-overview__chart-empty">Ingen kapitalflyt i valgt utvalg.</div>;
  }

  const width = 900;
  const height = 330;
  const padding = { top: 18, right: 64, bottom: 36, left: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const halfHeight = chartHeight / 2;
  const baselineY = padding.top + halfHeight;
  const totalPointCount = combinedPoints.length;
  const activeZoomRange = getClampedChartRange(zoomRange, totalPointCount) ?? getFullChartRange(totalPointCount);
  const visibleCombinedPoints = combinedPoints.slice(activeZoomRange.startIndex, activeZoomRange.endIndex + 1);
  const visibleSeries = displaySeries.map((seriesItem) => ({
    ...seriesItem,
    points: seriesItem.points.slice(activeZoomRange.startIndex, activeZoomRange.endIndex + 1),
  }));
  const pointCount = visibleCombinedPoints.length;
  const maxAbs = Math.max(
    1,
    ...visibleCombinedPoints.map((point) => Math.max(point.grossBuy, point.grossSell, Math.abs(point.net))),
    ...visibleSeries.flatMap((seriesItem) => seriesItem.points.map((point) => Math.abs(point.value))),
  );
  const coordinatesBySeries = visibleSeries.map((seriesItem) => ({
    ...seriesItem,
    coordinates: seriesItem.points.map((point, index) => ({
      x: getChartXForIndex(index, pointCount, chartWidth, padding.left),
      y: baselineY - (point.value / maxAbs) * (halfHeight - 14),
    })),
  }));
  const tickIndexes = getTickIndexes(pointCount);
  const activeIndex = hoveredIndex;
  const activeX = activeIndex === null ? null : getChartXForIndex(activeIndex, pointCount, chartWidth, padding.left);
  const activePoint = activeIndex === null ? null : visibleCombinedPoints[activeIndex];
  const tooltipLeft = activeX === null ? 0 : clamp((activeX / width) * 100, 12, 82);
  const visibleSelectionRange = getVisibleSelectionRange(selectionRange, activeZoomRange);
  const selectionStartX =
    visibleSelectionRange === null
      ? null
      : getChartXForIndex(visibleSelectionRange.startIndex, pointCount, chartWidth, padding.left);
  const selectionEndX =
    visibleSelectionRange === null
      ? null
      : getChartXForIndex(visibleSelectionRange.endIndex, pointCount, chartWidth, padding.left);
  const selectionX =
    selectionStartX === null || selectionEndX === null ? null : Math.min(selectionStartX, selectionEndX);
  const selectionWidth =
    selectionStartX === null || selectionEndX === null ? 0 : Math.max(Math.abs(selectionEndX - selectionStartX), 4);
  const getLocalIndex = (event: ReactPointerEvent<SVGSVGElement> | ReactWheelEvent<SVGSVGElement>) =>
    getPointIndexFromClientX(event.clientX, event.currentTarget, pointCount, width, padding);
  const getAbsoluteIndex = (event: ReactPointerEvent<SVGSVGElement> | ReactWheelEvent<SVGSVGElement>) =>
    activeZoomRange.startIndex + getLocalIndex(event);
  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) {
      return;
    }

    const nextIndex = getAbsoluteIndex(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ startIndex: nextIndex, pointerId: event.pointerId });
    setHoveredIndex(nextIndex - activeZoomRange.startIndex);
    setSelectionRange(null);
  };
  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const nextLocalIndex = getLocalIndex(event);
    const nextAbsoluteIndex = activeZoomRange.startIndex + nextLocalIndex;
    setHoveredIndex(nextLocalIndex);

    if (dragState) {
      setSelectionRange(normalizeChartRange(dragState.startIndex, nextAbsoluteIndex));
    }
  };
  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragState) {
      return;
    }

    const nextRange = normalizeChartRange(dragState.startIndex, getAbsoluteIndex(event));
    setDragState(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setSelectionRange(nextRange.endIndex > nextRange.startIndex ? nextRange : null);
  };
  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();

    const scrollDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;

    if (scrollDelta === 0) {
      return;
    }

    const focusIndex = getAbsoluteIndex(event);
    const nextRange = getWheelZoomRange(activeZoomRange, focusIndex, scrollDelta, totalPointCount);
    setZoomRange(isFullChartRange(nextRange, totalPointCount) ? null : nextRange);
    setHoveredIndex(clamp(focusIndex - nextRange.startIndex, 0, getRangeWindowSize(nextRange) - 1));
  };

  return (
    <div className="fund-overview__chart-shell fund-overview__chart-shell--flow" ref={chartShellRef}>
      {activeIndex !== null && activePoint ? (
        <div className="fund-overview__chart-tooltip" style={{ left: `${tooltipLeft}%`, top: '0.85rem' }}>
          <strong>{formatDateLabel(activePoint.date)}</strong>
          <div className="fund-overview__chart-tooltip-list">
            <span>
              <i className="fund-overview__legend-dot fund-overview__legend-dot--buy" />
              Tegninger: {formatMetricValue(activePoint.grossBuy, 'currency')}
            </span>
            <span>
              <i className="fund-overview__legend-dot fund-overview__legend-dot--sell" />
              Innlosninger: {formatMetricValue(activePoint.grossSell, 'currency')}
            </span>
            <span>
              <i className="fund-overview__legend-dot fund-overview__legend-dot--net" />
              Nettoflyt: {formatMetricValue(activePoint.net, 'currency')}
            </span>
          </div>
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        aria-label="Kapitalflyt med tegninger, innlosninger og nettoflyt"
        className="fund-overview__chart-svg"
        role="img"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={() => {
          if (!dragState) {
            setHoveredIndex(null);
          }
        }}
        onWheel={handleWheel}
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

        <line x1={padding.left} y1={baselineY} x2={width - padding.right} y2={baselineY} stroke="rgba(17, 24, 39, 0.18)" />

        {activeX !== null ? (
          <line
            x1={activeX}
            y1={padding.top}
            x2={activeX}
            y2={padding.top + chartHeight}
            className="fund-overview__chart-hover-line"
          />
        ) : null}

        {selectionX !== null ? (
          <rect
            x={selectionX}
            y={padding.top}
            width={selectionWidth}
            height={chartHeight}
            className="fund-overview__chart-selection"
          />
        ) : null}

        <text x={width - 8} y={padding.top - 2} className="fund-overview__chart-text fund-overview__chart-text--value" textAnchor="end">
          {formatMetricValue(maxAbs, 'currency')}
        </text>
        <text x={width - 8} y={height - 48} className="fund-overview__chart-text fund-overview__chart-text--value" textAnchor="end">
          -{formatMetricValue(maxAbs, 'currency')}
        </text>

        {visibleCombinedPoints.map((point, index) => {
          const centerX = getChartXForIndex(index, pointCount, chartWidth, padding.left);
          const buyHeight = (point.grossBuy / maxAbs) * (halfHeight - 14);
          const sellHeight = (point.grossSell / maxAbs) * (halfHeight - 14);
          const barWidth = Math.max(4, Math.min(14, (pointCount === 1 ? chartWidth / 4 : (chartWidth / Math.max(pointCount - 1, 1)) * 0.28)));

          return (
            <g key={point.date}>
              <rect x={centerX - barWidth / 2} y={baselineY - buyHeight} width={barWidth} height={buyHeight} rx="2" fill={FUND_CHART_PRIMARY} />
              <rect x={centerX - barWidth / 2} y={baselineY} width={barWidth} height={sellHeight} rx="2" fill={FUND_CHART_MUTED} />
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
            {activeIndex !== null && seriesItem.coordinates[activeIndex] ? (
              <circle
                cx={seriesItem.coordinates[activeIndex].x}
                cy={seriesItem.coordinates[activeIndex].y}
                r="4.5"
                fill={seriesItem.color}
                className="fund-overview__chart-point"
              />
            ) : null}
          </g>
        ))}

        {tickIndexes.map((index) => (
          <text
            key={visibleCombinedPoints[index].date}
            x={getChartXForIndex(index, pointCount, chartWidth, padding.left)}
            y={height - 12}
            className="fund-overview__chart-text"
            textAnchor={index === 0 ? 'start' : index === pointCount - 1 ? 'end' : 'middle'}
          >
            {visibleCombinedPoints[index].label}
          </text>
        ))}
      </svg>
      <FlowRangeSummary range={selectionRange} combinedPoints={combinedPoints} />
      <ChartRangeBadge range={activeZoomRange} pointCount={totalPointCount} onReset={() => setZoomRange(null)} />
      <MiniLineOverview
        series={displaySeries}
        zoomRange={activeZoomRange}
        onZoomRangeChange={(range) => setZoomRange(isFullChartRange(range, totalPointCount) ? null : range)}
      />
    </div>
  );
}

function getPiePoint(center: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function buildPieSlicePath(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = getPiePoint(center, radius, endAngle);
  const end = getPiePoint(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${center} ${center}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function CompositionPiePanel({
  mode,
  onModeChange,
  points,
}: {
  mode: CompositionMode;
  onModeChange: (mode: CompositionMode) => void;
  points: FundOverviewCompositionPoint[];
}) {
  const total = points.reduce((currentTotal, point) => currentTotal + point.value, 0);
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  const hoveredPoint = points.find((point) => point.id === hoveredPointId) ?? null;
  let angleCursor = 0;

  return (
    <article className="fund-overview__composition-card">
      <div className="fund-overview__composition-header">
        <div>
          <p className="fund-overview__section-kpi-label">Fordeling</p>
          <strong>Kapitalfordeling</strong>
        </div>
        <label className="trade-field fund-overview__composition-select">
          <span>Fordel etter</span>
          <select value={mode} onChange={(event) => onModeChange(event.target.value as CompositionMode)}>
            {compositionModeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="fund-overview__composition-body">
        <div className="fund-overview__composition-pie-shell">
          <svg
            viewBox="0 0 180 180"
            className="fund-overview__composition-pie"
            role="img"
            aria-label="Kapitalfordeling for valgt utvalg"
            onMouseLeave={() => setHoveredPointId(null)}
          >
            {points.length === 1 ? (
              <circle cx="90" cy="90" r="78" fill={points[0].color} onMouseEnter={() => setHoveredPointId(points[0].id)} />
            ) : (
              points.map((point) => {
                const startAngle = angleCursor;
                const endAngle = angleCursor + (total > 0 ? (point.value / total) * 360 : 0);
                angleCursor = endAngle;

                return (
                  <path
                    key={point.id}
                    d={buildPieSlicePath(90, 78, startAngle, endAngle)}
                    fill={point.color}
                    className="fund-overview__composition-slice"
                    onMouseEnter={() => setHoveredPointId(point.id)}
                  />
                );
              })
            )}
            <circle cx="90" cy="90" r="42" className="fund-overview__composition-hole" />
          </svg>
          {hoveredPoint ? (
            <div className="fund-overview__composition-tooltip">
              <strong>{hoveredPoint.label}</strong>
              <span>{formatMetricValue(total > 0 ? hoveredPoint.value / total : 0, 'percent')}</span>
              <span>{formatMetricValue(hoveredPoint.value, 'currency')}</span>
            </div>
          ) : null}
        </div>
        <div className="fund-overview__composition-legend">
          {points.length > 0 ? (
            points.map((point) => (
              <span key={point.id}>
                <i className="fund-overview__legend-dot" style={{ background: point.color }} />
                <strong>{point.label}</strong>
                {formatMetricValue(total > 0 ? point.value / total : 0, 'percent')}
              </span>
            ))
          ) : (
            <span>Ingen fordeling i valgt utvalg.</span>
          )}
        </div>
      </div>
    </article>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  totalRows,
  startRow,
  endRow,
  label,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  startRow: number;
  endRow: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="fund-overview__pagination">
      <span>
        Viser {formatNumber(startRow, 0)}-{formatNumber(endRow, 0)} av {formatNumber(totalRows, 0)} {label}
      </span>
      <div className="fund-overview__pagination-buttons">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
          Forrige
        </button>
        <span className="fund-overview__pagination-current">{currentPage}</span>
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
          Neste
        </button>
      </div>
    </div>
  );
}

function FlowContributorTable({
  title,
  rows,
  page,
  onPageChange,
}: {
  title: string;
  rows: FundOverviewFlowContributorRow[];
  page: number;
  onPageChange: (page: number) => void;
}) {
  const paginatedRows = getPaginatedRows(rows, page, TABLE_PAGE_SIZE);

  return (
    <article className="fund-overview__impact-card">
      <div className="fund-overview__impact-header">
        <strong>{title}</strong>
        <span>{formatNumber(rows.length, 0)} investorer</span>
      </div>
      <div className="table-responsive fund-overview__impact-table-scroll">
        <table className="data-table table align-middle mb-0 fund-overview__impact-table">
          <thead>
            <tr>
              <th>Investor</th>
              <th>Kapital</th>
              <th>Andel</th>
              <th>Handler</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.rows.length > 0 ? (
              paginatedRows.rows.map((row) => (
                <tr key={row.customerId}>
                  <td>
                    <div className="table-primary-cell">
                      <strong>
                        <CustomerOverviewLink customerId={row.customerId}>{row.investorName}</CustomerOverviewLink>
                      </strong>
                      <span>
                        {row.investorType} / {row.investorCategory}
                      </span>
                    </div>
                  </td>
                  <td>{formatMetricValue(row.amount, 'currency')}</td>
                  <td>{formatMetricValue(row.shareOfFlow, 'percent')}</td>
                  <td>{formatNumber(row.tradeCount, 0)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="fund-overview__table-empty">
                  Ingen investorer med bidrag i valgt periode.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationControls
        currentPage={paginatedRows.currentPage}
        totalPages={paginatedRows.totalPages}
        totalRows={rows.length}
        startRow={paginatedRows.startRow}
        endRow={paginatedRows.endRow}
        label={title.toLowerCase()}
        onPageChange={onPageChange}
      />
    </article>
  );
}

function FlowContributorTables({
  buyRows,
  sellRows,
}: {
  buyRows: FundOverviewFlowContributorRow[];
  sellRows: FundOverviewFlowContributorRow[];
}) {
  const [buyPage, setBuyPage] = useState(1);
  const [sellPage, setSellPage] = useState(1);

  return (
    <div className="fund-overview__impact-grid">
      <FlowContributorTable title="Største tegninger" rows={buyRows} page={buyPage} onPageChange={setBuyPage} />
      <FlowContributorTable title="Største innløsninger" rows={sellRows} page={sellPage} onPageChange={setSellPage} />
    </div>
  );
}

function getSortedDividendRows(rows: FundOverviewDividendRow[], sortState: SortState<DividendSortKey>) {
  return [...rows].sort((left, right) => {
    const direction = sortState.direction === 'asc' ? 1 : -1;

    if (sortState.key === 'amount') {
      return (left.amount - right.amount) * direction;
    }

    if (sortState.key === 'date') {
      return compareString(left.date, right.date) * direction;
    }

    return compareString(left[sortState.key], right[sortState.key]) * direction;
  });
}

function getSortedShareholderRows(rows: FundOverviewTopShareholder[], sortState: SortState<ShareholderSortKey>) {
  return [...rows].sort((left, right) => {
    const direction = sortState.direction === 'asc' ? 1 : -1;

    if (sortState.key === 'rank') {
      return (right.marketValue - left.marketValue) * (sortState.direction === 'asc' ? 1 : -1);
    }

    if (sortState.key === 'investorName') {
      return compareString(left.investorName, right.investorName) * direction;
    }

    if (sortState.key === 'exposureCount') {
      return (left.exposureCount - right.exposureCount) * direction;
    }

    return (left[sortState.key] - right[sortState.key]) * direction;
  });
}

export function ChartLegend({ series }: { series: FundOverviewLineSeries[] }) {
  if (series.length <= 1) {
    return null;
  }

  return (
    <div className="fund-overview__chart-legend">
      {series.map((seriesItem) => (
        <span key={seriesItem.id}>
          <i className="fund-overview__legend-dot" style={{ background: seriesItem.color }} />
          {seriesItem.label}
        </span>
      ))}
    </div>
  );
}

function FundOverviewPage() {
  const [selectedFundIds, setSelectedFundIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<FundOverviewShareClassId[]>([]);
  const [selectedInvestorCategoryIds, setSelectedInvestorCategoryIds] = useState<string[]>([]);
  const [selectedInvestorTypeIds, setSelectedInvestorTypeIds] = useState<string[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<FundOverviewPeriodId>('12m');
  const [selectedStartDate, setSelectedStartDate] = useState<string | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<string | undefined>(undefined);
  const [navGrouping, setNavGrouping] = useState<FundOverviewChartGrouping>('combined');
  const [navValueMode, setNavValueMode] = useState<NavValueMode>('nav');
  const [flowGrouping, setFlowGrouping] = useState<FundOverviewChartGrouping>('combined');
  const [compositionMode, setCompositionMode] = useState<CompositionMode>('funds');
  const [dividendPage, setDividendPage] = useState(1);
  const [shareholderPage, setShareholderPage] = useState(1);
  const [dividendSort, setDividendSort] = useState<SortState<DividendSortKey>>({
    key: 'amount',
    direction: 'desc',
  });
  const [shareholderSort, setShareholderSort] = useState<SortState<ShareholderSortKey>>({
    key: 'rank',
    direction: 'asc',
  });

  const overview = useMemo(
    () =>
      getFundOverviewData({
        fundIds: selectedFundIds,
        classIds: selectedClassIds,
        investorCategoryIds: selectedInvestorCategoryIds,
        investorTypeIds: selectedInvestorTypeIds,
        periodId: selectedPeriodId,
        startDate: selectedStartDate,
        endDate: selectedEndDate,
        navGrouping,
        flowGrouping,
      }),
    [
      flowGrouping,
      navGrouping,
      selectedClassIds,
      selectedEndDate,
      selectedFundIds,
      selectedInvestorCategoryIds,
      selectedInvestorTypeIds,
      selectedPeriodId,
      selectedStartDate,
    ],
  );

  const topMetrics = overview.metrics.filter((metric) => !TOP_METRIC_IDS_TO_HIDE.has(metric.id));
  const selectedInvestorCategoryLabel = getMultiSelectSummary(
    overview.investorCategoryOptions,
    overview.filters.investorCategoryIds,
    'Alle segmenter',
  );
  const selectedInvestorTypeLabel = getMultiSelectSummary(
    overview.investorTypeOptions,
    overview.filters.investorTypeIds,
    'Alle investortyper',
  );
  const selectedFilterSummary = [
    { label: 'Fond', value: overview.selectedFundLabel },
    { label: 'Andelsklasse', value: overview.selectedClassLabel },
    { label: 'Investorsegment', value: selectedInvestorCategoryLabel },
    { label: 'Investortype', value: selectedInvestorTypeLabel },
    {
      label: 'Periode',
      value: `${overview.selectedPeriodLabel}: ${formatDateLabel(overview.periodStartDate)} - ${formatDateLabel(overview.asOfDate)}`,
    },
  ];
  const compositionPoints = overview.compositionSection[compositionMode];
  const sortedDividendRows = getSortedDividendRows(overview.dividendSection.rows, dividendSort);
  const sortedShareholderRows = getSortedShareholderRows(overview.shareholderSection.rows, shareholderSort);
  const dividendRows = getPaginatedRows(sortedDividendRows, dividendPage, TABLE_PAGE_SIZE);
  const shareholderRows = getPaginatedRows(sortedShareholderRows, shareholderPage, TABLE_PAGE_SIZE);

  const handleDividendSort = (key: DividendSortKey) => {
    setDividendSort((currentSort) => getNextSortState(currentSort, key));
    setDividendPage(1);
  };
  const handleShareholderSort = (key: ShareholderSortKey) => {
    setShareholderSort((currentSort) => getNextSortState(currentSort, key));
    setShareholderPage(1);
  };

  return (
    <div className="content-card fund-overview-page">
      <div className="fund-overview__page-header">
        <p className="content-card__eyebrow">Fond</p>
        <h1>Escali fondsanalyse</h1>
        <p className="content-card__description">
          Analyser mockdata for Escali Global, Escali Kreditt og Escali Norden med NAV-historikk, kapitalflyt, utbytter og eierbok samlet pa en side.
        </p>
      </div>

      <section className="fund-overview__toolbar" aria-label="Filtre for fondsoversikt">
        <div className="fund-overview__toolbar-main">
          <div className="fund-overview__filter-grid">
            <MultiSelectFilter
              label="Fond"
              options={overview.fundOptions}
              selectedIds={overview.filters.fundIds}
              allLabel="Alle Escali-fond"
              onChange={setSelectedFundIds}
            />

            <MultiSelectFilter
              label="Andelsklasse"
              options={overview.classOptions}
              selectedIds={overview.filters.classIds}
              allLabel="Alle andelsklasser"
              onChange={(ids) => setSelectedClassIds(ids as FundOverviewShareClassId[])}
            />

            <MultiSelectFilter
              label="Investorsegment"
              options={overview.investorCategoryOptions}
              selectedIds={overview.filters.investorCategoryIds}
              allLabel="Alle segmenter"
              onChange={setSelectedInvestorCategoryIds}
            />

            <MultiSelectFilter
              label="Investortype"
              options={overview.investorTypeOptions}
              selectedIds={overview.filters.investorTypeIds}
              allLabel="Alle investortyper"
              onChange={setSelectedInvestorTypeIds}
            />

            <label className="trade-field">
              <span>NAV-periode</span>
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
          <p className="fund-overview__toolbar-label">Siste NAV-dato</p>
          <strong>{formatDateLabel(overview.asOfDate)}</strong>
          <div className="fund-overview__toolbar-filter-list">
            {selectedFilterSummary.map((filter) => (
              <span key={filter.label}>
                <b>{filter.label}</b>
                {filter.value}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="fund-overview__metric-grid" aria-label="Nokkeltall for valgt fondsutvalg">
        {topMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="fund-overview__detail-grid" aria-label="Datagrunnlag for valgt fondsutvalg">
        <article className="fund-overview__detail-card">
          <p className="fund-overview__detail-label">Valgt univers</p>
          <strong>
            {overview.selectedFundLabel} / {overview.selectedClassLabel}
          </strong>
          <span>{overview.notes[0]}</span>
        </article>

        <article className="fund-overview__detail-card">
          <p className="fund-overview__detail-label">Analyseperiode</p>
          <strong>{overview.selectedPeriodLabel}</strong>
          <span>
            {formatDateLabel(overview.periodStartDate)} - {formatDateLabel(overview.asOfDate)}
          </span>
        </article>

        <article className="fund-overview__detail-card">
          <p className="fund-overview__detail-label">Mockdata</p>
          <strong>NAV, transaksjoner, utbytte og investorer</strong>
          <span>{overview.notes[1]}</span>
        </article>
      </section>

      <section className="data-table-card data-table-card--tight fund-overview__section">
        <div className="data-table-card__header fund-overview__section-header">
          <div>
            <p className="feature-section__eyebrow">Avkastning</p>
            <h2 className="data-table-card__title">Avkastning</h2>
            <p className="data-table-card__description">{overview.navSection.description}</p>
          </div>
        </div>

        <div className="fund-overview__chart-card">
          <div className="fund-overview__chart-card-header">
            <div className="fund-overview__chart-card-copy">
              <strong>Avkastning per fond og klasse</strong>
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

          <ChartLegend series={overview.navSection.series} />
          <LineChart series={overview.navSection.series} mode="return" />

          <div className="fund-overview__chart-kpi-panel">
            <SectionKpiGrid metrics={overview.navSection.returnKpis} compact />
          </div>
        </div>
      </section>

      <section className="data-table-card data-table-card--tight fund-overview__section">
        <div className="data-table-card__header fund-overview__section-header">
          <div>
            <p className="feature-section__eyebrow">NAV</p>
            <h2 className="data-table-card__title">NAV</h2>
            <p className="data-table-card__description">
              Viser faktisk NAV per fond over tid, med mulighet for a sammenligne prosentvis utvikling fra periodestart.
            </p>
          </div>
        </div>

        <div className="fund-overview__section-grid">
          <div className="fund-overview__chart-card">
            <div className="fund-overview__chart-card-header">
              <div className="fund-overview__chart-card-copy">
                <strong>NAV per fond</strong>
                <span>{navValueMode === 'nav' ? 'Faktisk NAV-verdi over tid' : 'Prosentvis endring fra periodestart'}</span>
              </div>

              <label className="trade-field fund-overview__chart-select">
                <span>Visning</span>
                <select value={navValueMode} onChange={(event) => setNavValueMode(event.target.value as NavValueMode)}>
                  <option value="nav">NAV-verdi</option>
                  <option value="return">Prosent fra start</option>
                </select>
              </label>
            </div>

            <ChartLegend series={overview.navSection.fundNavSeries} />
            <LineChart series={overview.navSection.fundNavSeries} mode={navValueMode} />

            <div className="fund-overview__chart-kpi-panel">
              <SectionKpiGrid metrics={overview.navSection.fundNavKpis} compact />
            </div>
          </div>

          <div className="fund-overview__side-panel">
            <PairedNavKpiGrid metrics={overview.navSection.kpis} />
            <CompositionPiePanel mode={compositionMode} onModeChange={setCompositionMode} points={compositionPoints} />
          </div>
        </div>
      </section>

      <section className="data-table-card data-table-card--tight fund-overview__section">
        <div className="data-table-card__header fund-overview__section-header">
          <div>
            <p className="feature-section__eyebrow">Kapitalflyt</p>
            <h2 className="data-table-card__title">Tegninger og innløsninger</h2>
            <p className="data-table-card__description">{overview.flowSection.description}</p>
          </div>
        </div>

        <div className="fund-overview__section-grid fund-overview__section-grid--flow">
          <div className="fund-overview__chart-card">
            <div className="fund-overview__chart-card-header">
              <div className="fund-overview__chart-card-copy">
                <strong>Kapital inn og ut</strong>
                <span>Aggregert per {overview.flowSection.granularityLabel}</span>
              </div>

              <label className="trade-field fund-overview__chart-select">
                <span>Gruppering</span>
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
                Tegninger
              </span>
              <span>
                <i className="fund-overview__legend-dot fund-overview__legend-dot--sell" />
                Innløsninger
              </span>
              {overview.flowSection.series.map((seriesItem) => (
                <span key={seriesItem.id}>
                  <i className="fund-overview__legend-dot" style={{ background: seriesItem.color }} />
                  {seriesItem.id === 'combined' ? 'Nettoflyt' : seriesItem.label}
                </span>
              ))}
            </div>

            <FlowChart combinedPoints={overview.flowSection.combinedPoints} series={overview.flowSection.series} />
          </div>

          <div className="fund-overview__side-panel">
            <SectionKpiGrid metrics={overview.flowSection.kpis} compact />
          </div>
        </div>

        <FlowContributorTables buyRows={overview.flowSection.buyContributors} sellRows={overview.flowSection.sellContributors} />
      </section>

      <section className="data-table-card data-table-card--tight fund-overview__section">
        <div className="data-table-card__header fund-overview__section-header">
          <div>
            <p className="feature-section__eyebrow">Utbytte</p>
            <h2 className="data-table-card__title">Utbytteutbetalinger</h2>
            <p className="data-table-card__description">{overview.dividendSection.description}</p>
          </div>
        </div>

        <SectionKpiGrid metrics={overview.dividendSection.kpis} />

        <div className="table-responsive table-scroll fund-overview__table-scroll">
          <table className="data-table table align-middle mb-0">
            <thead>
              <tr>
                <th>
                  <SortableHeader label="Dato" sortKey="date" sortState={dividendSort} onSort={handleDividendSort} />
                </th>
                <th>
                  <SortableHeader label="Investor" sortKey="investorName" sortState={dividendSort} onSort={handleDividendSort} />
                </th>
                <th>
                  <SortableHeader label="Fond" sortKey="fundLabel" sortState={dividendSort} onSort={handleDividendSort} />
                </th>
                <th>
                  <SortableHeader label="Andelsklasse" sortKey="classLabel" sortState={dividendSort} onSort={handleDividendSort} />
                </th>
                <th>
                  <SortableHeader label="Utbetalt belop" sortKey="amount" sortState={dividendSort} onSort={handleDividendSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.dividendSection.rows.length > 0 ? (
                dividendRows.rows.map((row) => (
                  <tr key={row.tradeId}>
                    <td>{row.dateLabel}</td>
                    <td>
                      <div className="table-primary-cell">
                        <strong>
                          <CustomerOverviewLink customerId={row.customerId}>{row.investorName}</CustomerOverviewLink>
                        </strong>
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
                    Ingen utbytteutbetalinger i valgt utvalg.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={dividendRows.currentPage}
          totalPages={dividendRows.totalPages}
          totalRows={overview.dividendSection.rows.length}
          startRow={dividendRows.startRow}
          endRow={dividendRows.endRow}
          label="utbytte"
          onPageChange={setDividendPage}
        />
      </section>

      <section className="data-table-card data-table-card--tight fund-overview__section">
        <div className="data-table-card__header fund-overview__section-header">
          <div>
            <p className="feature-section__eyebrow">Eierbok</p>
            <h2 className="data-table-card__title">Andelseiere og konsentrasjon</h2>
            <p className="data-table-card__description">{overview.shareholderSection.description}</p>
          </div>
        </div>

        <SectionKpiGrid metrics={overview.shareholderSection.kpis} />

        <div className="table-responsive table-scroll fund-overview__table-scroll">
          <table className="data-table table align-middle mb-0">
            <thead>
              <tr>
                <th>
                  <SortableHeader label="Rang" sortKey="rank" sortState={shareholderSort} onSort={handleShareholderSort} />
                </th>
                <th>
                  <SortableHeader label="Investor" sortKey="investorName" sortState={shareholderSort} onSort={handleShareholderSort} />
                </th>
                <th>
                  <SortableHeader
                    label={overview.shareholderSection.showUnits ? 'Andeler' : 'Fond/klasser'}
                    sortKey={overview.shareholderSection.showUnits ? 'units' : 'exposureCount'}
                    sortState={shareholderSort}
                    onSort={handleShareholderSort}
                  />
                </th>
                <th>
                  <SortableHeader label="Markedsverdi" sortKey="marketValue" sortState={shareholderSort} onSort={handleShareholderSort} />
                </th>
                <th>
                  <SortableHeader label="Eierandel" sortKey="ownershipShare" sortState={shareholderSort} onSort={handleShareholderSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {shareholderRows.rows.map((row) => (
                <tr key={row.customerId}>
                  <td>
                    {overview.shareholderSection.rows.findIndex((shareholder) => shareholder.customerId === row.customerId) + 1}
                  </td>
                  <td>
                    <div className="table-primary-cell">
                      <strong>
                        <CustomerOverviewLink customerId={row.customerId}>{row.investorName}</CustomerOverviewLink>
                      </strong>
                      <span>
                        {row.investorType} / {row.investorCategory}
                      </span>
                    </div>
                  </td>
                  <td>
                    {overview.shareholderSection.showUnits ? formatNumber(row.units) : formatNumber(row.exposureCount, 0)}
                  </td>
                  <td>{formatMetricValue(row.marketValue, 'currency')}</td>
                  <td>{formatMetricValue(row.ownershipShare, 'percent')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationControls
          currentPage={shareholderRows.currentPage}
          totalPages={shareholderRows.totalPages}
          totalRows={overview.shareholderSection.rows.length}
          startRow={shareholderRows.startRow}
          endRow={shareholderRows.endRow}
          label="andelseiere"
          onPageChange={setShareholderPage}
        />
      </section>
    </div>
  );
}

export default FundOverviewPage;
