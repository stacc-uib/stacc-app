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

type ZoomHandle = 'start' | 'end';

type ZoomHandleDragState = {
  handle: ZoomHandle;
  pointerId: number;
} | null;

type CompositionMode = 'funds' | 'classes' | 'investorCategories' | 'largestOwners';
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
const TOP_METRIC_IDS_TO_HIDE = new Set(['gross-activity', 'net-flow-ratio', 'dividend-yield']);
const compositionModeOptions: { id: CompositionMode; label: string }[] = [
  { id: 'funds', label: 'Fond' },
  { id: 'classes', label: 'Klasser' },
  { id: 'investorCategories', label: 'Retail/profesjonell' },
  { id: 'largestOwners', label: 'Største eiere' },
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

function getHoveredPointIndex(
  event: { currentTarget: SVGSVGElement; clientX: number },
  pointCount: number,
  width: number,
  padding: { left: number; right: number },
) {
  return getPointIndexFromClientX(event.clientX, event.currentTarget, pointCount, width, padding);
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

  const startIndex = clamp(range.startIndex, 0, pointCount - 1);
  const endIndex = clamp(range.endIndex, 0, pointCount - 1);

  return normalizeChartRange(startIndex, endIndex);
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

function getPannedChartRange(range: ChartRange, delta: number, pointCount: number) {
  const windowSize = getRangeWindowSize(range);
  const maxStart = Math.max(pointCount - windowSize, 0);
  const nextStartIndex = clamp(range.startIndex + delta, 0, maxStart);

  return {
    startIndex: nextStartIndex,
    endIndex: Math.min(nextStartIndex + windowSize - 1, Math.max(pointCount - 1, 0)),
  } satisfies ChartRange;
}

function getChartXForIndex(
  index: number,
  pointCount: number,
  chartWidth: number,
  paddingLeft: number,
) {
  if (pointCount <= 1) {
    return paddingLeft + chartWidth / 2;
  }

  return paddingLeft + (chartWidth / Math.max(pointCount - 1, 1)) * index;
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

function getChartDataKey(series: FundOverviewLineSeries[]) {
  return series
    .map((seriesItem) => {
      const firstPoint = seriesItem.points[0];
      const lastPoint = seriesItem.points[seriesItem.points.length - 1];
      return `${seriesItem.id}:${firstPoint?.date ?? 'empty'}:${lastPoint?.date ?? 'empty'}:${seriesItem.points.length}`;
    })
    .join('|');
}

function getPaginationPages(currentPage: number, totalPages: number) {
  const maxButtons = 5;
  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - maxButtons + 1));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
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

function compareString(left: string, right: string) {
  return left.localeCompare(right, 'nb', { sensitivity: 'base' });
}

function getNextSortState<TSortKey extends string>(
  currentSort: SortState<TSortKey>,
  key: TSortKey,
) {
  if (currentSort.key !== key) {
    return { key, direction: 'asc' } satisfies SortState<TSortKey>;
  }

  return {
    key,
    direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
  } satisfies SortState<TSortKey>;
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
      <span aria-hidden="true">{isActive ? (sortState.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
    </button>
  );
}

function getSortedDividendRows(
  rows: FundOverviewDividendRow[],
  sortState: SortState<DividendSortKey>,
) {
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

function getSortedShareholderRows(
  rows: FundOverviewTopShareholder[],
  sortState: SortState<ShareholderSortKey>,
) {
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

function SectionKpiGrid({
  metrics,
  compact = false,
}: {
  metrics: FundOverviewMetric[];
  compact?: boolean;
}) {
  return (
    <div
      className={`fund-overview__section-kpi-grid${
        compact ? ' fund-overview__section-kpi-grid--compact' : ''
      }`}
    >
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

function PairedNavKpiGrid({ metrics }: { metrics: FundOverviewMetric[] }) {
  const navStart = metrics.find((metric) => metric.id === 'nav-start');
  const navEnd = metrics.find((metric) => metric.id === 'nav-end');
  const navHigh = metrics.find((metric) => metric.id === 'nav-high');
  const navLow = metrics.find((metric) => metric.id === 'nav-low');
  const pairs = [
    { id: 'start-end', title: 'Start / slutt NAV', metrics: [navStart, navEnd] },
    { id: 'high-low', title: 'Høyeste / laveste NAV', metrics: [navHigh, navLow] },
  ];

  return (
    <div className="fund-overview__paired-kpi-grid">
      {pairs.map((pair) => (
        <article key={pair.id} className="fund-overview__paired-kpi">
          <p className="fund-overview__section-kpi-label">{pair.title}</p>
          {pair.metrics.map((metric) =>
            metric ? (
              <div key={metric.id} className="fund-overview__paired-kpi-row">
                <span>{metric.label}</span>
                <strong>{formatMetricValue(metric.value, metric.format)}</strong>
                <small>{metric.meta}</small>
              </div>
            ) : null,
          )}
        </article>
      ))}
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
          <strong>Kapitalsammensetning</strong>
        </div>
        <label className="trade-field fund-overview__composition-select">
          <span>Vis</span>
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
            aria-label="Fordeling for valgt filter"
            onMouseLeave={() => setHoveredPointId(null)}
          >
            {points.length === 1 ? (
              <circle
                cx="90"
                cy="90"
                r="78"
                fill={points[0].color}
                onMouseEnter={() => setHoveredPointId(points[0].id)}
              />
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
        <span>{formatNumber(rows.length, 0)} eiere</span>
      </div>
      <div className="table-responsive fund-overview__impact-table-scroll">
        <table className="data-table table align-middle mb-0 fund-overview__impact-table">
          <thead>
            <tr>
              <th>Investor</th>
              <th>Beløp</th>
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
                      <strong>{row.investorName}</strong>
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
                  Ingen eiere med bidrag i valgt periode.
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

  useEffect(() => {
    setBuyPage(1);
    setSellPage(1);
  }, [buyRows, sellRows]);

  return (
    <div className="fund-overview__impact-grid">
      <FlowContributorTable
        title="Bidrag til brutto kjøp"
        rows={buyRows}
        page={buyPage}
        onPageChange={setBuyPage}
      />
      <FlowContributorTable
        title="Bidrag til brutto salg"
        rows={sellRows}
        page={sellPage}
        onPageChange={setSellPage}
      />
    </div>
  );
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

  return labels.length <= 2 ? labels.join(', ') : `${labels.length} valgt`;
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionIds = options.map((option) => option.id);
  const selectedSet = new Set(selectedIds);
  const allSelected = selectedIds.length === optionIds.length;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const commitSelection = (nextIds: string[]) => {
    const normalizedIds = optionIds.filter((optionId) => nextIds.includes(optionId));
    onChange(normalizedIds.length > 0 ? normalizedIds : [...optionIds]);
  };

  const toggleOption = (optionId: string) => {
    const nextSelected = new Set(selectedIds);

    if (nextSelected.has(optionId)) {
      nextSelected.delete(optionId);
    } else {
      nextSelected.add(optionId);
    }

    commitSelection(Array.from(nextSelected));
  };

  return (
    <label className="trade-field fund-overview__multi-filter">
      <span>{label}</span>
      <div className="fund-overview__multi-filter-control" ref={wrapperRef}>
        <button
          type="button"
          className="fund-overview__multi-filter-button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span>{getMultiSelectSummary(options, selectedIds, allLabel)}</span>
          <span aria-hidden="true">▾</span>
        </button>

        {isOpen ? (
          <div
            className="fund-overview__multi-filter-menu"
            role="listbox"
            aria-multiselectable="true"
          >
            <label className="fund-overview__multi-filter-option fund-overview__multi-filter-option--all">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => commitSelection(optionIds)}
              />
              <span>{allLabel}</span>
            </label>

            {options.map((option) => (
              <label key={option.id} className="fund-overview__multi-filter-option">
                <input
                  type="checkbox"
                  checked={selectedSet.has(option.id)}
                  onChange={() => toggleOption(option.id)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </label>
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
  if (totalRows <= TABLE_PAGE_SIZE) {
    return null;
  }

  return (
    <div className="fund-overview__pagination" aria-label={`Sider for ${label}`}>
      <span>
        {formatNumber(startRow, 0)}-{formatNumber(endRow, 0)} av {formatNumber(totalRows, 0)}
      </span>
      <div className="fund-overview__pagination-buttons">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Forrige
        </button>
        {getPaginationPages(currentPage, totalPages).map((page) => (
          page === currentPage ? (
            <span
              key={page}
              className="fund-overview__pagination-current"
              aria-current="page"
            >
              {page}
            </span>
          ) : (
            <button key={page} type="button" onClick={() => onPageChange(page)}>
              {page}
            </button>
          )
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Neste
        </button>
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

function MiniLineOverview({
  series,
  zoomRange,
  onZoomRangeChange,
}: {
  series: FundOverviewLineSeries[];
  zoomRange: ChartRange;
  onZoomRangeChange: (range: ChartRange) => void;
}) {
  const [dragState, setDragState] = useState<ZoomHandleDragState>(null);
  const displaySeries = series.filter((seriesItem) => seriesItem.points.length > 0);

  if (displaySeries.length === 0) {
    return null;
  }

  const width = 820;
  const height = 64;
  const padding = { top: 8, right: 20, bottom: 10, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const pointCount = displaySeries[0].points.length;
  const values = displaySeries.flatMap((seriesItem) => seriesItem.points.map((point) => point.value));
  const valueMin = Math.min(...values);
  const valueMax = Math.max(...values);
  const valueRange = valueMax - valueMin || Math.max(Math.abs(valueMax) * 0.08, 1);
  const displayMin = valueMin - valueRange * 0.1;
  const displayMax = valueMax + valueRange * 0.1;
  const displayRange = displayMax - displayMin || 1;
  const safeZoomRange = getClampedChartRange(zoomRange, pointCount) ?? getFullChartRange(pointCount);
  const startX = getChartXForIndex(safeZoomRange.startIndex, pointCount, chartWidth, padding.left);
  const endX = getChartXForIndex(safeZoomRange.endIndex, pointCount, chartWidth, padding.left);
  const selectionX = Math.min(startX, endX);
  const selectionWidth = Math.max(Math.abs(endX - startX), pointCount === 1 ? 8 : 4);
  const handleWidth = 10;
  const getIndex = (event: ReactPointerEvent<SVGSVGElement>) =>
    getPointIndexFromClientX(event.clientX, event.currentTarget, pointCount, width, padding);
  const updateHandle = (handle: ZoomHandle | null, nextIndex: number) => {
    if (!handle || pointCount <= 1) {
      return;
    }

    if (handle === 'start') {
      onZoomRangeChange({
        startIndex: Math.min(nextIndex, safeZoomRange.endIndex - 1),
        endIndex: safeZoomRange.endIndex,
      });
      return;
    }

    onZoomRangeChange({
      startIndex: safeZoomRange.startIndex,
      endIndex: Math.max(nextIndex, safeZoomRange.startIndex + 1),
    });
  };
  const handlePointerDown = (
    event: ReactPointerEvent<SVGRectElement>,
    handle: ZoomHandle,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDragState({ handle, pointerId: event.pointerId });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="fund-overview__mini-chart"
      aria-label="Zoomintervall"
      role="img"
      onPointerMove={(event) => {
        if (!dragState) {
          return;
        }

        event.preventDefault();
        updateHandle(dragState.handle, getIndex(event));
      }}
      onPointerUp={(event) => {
        if (!dragState) {
          return;
        }

        if (event.currentTarget.hasPointerCapture(dragState.pointerId)) {
          event.currentTarget.releasePointerCapture(dragState.pointerId);
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
          y:
            padding.top +
            chartHeight -
            ((point.value - displayMin) / displayRange) * chartHeight,
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
      />
      <rect
        x={startX - handleWidth / 2}
        y={padding.top - 2}
        width={handleWidth}
        height={chartHeight + 4}
        rx="2"
        className="fund-overview__mini-chart-handle"
        onPointerDown={(event) => handlePointerDown(event, 'start')}
      />
      <rect
        x={endX - handleWidth / 2}
        y={padding.top - 2}
        width={handleWidth}
        height={chartHeight + 4}
        rx="2"
        className="fund-overview__mini-chart-handle"
        onPointerDown={(event) => handlePointerDown(event, 'end')}
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
          ? 'Zoom: Hele perioden'
          : `Zoom: ${formatNumber(range.startIndex + 1, 0)}-${formatNumber(range.endIndex + 1, 0)}`}
      </span>
      <button type="button" onClick={onReset} disabled={isFullRange}>
        Tilbakestill zoom
      </button>
    </div>
  );
}

function NavRangeSummary({
  range,
  series,
}: {
  range: ChartRange | null;
  series: FundOverviewLineSeries[];
}) {
  if (!range || range.endIndex <= range.startIndex) {
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
        <span>Markert periode</span>
        <strong>
          {formatDateLabel(startPoint.date)} - {formatDateLabel(endPoint.date)}
        </strong>
      </div>
      <div className="fund-overview__chart-period-list">
        {series.map((seriesItem) => {
          const seriesStartPoint = seriesItem.points[range.startIndex];
          const seriesEndPoint = seriesItem.points[range.endIndex];

          if (!seriesStartPoint || !seriesEndPoint) {
            return null;
          }

          const valueChange = seriesEndPoint.value - seriesStartPoint.value;
          const returnChange =
            seriesStartPoint.value > 0 ? seriesEndPoint.value / seriesStartPoint.value - 1 : 0;

          return (
            <span key={seriesItem.id}>
              <i className="fund-overview__legend-dot" style={{ background: seriesItem.color }} />
              {seriesItem.label}: {formatSignedMetricValue(valueChange, 'nav')} (
              {formatSignedMetricValue(returnChange, 'percent')})
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
  const net = grossBuy - grossSell;
  const grossActivity = grossBuy + grossSell;
  const netShare = grossActivity > 0 ? net / grossActivity : 0;

  return (
    <div className="fund-overview__chart-period">
      <div>
        <span>Markert periode</span>
        <strong>
          {formatDateLabel(startPoint.date)} - {formatDateLabel(endPoint.date)}
        </strong>
      </div>
      <div className="fund-overview__chart-period-list">
        <span>
          <i className="fund-overview__legend-dot fund-overview__legend-dot--buy" />
          Kjøp: {formatMetricValue(grossBuy, 'currency')}
        </span>
        <span>
          <i className="fund-overview__legend-dot fund-overview__legend-dot--sell" />
          Salg: {formatMetricValue(grossSell, 'currency')}
        </span>
        <span>
          <i className="fund-overview__legend-dot fund-overview__legend-dot--net" />
          Netto: {formatSignedMetricValue(net, 'currency')}
        </span>
        <span>
          Nettoandel: {formatSignedMetricValue(netShare, 'percent')}
        </span>
      </div>
    </div>
  );
}

function NavChart({ series }: { series: FundOverviewLineSeries[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectionRange, setSelectionRange] = useState<ChartRange | null>(null);
  const [zoomRange, setZoomRange] = useState<ChartRange | null>(null);
  const [dragState, setDragState] = useState<ChartDragState>(null);
  const chartShellRef = usePreventWheelScroll<HTMLDivElement>();
  const displaySeries = series.filter((seriesItem) => seriesItem.points.length > 0);
  const chartDataKey = getChartDataKey(displaySeries);

  useEffect(() => {
    setHoveredIndex(null);
    setSelectionRange(null);
    setZoomRange(null);
    setDragState(null);
  }, [chartDataKey]);

  if (displaySeries.length === 0) {
    return <div className="fund-overview__chart-empty">Ingen NAV-data i valgt utvalg.</div>;
  }

  const width = 820;
  const height = 300;
  const padding = { top: 20, right: 20, bottom: 42, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const totalPointCount = displaySeries[0].points.length;
  const activeZoomRange =
    getClampedChartRange(zoomRange, totalPointCount) ?? getFullChartRange(totalPointCount);
  const visibleSeries = displaySeries.map((seriesItem) => ({
    ...seriesItem,
    points: seriesItem.points.slice(activeZoomRange.startIndex, activeZoomRange.endIndex + 1),
  }));
  const pointCount = visibleSeries[0].points.length;
  const values = visibleSeries.flatMap((seriesItem) => seriesItem.points.map((point) => point.value));
  const valueMin = Math.min(...values);
  const valueMax = Math.max(...values);
  const valueRange = valueMax - valueMin || Math.max(valueMax * 0.08, 1);
  const displayMin = Math.max(0, valueMin - valueRange * 0.14);
  const displayMax = valueMax + valueRange * 0.14;
  const displayRange = displayMax - displayMin || 1;
  const coordinatesBySeries = displaySeries.map((seriesItem) => ({
    ...seriesItem,
    points: seriesItem.points.slice(activeZoomRange.startIndex, activeZoomRange.endIndex + 1),
    coordinates: seriesItem.points
      .slice(activeZoomRange.startIndex, activeZoomRange.endIndex + 1)
      .map((point, index) => ({
      x: getChartXForIndex(index, pointCount, chartWidth, padding.left),
      y:
        padding.top +
        chartHeight -
        ((point.value - displayMin) / displayRange) * chartHeight,
    })),
  }));
  const tickIndexes = getTickIndexes(pointCount);
  const activeIndex =
    hoveredIndex !== null &&
    hoveredIndex >= activeZoomRange.startIndex &&
    hoveredIndex <= activeZoomRange.endIndex
      ? hoveredIndex - activeZoomRange.startIndex
      : null;
  const activeX =
    activeIndex === null
      ? null
      : getChartXForIndex(activeIndex, pointCount, chartWidth, padding.left);
  const yAxisValues = [displayMax, displayMin + displayRange / 2, displayMin];
  const tooltipLeft =
    activeX === null
      ? 0
      : clamp((activeX / width) * 100, 12, 82);
  const activePoint = activeIndex === null ? null : visibleSeries[0].points[activeIndex];
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
    selectionStartX === null || selectionEndX === null
      ? 0
      : Math.max(Math.abs(selectionEndX - selectionStartX), pointCount === 1 ? 8 : 4);
  const getAbsoluteIndex = (event: ReactPointerEvent<SVGSVGElement>) =>
    activeZoomRange.startIndex +
    getPointIndexFromClientX(event.clientX, event.currentTarget, pointCount, width, padding);
  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.preventDefault();
    const nextIndex = getAbsoluteIndex(event);
    setDragState({ startIndex: nextIndex, pointerId: event.pointerId });
    setSelectionRange({ startIndex: nextIndex, endIndex: nextIndex });
    setHoveredIndex(nextIndex);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    const nextIndex = getAbsoluteIndex(event);
    setHoveredIndex(nextIndex);

    if (dragState) {
      setSelectionRange(normalizeChartRange(dragState.startIndex, nextIndex));
    }
  };
  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragState) {
      return;
    }

    event.preventDefault();
    const nextRange = normalizeChartRange(dragState.startIndex, getAbsoluteIndex(event));
    setDragState(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (nextRange.endIndex > nextRange.startIndex) {
      setSelectionRange(nextRange);
    } else {
      setSelectionRange(null);
    }
  };
  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const direction = event.deltaY > 0 || event.deltaX > 0 ? 1 : -1;

    if (isFullChartRange(activeZoomRange, totalPointCount)) {
      setHoveredIndex((current) => {
        const fallbackIndex = activeZoomRange.startIndex;
        return clamp((current ?? fallbackIndex) + direction, 0, totalPointCount - 1);
      });
      return;
    }

    setZoomRange(getPannedChartRange(activeZoomRange, direction, totalPointCount));
  };
  const resetZoom = () => {
    setZoomRange(null);
  };

  return (
    <div
      className="fund-overview__chart-shell"
      ref={chartShellRef}
      onWheel={(event) => event.preventDefault()}
    >
      {activeIndex !== null && activePoint ? (
        <div className="fund-overview__chart-tooltip" style={{ left: `${tooltipLeft}%`, top: '0.85rem' }}>
          <strong>{formatDateLabel(activePoint.date)}</strong>
          <div className="fund-overview__chart-tooltip-list">
            {visibleSeries.map((seriesItem) => (
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onWheel={handleWheel}
        onPointerCancel={(event) => {
          setDragState(null);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerLeave={() => {
          if (!dragState) {
            setHoveredIndex(null);
          }
        }}
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
      <NavRangeSummary range={selectionRange} series={displaySeries} />
      <ChartRangeBadge range={activeZoomRange} pointCount={totalPointCount} onReset={resetZoom} />
      <MiniLineOverview
        series={displaySeries}
        zoomRange={activeZoomRange}
        onZoomRangeChange={setZoomRange}
      />
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
    <div className="fund-overview__chart-shell" onWheel={(event) => event.preventDefault()}>
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

function ZoomableFlowChart({
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
  const chartDataKey = `${combinedPoints[0]?.date ?? 'empty'}:${
    combinedPoints[combinedPoints.length - 1]?.date ?? 'empty'
  }:${combinedPoints.length}:${getChartDataKey(displaySeries)}`;

  useEffect(() => {
    setHoveredIndex(null);
    setSelectionRange(null);
    setZoomRange(null);
    setDragState(null);
  }, [chartDataKey]);

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
  const totalPointCount = combinedPoints.length;
  const activeZoomRange =
    getClampedChartRange(zoomRange, totalPointCount) ?? getFullChartRange(totalPointCount);
  const visibleCombinedPoints = combinedPoints.slice(
    activeZoomRange.startIndex,
    activeZoomRange.endIndex + 1,
  );
  const visibleSeries = displaySeries.map((seriesItem) => ({
    ...seriesItem,
    points: seriesItem.points.slice(activeZoomRange.startIndex, activeZoomRange.endIndex + 1),
  }));
  const pointCount = visibleCombinedPoints.length;
  const pointStep = pointCount > 1 ? chartWidth / Math.max(pointCount - 1, 1) : chartWidth;
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
  const activeIndex =
    hoveredIndex !== null &&
    hoveredIndex >= activeZoomRange.startIndex &&
    hoveredIndex <= activeZoomRange.endIndex
      ? hoveredIndex - activeZoomRange.startIndex
      : null;
  const activeX =
    activeIndex === null
      ? null
      : getChartXForIndex(activeIndex, pointCount, chartWidth, padding.left);
  const tooltipLeft = activeX === null ? 0 : clamp((activeX / width) * 100, 12, 82);
  const activePoint = activeIndex === null ? null : visibleCombinedPoints[activeIndex];
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
    selectionStartX === null || selectionEndX === null
      ? 0
      : Math.max(Math.abs(selectionEndX - selectionStartX), pointCount === 1 ? 8 : 4);
  const overviewSeries: FundOverviewLineSeries[] = [
    {
      id: 'combined-flow-overview',
      label: 'Netto tegninger',
      color: '#111827',
      points: combinedPoints.map((point) => ({
        date: point.date,
        label: point.label,
        value: point.net,
      })),
    },
  ];
  const getAbsoluteIndex = (event: ReactPointerEvent<SVGSVGElement>) =>
    activeZoomRange.startIndex +
    getPointIndexFromClientX(event.clientX, event.currentTarget, pointCount, width, padding);
  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    event.preventDefault();
    const nextIndex = getAbsoluteIndex(event);
    setDragState({ startIndex: nextIndex, pointerId: event.pointerId });
    setSelectionRange({ startIndex: nextIndex, endIndex: nextIndex });
    setHoveredIndex(nextIndex);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    event.preventDefault();
    const nextIndex = getAbsoluteIndex(event);
    setHoveredIndex(nextIndex);

    if (dragState) {
      setSelectionRange(normalizeChartRange(dragState.startIndex, nextIndex));
    }
  };
  const handlePointerEnd = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragState) {
      return;
    }

    event.preventDefault();
    const nextRange = normalizeChartRange(dragState.startIndex, getAbsoluteIndex(event));
    setDragState(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (nextRange.endIndex > nextRange.startIndex) {
      setSelectionRange(nextRange);
    } else {
      setSelectionRange(null);
    }
  };
  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const direction = event.deltaY > 0 || event.deltaX > 0 ? 1 : -1;

    if (isFullChartRange(activeZoomRange, totalPointCount)) {
      setHoveredIndex((current) => {
        const fallbackIndex = activeZoomRange.startIndex;
        return clamp((current ?? fallbackIndex) + direction, 0, totalPointCount - 1);
      });
      return;
    }

    setZoomRange(getPannedChartRange(activeZoomRange, direction, totalPointCount));
  };
  const resetZoom = () => {
    setZoomRange(null);
  };

  return (
    <div
      className="fund-overview__chart-shell"
      ref={chartShellRef}
      onWheel={(event) => event.preventDefault()}
    >
      {activeIndex !== null && activePoint ? (
        <div className="fund-overview__chart-tooltip" style={{ left: `${tooltipLeft}%`, top: '0.85rem' }}>
          <strong>{formatDateLabel(activePoint.date)}</strong>
          <div className="fund-overview__chart-tooltip-list">
            <span>
              <i className="fund-overview__legend-dot fund-overview__legend-dot--buy" />
              Brutto kjøp: {formatMetricValue(activePoint.grossBuy, 'currency')}
            </span>
            <span>
              <i className="fund-overview__legend-dot fund-overview__legend-dot--sell" />
              Brutto salg: {formatMetricValue(activePoint.grossSell, 'currency')}
            </span>
            <span>
              <i className="fund-overview__legend-dot fund-overview__legend-dot--net" />
              Netto: {formatMetricValue(activePoint.net, 'currency')}
            </span>
            {displaySeries.length > 1
              ? visibleSeries.map((seriesItem) => (
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onWheel={handleWheel}
        onPointerCancel={(event) => {
          setDragState(null);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerLeave={() => {
          if (!dragState) {
            setHoveredIndex(null);
          }
        }}
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

        {selectionX !== null ? (
          <rect
            x={selectionX}
            y={padding.top}
            width={selectionWidth}
            height={chartHeight}
            className="fund-overview__chart-selection"
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

        {visibleCombinedPoints.map((point, index) => {
          const centerX = getChartXForIndex(index, pointCount, chartWidth, padding.left);
          const buyHeight = (point.grossBuy / maxAbs) * (halfHeight - 14);
          const sellHeight = (point.grossSell / maxAbs) * (halfHeight - 14);
          const barWidth = Math.max(4, Math.min(14, (pointCount === 1 ? chartWidth / 4 : pointStep * 0.28)));

          return (
            <g key={point.date}>
              <rect
                x={centerX - barWidth / 2}
                y={baselineY - buyHeight}
                width={barWidth}
                height={buyHeight}
                rx="2"
                fill="#16a34a"
              />
              <rect
                x={centerX - barWidth / 2}
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
      <ChartRangeBadge range={activeZoomRange} pointCount={totalPointCount} onReset={resetZoom} />
      <MiniLineOverview
        series={overviewSeries}
        zoomRange={activeZoomRange}
        onZoomRangeChange={setZoomRange}
      />
    </div>
  );
}

function FundOverviewPage() {
  const [selectedFundIds, setSelectedFundIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<FundOverviewShareClassId[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<FundOverviewPeriodId>('12m');
  const [selectedStartDate, setSelectedStartDate] = useState<string | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<string | undefined>(undefined);
  const [navGrouping, setNavGrouping] = useState<FundOverviewChartGrouping>('combined');
  const [flowGrouping, setFlowGrouping] = useState<FundOverviewChartGrouping>('combined');
  const [dividendPage, setDividendPage] = useState(1);
  const [shareholderPage, setShareholderPage] = useState(1);
  const [compositionMode, setCompositionMode] = useState<CompositionMode>('funds');
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
      selectedPeriodId,
      selectedStartDate,
    ],
  );
  const sortedDividendRows = getSortedDividendRows(overview.dividendSection.rows, dividendSort);
  const sortedShareholderRows = getSortedShareholderRows(
    overview.shareholderSection.rows,
    shareholderSort,
  );
  const dividendRows = getPaginatedRows(sortedDividendRows, dividendPage, TABLE_PAGE_SIZE);
  const shareholderRows = getPaginatedRows(sortedShareholderRows, shareholderPage, TABLE_PAGE_SIZE);
  const topMetrics = overview.metrics.filter((metric) => !TOP_METRIC_IDS_TO_HIDE.has(metric.id));
  const compositionPoints = overview.compositionSection[compositionMode];
  const handleDividendSort = (key: DividendSortKey) => {
    setDividendSort((currentSort) => getNextSortState(currentSort, key));
    setDividendPage(1);
  };
  const handleShareholderSort = (key: ShareholderSortKey) => {
    setShareholderSort((currentSort) => getNextSortState(currentSort, key));
    setShareholderPage(1);
  };

  useEffect(() => {
    setDividendPage(1);
    setShareholderPage(1);
  }, [
    overview.filters.fundIds,
    overview.filters.classIds,
    overview.filters.periodId,
    overview.filters.startDate,
    overview.filters.endDate,
  ]);

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
            <MultiSelectFilter
              label="Fond"
              options={overview.fundOptions}
              selectedIds={overview.filters.fundIds}
              allLabel="Alle fond"
              onChange={setSelectedFundIds}
            />

            <MultiSelectFilter
              label="Klasse"
              options={overview.classOptions}
              selectedIds={overview.filters.classIds}
              allLabel="Alle klasser"
              onChange={(ids) => setSelectedClassIds(ids as FundOverviewShareClassId[])}
            />

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
        {topMetrics.map((metric) => (
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

          <div className="fund-overview__side-panel">
            <PairedNavKpiGrid metrics={overview.navSection.kpis} />
            <CompositionPiePanel
              mode={compositionMode}
              onModeChange={setCompositionMode}
              points={compositionPoints}
            />
          </div>
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

            <ZoomableFlowChart
              combinedPoints={overview.flowSection.combinedPoints}
              series={overview.flowSection.series}
            />
          </div>

          <div className="fund-overview__side-panel">
            <SectionKpiGrid metrics={overview.flowSection.kpis} compact />
            <FlowContributorTables
              buyRows={overview.flowSection.buyContributors}
              sellRows={overview.flowSection.sellContributors}
            />
          </div>
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
                <th>
                  <SortableHeader
                    label="Dato"
                    sortKey="date"
                    sortState={dividendSort}
                    onSort={handleDividendSort}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Investor"
                    sortKey="investorName"
                    sortState={dividendSort}
                    onSort={handleDividendSort}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Fond"
                    sortKey="fundLabel"
                    sortState={dividendSort}
                    onSort={handleDividendSort}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Klasse"
                    sortKey="classLabel"
                    sortState={dividendSort}
                    onSort={handleDividendSort}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Beløp"
                    sortKey="amount"
                    sortState={dividendSort}
                    onSort={handleDividendSort}
                  />
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
            <p className="feature-section__eyebrow">Andelseiere</p>
            <h2 className="data-table-card__title">Andelseiere</h2>
            <p className="data-table-card__description">{overview.shareholderSection.description}</p>
          </div>
        </div>

        <SectionKpiGrid metrics={overview.shareholderSection.kpis} />

        <div className="table-responsive table-scroll fund-overview__table-scroll">
          <table className="data-table table align-middle mb-0">
            <thead>
              <tr>
                <th>
                  <SortableHeader
                    label="Rang"
                    sortKey="rank"
                    sortState={shareholderSort}
                    onSort={handleShareholderSort}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Investor"
                    sortKey="investorName"
                    sortState={shareholderSort}
                    onSort={handleShareholderSort}
                  />
                </th>
                <th>
                  <SortableHeader
                    label={overview.shareholderSection.showUnits ? 'Andeler' : 'Eksponeringer'}
                    sortKey={overview.shareholderSection.showUnits ? 'units' : 'exposureCount'}
                    sortState={shareholderSort}
                    onSort={handleShareholderSort}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Markedsverdi"
                    sortKey="marketValue"
                    sortState={shareholderSort}
                    onSort={handleShareholderSort}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Andel av AUM"
                    sortKey="ownershipShare"
                    sortState={shareholderSort}
                    onSort={handleShareholderSort}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {shareholderRows.rows.map((row) => (
                <tr key={row.customerId}>
                  <td>
                    {overview.shareholderSection.rows.findIndex(
                      (shareholder) => shareholder.customerId === row.customerId,
                    ) + 1}
                  </td>
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
