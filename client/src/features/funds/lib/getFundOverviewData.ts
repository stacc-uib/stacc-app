import fundUniverse from '../../../mocks/funds.json';
import fundPrices from '../../../mocks/fundPrices.json';
import investors from '../../../mocks/investors.json';
import tradeRecords from '../../../mocks/trades.json';
import { formatDateLabel } from '../../../shared/utils/formatDateLabel';
import type {
  FundOverviewChartGrouping,
  FundOverviewDividendRow,
  FundOverviewDividendSection,
  FundOverviewFilters,
  FundOverviewFlowPoint,
  FundOverviewFlowSection,
  FundOverviewLinePoint,
  FundOverviewLineSeries,
  FundOverviewMetric,
  FundOverviewNavSection,
  FundOverviewPeriodId,
  FundOverviewDateOption,
  FundOverviewCompositionPoint,
  FundOverviewCompositionSection,
  FundOverviewFlowContributorRow,
  FundOverviewSelectOption,
  FundOverviewShareClassId,
  FundOverviewShareholderSection,
  FundOverviewSnapshot,
  FundOverviewTopShareholder,
} from '../types/funds';

type RawFundRecord = {
  name: string | null;
};

type RawFundPriceRecord = {
  fundName: string | null;
  date: string | null;
  classA: number | null;
  classB: number | null;
  classC: number | null;
};

type RawInvestorRecord = {
  customerId: string;
  name: string;
  customerType: string;
  category: 'Professional' | 'Retail';
};

type RawTradeRecord = {
  id: string | null;
  customerId: string | null;
  fundName: string | null;
  shareClass: string | null;
  tradeDate: string | null;
  transactionType: string | null;
  units: number | null;
  price: number | null;
  amount: number | null;
  unitEffect: number | null;
};

type ShareClassId = FundOverviewShareClassId;
type BucketGranularity = 'day' | 'month' | 'year';

type PricePoint = {
  date: string;
  nav: number;
};

type FundDefinition = {
  id: string;
  name: string;
  label: string;
};

type InstrumentDefinition = {
  instrumentId: string;
  fundId: string;
  fundLabel: string;
  classId: ShareClassId;
  classLabel: string;
};

type NormalizedTrade = {
  tradeId: string;
  customerId: string;
  investorName: string;
  investorType: string;
  investorCategory: string;
  fundId: string;
  fundLabel: string;
  classId: ShareClassId;
  classLabel: string;
  instrumentId: string;
  tradeDate: string;
  amount: number;
  units: number;
  price: number;
  unitEffect: number;
  transactionType: 'Kjop' | 'Salg' | 'Utbytte' | 'Annet';
};

type HoldingsSnapshot = {
  shareholders: number;
  unitsByInstrument: Map<string, number>;
  unitsByInvestorInstrument: Map<string, number>;
};

type DateBucket = {
  key: string;
  label: string;
  endDate: string;
};

type AggregatedNavSnapshot = {
  nav: number;
  totalAum: number;
};

type GroupDefinition = {
  id: string;
  label: string;
  color: string;
  instruments: InstrumentDefinition[];
};

const shareClassOptions: FundOverviewSelectOption[] = [
  { id: 'A', label: 'Andelsklasse A' },
  { id: 'B', label: 'Andelsklasse B' },
  { id: 'C', label: 'Andelsklasse C' },
];

const periodOptions: { id: FundOverviewPeriodId; label: string }[] = [
  { id: '1m', label: 'Siste måned' },
  { id: 'qtd', label: 'Kvartal til dato' },
  { id: 'ytd', label: 'Hittil i år' },
  { id: '12m', label: 'Siste 12 måneder' },
  { id: 'itd', label: 'Hele NAV-historikken' },
  { id: 'custom', label: 'Egendefinert intervall' },
];

const groupingOptions: FundOverviewSelectOption[] = [
  { id: 'combined', label: 'Samlet portefølje' },
  { id: 'fund', label: 'Fordelt på fond' },
  { id: 'class', label: 'Fordelt på andelsklasse' },
];

const priceKeyByClassId: Record<ShareClassId, keyof RawFundPriceRecord> = {
  A: 'classA',
  B: 'classB',
  C: 'classC',
};

const shareClassIds: ShareClassId[] = ['A', 'B', 'C'];
const groupPalette = ['#ff7415', '#374151', '#0f766e', '#b85717', '#6b7280', '#155e75', '#1f2937', '#9ca3af'];
const investorInstrumentSeparator = '::';
const dayFormatter = new Intl.DateTimeFormat('nb-NO', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});
const monthFormatter = new Intl.DateTimeFormat('nb-NO', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});
const yearFormatter = new Intl.DateTimeFormat('nb-NO', {
  year: 'numeric',
  timeZone: 'UTC',
});

function toFundId(value: string) {
  return value
    .replace(/\s+AS$/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getFundLabel(name: string) {
  return name.replace(/\s+AS$/i, '');
}

function getClassLabel(classId: ShareClassId) {
  return `Andelsklasse ${classId}`;
}

function getTransactionType(value: string | null): NormalizedTrade['transactionType'] | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase().replace(/[øØ]/g, 'o');

  if (normalizedValue.includes('salg')) {
    return 'Salg';
  }

  if (normalizedValue.includes('utbytte')) {
    return 'Utbytte';
  }

  if (normalizedValue === 'kjop') {
    return 'Kjop';
  }

  return 'Annet';
}

function getClassIdFromShareClass(value: string | null): ShareClassId | null {
  if (!value) {
    return null;
  }

  if (value.includes('Klasse A')) {
    return 'A';
  }

  if (value.includes('Klasse B')) {
    return 'B';
  }

  if (value.includes('Klasse C')) {
    return 'C';
  }

  return null;
}

function getInvestorCategoryLabel(category: RawInvestorRecord['category']) {
  return category === 'Professional' ? 'Profesjonell' : 'Retail';
}

function getDayDifference(startDate: string, endDate: string) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const differenceInMs = createUtcDate(endDate).getTime() - createUtcDate(startDate).getTime();
  return Math.round(differenceInMs / millisecondsPerDay);
}

function getDeltaDirection(value: number): 'up' | 'down' | 'flat' {
  if (Math.abs(value) < 0.000001) {
    return 'flat';
  }

  return value > 0 ? 'up' : 'down';
}

function createUtcDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateString: string, delta: number) {
  const date = createUtcDate(dateString);
  date.setUTCDate(date.getUTCDate() + delta);
  return formatIsoDate(date);
}

function addMonths(dateString: string, delta: number) {
  const date = createUtcDate(dateString);
  date.setUTCMonth(date.getUTCMonth() + delta);
  return formatIsoDate(date);
}

function addYears(dateString: string, delta: number) {
  const date = createUtcDate(dateString);
  date.setUTCFullYear(date.getUTCFullYear() + delta);
  return formatIsoDate(date);
}

function getStartOfQuarter(dateString: string) {
  const [year, month] = dateString.split('-').map(Number);
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`;
}

function getStartOfMonth(dateString: string) {
  const [year, month] = dateString.split('-');
  return `${year}-${month}-01`;
}

function getEndOfMonth(dateString: string) {
  const date = createUtcDate(getStartOfMonth(dateString));
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return formatIsoDate(date);
}

function getStartOfYear(dateString: string) {
  return `${dateString.slice(0, 4)}-01-01`;
}

function getEndOfYear(dateString: string) {
  return `${dateString.slice(0, 4)}-12-31`;
}

function minDate(left: string, right: string) {
  return left < right ? left : right;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return sum(values) / values.length;
}

function findLatestPriceOnOrBefore(prices: PricePoint[], targetDate: string) {
  for (let index = prices.length - 1; index >= 0; index -= 1) {
    if (prices[index].date <= targetDate) {
      return prices[index];
    }
  }

  return null;
}

function getBucketGranularity(
  periodId: FundOverviewPeriodId,
  startDate: string,
  endDate: string,
): BucketGranularity {
  void periodId;
  void startDate;
  void endDate;
  return 'month';
}

function getBucketLabel(dateString: string, granularity: BucketGranularity) {
  const date = createUtcDate(dateString);

  if (granularity === 'day') {
    return dayFormatter.format(date);
  }

  if (granularity === 'year') {
    return yearFormatter.format(date);
  }

  return monthFormatter.format(date);
}

function getBucketKey(dateString: string, granularity: BucketGranularity) {
  if (granularity === 'day') {
    return dateString;
  }

  if (granularity === 'year') {
    return dateString.slice(0, 4);
  }

  return dateString.slice(0, 7);
}

function getAvailableDateOptions(selectionPriceRanges: PricePoint[][]): FundOverviewDateOption[] {
  const dates = Array.from(
    new Set(selectionPriceRanges.flatMap((prices) => prices.map((price) => price.date))),
  ).sort((left, right) => left.localeCompare(right));

  return dates.map((date) => ({
    date,
    label: formatDateLabel(date),
  }));
}

function resolveAvailableDate(
  requestedDate: string,
  availableDates: string[],
  strategy: 'ceil' | 'floor',
) {
  if (availableDates.length === 0) {
    return requestedDate;
  }

  if (strategy === 'ceil') {
    return availableDates.find((date) => date >= requestedDate) ?? availableDates[availableDates.length - 1];
  }

  for (let index = availableDates.length - 1; index >= 0; index -= 1) {
    if (availableDates[index] <= requestedDate) {
      return availableDates[index];
    }
  }

  return availableDates[0];
}

function getDateBuckets(
  startDate: string,
  endDate: string,
  granularity: BucketGranularity,
  availableDates: string[],
): DateBucket[] {
  const filteredDates = availableDates.filter((date) => date >= startDate && date <= endDate);

  if (filteredDates.length === 0) {
    return [
      {
        key: getBucketKey(endDate, granularity),
        label: getBucketLabel(endDate, granularity),
        endDate,
      },
    ];
  }

  if (granularity === 'day') {
    return filteredDates.map((date) => ({
      key: date,
      label: getBucketLabel(date, granularity),
      endDate: date,
    }));
  }

  const bucketByKey = new Map<string, DateBucket>();

  for (const date of filteredDates) {
    const key = getBucketKey(date, granularity);
    bucketByKey.set(key, {
      key,
      label: getBucketLabel(date, granularity),
      endDate: date,
    });
  }

  return Array.from(bucketByKey.values()).sort((left, right) => left.endDate.localeCompare(right.endDate));
}

function createMetric(
  id: string,
  label: string,
  value: number,
  format: FundOverviewMetric['format'],
  meta: string,
  delta?: FundOverviewMetric['delta'],
) {
  return {
    id,
    label,
    value,
    format,
    meta,
    delta,
  } satisfies FundOverviewMetric;
}

const fundDefinitions: FundDefinition[] = (fundUniverse as RawFundRecord[])
  .filter((fund): fund is { name: string } => Boolean(fund.name))
  .map((fund) => ({
    id: toFundId(fund.name),
    name: fund.name,
    label: getFundLabel(fund.name),
  }))
  .sort((left, right) => left.label.localeCompare(right.label, 'nb'));

const fundOptions: FundOverviewSelectOption[] = fundDefinitions.map((fund) => ({
  id: fund.id,
  label: fund.label,
}));

const fundIdByName = new Map(fundDefinitions.map((fund) => [fund.name, fund.id]));
const fundLabelById = new Map(fundDefinitions.map((fund) => [fund.id, fund.label]));
const investorById = new Map(
  (investors as RawInvestorRecord[]).map((investor) => [investor.customerId, investor]),
);

const instrumentDefinitions: InstrumentDefinition[] = fundDefinitions.flatMap((fund) =>
  shareClassIds.map((classId) => ({
    instrumentId: `${fund.id}-${classId}`,
    fundId: fund.id,
    fundLabel: fund.label,
    classId,
    classLabel: getClassLabel(classId),
  })),
);

const priceHistoryByInstrument = new Map<string, PricePoint[]>();

for (const priceRecord of fundPrices as RawFundPriceRecord[]) {
  if (!priceRecord.fundName || !priceRecord.date) {
    continue;
  }

  const fundId = fundIdByName.get(priceRecord.fundName);

  if (!fundId) {
    continue;
  }

  for (const classId of shareClassIds) {
    const nav = priceRecord[priceKeyByClassId[classId]];

    if (typeof nav !== 'number') {
      continue;
    }

    const instrumentId = `${fundId}-${classId}`;
    const points = priceHistoryByInstrument.get(instrumentId) ?? [];
    points.push({
      date: priceRecord.date,
      nav,
    });
    priceHistoryByInstrument.set(instrumentId, points);
  }
}

for (const prices of priceHistoryByInstrument.values()) {
  prices.sort((left, right) => left.date.localeCompare(right.date));
}

const normalizedTrades: NormalizedTrade[] = (tradeRecords as RawTradeRecord[])
  .map((trade) => {
    const fundId = trade.fundName ? fundIdByName.get(trade.fundName) ?? null : null;
    const classId = getClassIdFromShareClass(trade.shareClass);
    const transactionType = getTransactionType(trade.transactionType);
    const investor = trade.customerId ? investorById.get(trade.customerId) : undefined;

    if (
      !trade.id ||
      !trade.customerId ||
      trade.customerId === 'None' ||
      !trade.tradeDate ||
      !fundId ||
      !classId ||
      !transactionType
    ) {
      return null;
    }

    return {
      tradeId: trade.id,
      customerId: trade.customerId,
      investorName: investor?.name ?? trade.customerId,
      investorType: investor?.customerType ?? 'Ukjent',
      investorCategory: investor ? getInvestorCategoryLabel(investor.category) : 'Ukjent',
      fundId,
      fundLabel: fundLabelById.get(fundId) ?? trade.fundName ?? fundId,
      classId,
      classLabel: getClassLabel(classId),
      instrumentId: `${fundId}-${classId}`,
      tradeDate: trade.tradeDate,
      amount: trade.amount ?? 0,
      units: trade.units ?? 0,
      price: trade.price ?? 0,
      unitEffect: trade.unitEffect ?? 0,
      transactionType,
    } satisfies NormalizedTrade;
  })
  .filter((trade): trade is NormalizedTrade => trade !== null)
  .sort((left, right) => left.tradeDate.localeCompare(right.tradeDate));

const investorCategoryOptions: FundOverviewSelectOption[] = Array.from(
  new Set(normalizedTrades.map((trade) => trade.investorCategory)),
)
  .sort((left, right) => left.localeCompare(right, 'nb'))
  .map((category) => ({ id: category, label: category }));

const investorTypeOptions: FundOverviewSelectOption[] = Array.from(
  new Set(normalizedTrades.map((trade) => trade.investorType)),
)
  .sort((left, right) => left.localeCompare(right, 'nb'))
  .map((investorType) => ({ id: investorType, label: investorType }));

function getSelectedInstruments(fundIds: string[], classIds: ShareClassId[]) {
  const selectedFundIds = new Set(fundIds);
  const selectedClassIds = new Set(classIds);

  return instrumentDefinitions.filter((instrument) => {
    const matchesFund = selectedFundIds.has(instrument.fundId);
    const matchesClass = selectedClassIds.has(instrument.classId);
    return matchesFund && matchesClass;
  });
}

function getBreakdownGroupDefinitions(
  grouping: Exclude<FundOverviewChartGrouping, 'combined'>,
  selectedInstruments: InstrumentDefinition[],
): GroupDefinition[] {
  const groupedInstruments = new Map<string, InstrumentDefinition[]>();
  const labels = new Map<string, string>();

  for (const instrument of selectedInstruments) {
    const groupId = grouping === 'fund' ? instrument.fundId : instrument.classId;
    const groupLabel = grouping === 'fund' ? instrument.fundLabel : instrument.classLabel;
    const instruments = groupedInstruments.get(groupId) ?? [];
    instruments.push(instrument);
    groupedInstruments.set(groupId, instruments);
    labels.set(groupId, groupLabel);
  }

  return Array.from(groupedInstruments.entries())
    .sort((left, right) =>
      (labels.get(left[0]) ?? left[0]).localeCompare(labels.get(right[0]) ?? right[0], 'nb'),
    )
    .map(([groupId, instruments], index) => ({
      id: groupId,
      label: labels.get(groupId) ?? groupId,
      color: groupPalette[index % groupPalette.length],
      instruments,
    }));
}

function getGroupDefinitions(
  grouping: FundOverviewChartGrouping,
  selectedInstruments: InstrumentDefinition[],
): GroupDefinition[] {
  if (grouping === 'combined') {
    return [
      {
        id: 'combined',
        label: 'Samlet portefølje',
        color: groupPalette[0],
        instruments: selectedInstruments,
      },
    ];
  }

  return getBreakdownGroupDefinitions(grouping, selectedInstruments);
}

function getPeriodStartDate(
  periodId: FundOverviewPeriodId,
  endDate: string,
  earliestDate: string,
) {
  if (periodId === 'itd') {
    return earliestDate;
  }

  const candidate =
    periodId === '1m'
      ? addMonths(endDate, -1)
      : periodId === 'qtd'
        ? getStartOfQuarter(endDate)
        : periodId === 'ytd'
          ? `${endDate.slice(0, 4)}-01-01`
          : addYears(endDate, -1);

  return candidate < earliestDate ? earliestDate : candidate;
}

function getPeriodLabel(periodId: FundOverviewPeriodId) {
  return periodOptions.find((option) => option.id === periodId)?.label ?? 'Siste 12 måneder';
}

function getRangeLabel(startDate: string, endDate: string) {
  return startDate === endDate
    ? formatDateLabel(endDate)
    : `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
}

function normalizeSelectedFundIds(requestedFundIds: string[]) {
  const validFundIds = new Set(fundOptions.map((option) => option.id));
  const selectedFundIds = requestedFundIds.filter((fundId, index, array) => {
    return validFundIds.has(fundId) && array.indexOf(fundId) === index;
  });

  return selectedFundIds.length > 0 ? selectedFundIds : fundOptions.map((option) => option.id);
}

function normalizeSelectedClassIds(requestedClassIds: FundOverviewShareClassId[]) {
  const validClassIds = new Set<FundOverviewShareClassId>(shareClassIds);
  const selectedClassIds = requestedClassIds.filter((classId, index, array) => {
    return validClassIds.has(classId) && array.indexOf(classId) === index;
  });

  return selectedClassIds.length > 0 ? selectedClassIds : [...shareClassIds];
}

function normalizeSelectedOptionIds(
  requestedIds: string[] | undefined,
  options: FundOverviewSelectOption[],
) {
  const validIds = new Set(options.map((option) => option.id));
  const selectedIds =
    requestedIds?.filter((id, index, array) => validIds.has(id) && array.indexOf(id) === index) ?? [];

  return selectedIds.length > 0 ? selectedIds : options.map((option) => option.id);
}

function getSelectedFundLabel(selectedFundIds: string[]) {
  if (selectedFundIds.length === fundOptions.length) {
    return 'Alle Escali-fond';
  }

  const labels = fundOptions
    .filter((option) => selectedFundIds.includes(option.id))
    .map((option) => option.label);

  return labels.length <= 2 ? labels.join(' og ') : `${labels.length} valgte fond`;
}

function getSelectedClassLabel(selectedClassIds: ShareClassId[]) {
  if (selectedClassIds.length === shareClassIds.length) {
    return 'Alle andelsklasser';
  }

  const labels = shareClassOptions
    .filter((option) => selectedClassIds.includes(option.id as ShareClassId))
    .map((option) => option.label);

  return labels.length <= 2 ? labels.join(' og ') : `${labels.length} valgte andelsklasser`;
}

function getSelectedInvestorIds(investorCategoryIds: string[], investorTypeIds: string[]) {
  const selectedCategories = new Set(investorCategoryIds);
  const selectedTypes = new Set(investorTypeIds);

  return new Set(
    normalizedTrades
      .filter(
        (trade) =>
          selectedCategories.has(trade.investorCategory) && selectedTypes.has(trade.investorType),
      )
      .map((trade) => trade.customerId),
  );
}

function getHoldingsSnapshot(
  targetDate: string,
  selectedInstrumentIds: Set<string>,
  selectedInvestorIds: Set<string>,
): HoldingsSnapshot {
  const unitsByInvestor = new Map<string, number>();
  const unitsByInstrument = new Map<string, number>();
  const unitsByInvestorInstrument = new Map<string, number>();

  for (const trade of normalizedTrades) {
    if (
      trade.tradeDate > targetDate ||
      !selectedInstrumentIds.has(trade.instrumentId) ||
      !selectedInvestorIds.has(trade.customerId)
    ) {
      continue;
    }

    if (trade.unitEffect === 0) {
      continue;
    }

    unitsByInvestor.set(
      trade.customerId,
      (unitsByInvestor.get(trade.customerId) ?? 0) + trade.unitEffect,
    );
    unitsByInstrument.set(
      trade.instrumentId,
      (unitsByInstrument.get(trade.instrumentId) ?? 0) + trade.unitEffect,
    );

    const investorInstrumentKey = `${trade.customerId}${investorInstrumentSeparator}${trade.instrumentId}`;
    unitsByInvestorInstrument.set(
      investorInstrumentKey,
      (unitsByInvestorInstrument.get(investorInstrumentKey) ?? 0) + trade.unitEffect,
    );
  }

  return {
    shareholders: Array.from(unitsByInvestor.values()).filter((units) => units > 0).length,
    unitsByInstrument,
    unitsByInvestorInstrument,
  };
}

function getAggregatedNavAtDate(
  targetDate: string,
  selectedInstruments: InstrumentDefinition[],
  holdingsSnapshot: HoldingsSnapshot,
): AggregatedNavSnapshot {
  let totalAum = 0;
  let navWeightedByAum = 0;
  const availableNavs: number[] = [];

  for (const instrument of selectedInstruments) {
    const pricePoint = findLatestPriceOnOrBefore(
      priceHistoryByInstrument.get(instrument.instrumentId) ?? [],
      targetDate,
    );

    if (!pricePoint) {
      continue;
    }

    availableNavs.push(pricePoint.nav);
    const units = Math.max(0, holdingsSnapshot.unitsByInstrument.get(instrument.instrumentId) ?? 0);
    const instrumentAum = units * pricePoint.nav;
    totalAum += instrumentAum;
    navWeightedByAum += pricePoint.nav * instrumentAum;
  }

  const singleInstrumentPrice =
    selectedInstruments.length === 1
      ? findLatestPriceOnOrBefore(
          priceHistoryByInstrument.get(selectedInstruments[0].instrumentId) ?? [],
          targetDate,
        )?.nav ?? 0
      : 0;

  return {
    nav:
      selectedInstruments.length === 1
        ? singleInstrumentPrice
        : totalAum > 0
          ? navWeightedByAum / totalAum
          : average(availableNavs),
    totalAum,
  };
}

function getPeriodTrades(
  selectedInstrumentIds: Set<string>,
  selectedInvestorIds: Set<string>,
  periodStartDate: string,
  asOfDate: string,
) {
  return normalizedTrades.filter(
    (trade) =>
      selectedInstrumentIds.has(trade.instrumentId) &&
      selectedInvestorIds.has(trade.customerId) &&
      trade.tradeDate >= periodStartDate &&
      trade.tradeDate <= asOfDate,
  );
}

function createLineSeries(
  buckets: DateBucket[],
  groups: GroupDefinition[],
  getValueForDate: (date: string, instruments: InstrumentDefinition[]) => number,
): FundOverviewLineSeries[] {
  return groups.map((group) => ({
    id: group.id,
    label: group.label,
    color: group.color,
    points: buckets.map(
      (bucket) =>
        ({
          date: bucket.endDate,
          label: bucket.label,
          value: getValueForDate(bucket.endDate, group.instruments),
        }) satisfies FundOverviewLinePoint,
    ),
  }));
}

function getCombinedNavSeries(
  buckets: DateBucket[],
  selectedInstruments: InstrumentDefinition[],
  getSnapshotForDate: (date: string) => HoldingsSnapshot,
): FundOverviewLineSeries {
  return {
    id: 'combined',
    label: 'Samlet portefølje',
    color: groupPalette[0],
    points: buckets.map((bucket) => ({
      date: bucket.endDate,
      label: bucket.label,
      value: getAggregatedNavAtDate(
        bucket.endDate,
        selectedInstruments,
        getSnapshotForDate(bucket.endDate),
      ).nav,
    })),
  };
}

function getFlowPointsForTrades(
  buckets: DateBucket[],
  granularity: BucketGranularity,
  trades: NormalizedTrade[],
): FundOverviewFlowPoint[] {
  const flowByBucketKey = new Map(
    buckets.map((bucket) => [
      bucket.key,
      {
        grossBuy: 0,
        grossSell: 0,
      },
    ]),
  );

  for (const trade of trades) {
    const bucket = flowByBucketKey.get(getBucketKey(trade.tradeDate, granularity));

    if (!bucket) {
      continue;
    }

    if (trade.transactionType === 'Kjop') {
      bucket.grossBuy += Math.max(trade.amount, 0);
    } else if (trade.transactionType === 'Salg') {
      bucket.grossSell += Math.max(trade.amount, 0);
    }
  }

  return buckets.map((bucket) => {
    const values = flowByBucketKey.get(bucket.key) ?? { grossBuy: 0, grossSell: 0 };

    return {
      date: bucket.endDate,
      label: bucket.label,
      grossBuy: values.grossBuy,
      grossSell: values.grossSell,
      net: values.grossBuy - values.grossSell,
    };
  });
}

function createFlowContributorRows(
  periodTrades: NormalizedTrade[],
  transactionType: NormalizedTrade['transactionType'],
): FundOverviewFlowContributorRow[] {
  const contributorByCustomerId = new Map<
    string,
    {
      customerId: string;
      investorName: string;
      investorType: string;
      investorCategory: string;
      amount: number;
      tradeCount: number;
    }
  >();

  for (const trade of periodTrades) {
    if (trade.transactionType !== transactionType || trade.amount <= 0) {
      continue;
    }

    const current = contributorByCustomerId.get(trade.customerId) ?? {
      customerId: trade.customerId,
      investorName: trade.investorName,
      investorType: trade.investorType,
      investorCategory: trade.investorCategory,
      amount: 0,
      tradeCount: 0,
    };

    current.amount += trade.amount;
    current.tradeCount += 1;
    contributorByCustomerId.set(trade.customerId, current);
  }

  const totalAmount = sum(Array.from(contributorByCustomerId.values()).map((row) => row.amount));

  return Array.from(contributorByCustomerId.values())
    .sort((left, right) => right.amount - left.amount)
    .map((row) => ({
      ...row,
      shareOfFlow: totalAmount > 0 ? row.amount / totalAmount : 0,
    }));
}

function createMetrics(
  startAum: number,
  aum: number,
  startShareholders: number,
  shareholders: number,
  netSubscriptions: number,
  periodReturn: number,
  startNav: number,
  closingNav: number,
  dividends: number,
  asOfDate: string,
  periodStartDate: string,
): FundOverviewMetric[] {
  const dateLabel = formatDateLabel(asOfDate);
  const rangeLabel = getRangeLabel(periodStartDate, asOfDate);
  const netFlowRatio = aum > 0 ? netSubscriptions / aum : 0;
  const dividendYield = startAum > 0 ? dividends / startAum : 0;

  return [
    createMetric(
      'aum',
      'Forvaltet kapital',
      aum,
      'currency',
      `Per ${dateLabel}`,
      {
        value: aum - startAum,
        format: 'currency',
        direction: getDeltaDirection(aum - startAum),
        label: 'Fra periodestart',
      },
    ),
    createMetric(
      'shareholders',
      'Aktive andelseiere',
      shareholders,
      'number',
      `Aktive eiere per ${dateLabel}`,
      {
        value: shareholders - startShareholders,
        format: 'number',
        direction: getDeltaDirection(shareholders - startShareholders),
        label: 'Fra periodestart',
      },
    ),
    createMetric(
      'net-subscriptions',
      'Netto kapitalflyt',
      netSubscriptions,
      'currency',
      `I perioden ${rangeLabel}`,
      {
        value: netSubscriptions,
        format: 'currency',
        direction: getDeltaDirection(netSubscriptions),
        label: 'Tegninger minus innløsninger',
      },
    ),
    createMetric(
      'net-flow-ratio',
      'Nettoflyt av kapital',
      netFlowRatio,
      'percent',
      `Netto kapitalflyt delt på forvaltet kapital per ${dateLabel}`,
      {
        value: netFlowRatio,
        format: 'percent',
        direction: getDeltaDirection(netFlowRatio),
        label: 'I perioden',
      },
    ),
    createMetric(
      'return',
      'Avkastning',
      periodReturn,
      'percent',
      `NAV-endring i perioden ${rangeLabel}`,
      {
        value: periodReturn,
        format: 'percent',
        direction: getDeltaDirection(periodReturn),
        label: 'Fra periodestart',
      },
    ),
    createMetric(
      'closing-nav',
      'Siste NAV',
      closingNav,
      'nav',
      `Siste tilgjengelige NAV per ${dateLabel}`,
      {
        value: closingNav - startNav,
        format: 'nav',
        direction: getDeltaDirection(closingNav - startNav),
        label: 'Fra periodestart',
      },
    ),
    createMetric(
      'dividends',
      'Utbytte',
      dividends,
      'currency',
      `Utbetalt i perioden ${rangeLabel}`,
      {
        value: dividends,
        format: 'currency',
        direction: getDeltaDirection(dividends),
        label: 'I perioden',
      },
    ),
    createMetric(
      'dividend-yield',
      'Utbytteyield',
      dividendYield,
      'percent',
      startAum > 0
        ? 'Utbytte delt på forvaltet kapital ved periodestart'
        : `Utbytte i perioden ${rangeLabel}`,
    ),
  ];
}

function getSeriesPeriodReturn(seriesItem: FundOverviewLineSeries) {
  const startValue = seriesItem.points[0]?.value ?? 0;
  const endValue = seriesItem.points[seriesItem.points.length - 1]?.value ?? 0;

  return startValue > 0 ? endValue / startValue - 1 : 0;
}

function getSeriesReturnEntries(series: FundOverviewLineSeries[]) {
  return series.map((seriesItem) => ({
    id: seriesItem.id,
    label: seriesItem.label,
    value: getSeriesPeriodReturn(seriesItem),
  }));
}

function getSeriesPointReturns(seriesItem: FundOverviewLineSeries) {
  const returns: number[] = [];

  for (let index = 1; index < seriesItem.points.length; index += 1) {
    const previousValue = seriesItem.points[index - 1].value;
    const currentValue = seriesItem.points[index].value;

    if (previousValue > 0) {
      returns.push(currentValue / previousValue - 1);
    }
  }

  return returns;
}

function getStandardDeviation(values: number[]) {
  if (values.length <= 1) {
    return 0;
  }

  const mean = average(values);
  const variance =
    values.reduce((total, value) => total + (value - mean) ** 2, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

function getAnnualizedReturn(periodReturn: number, periodStartDate: string, asOfDate: string) {
  const days = Math.max(getDayDifference(periodStartDate, asOfDate), 1);
  return Math.pow(Math.max(1 + periodReturn, 0.000001), 365 / days) - 1;
}

function getAnnualizedVolatility(
  seriesItem: FundOverviewLineSeries,
  periodStartDate: string,
  asOfDate: string,
) {
  const pointReturns = getSeriesPointReturns(seriesItem);

  if (pointReturns.length === 0) {
    return 0;
  }

  const days = Math.max(getDayDifference(periodStartDate, asOfDate), 1);
  const observationsPerYear = Math.max((pointReturns.length * 365) / days, 1);

  return getStandardDeviation(pointReturns) * Math.sqrt(observationsPerYear);
}

function getMaxDrawdown(seriesItem: FundOverviewLineSeries) {
  let peakValue = seriesItem.points[0]?.value ?? 0;
  let maxDrawdown = 0;

  for (const point of seriesItem.points) {
    peakValue = Math.max(peakValue, point.value);

    if (peakValue > 0) {
      maxDrawdown = Math.min(maxDrawdown, point.value / peakValue - 1);
    }
  }

  return maxDrawdown;
}

function getPositivePeriodRatio(seriesItem: FundOverviewLineSeries) {
  const pointReturns = getSeriesPointReturns(seriesItem);

  if (pointReturns.length === 0) {
    return 0;
  }

  return pointReturns.filter((value) => value > 0).length / pointReturns.length;
}

function getReturnDelta(value: number, label = 'I perioden') {
  return {
    value,
    format: 'percent',
    direction: getDeltaDirection(value),
    label,
  } satisfies FundOverviewMetric['delta'];
}

function createReturnKpis(
  combinedSeries: FundOverviewLineSeries,
  fundSeries: FundOverviewLineSeries[],
  classSeries: FundOverviewLineSeries[],
  periodStartDate: string,
  asOfDate: string,
): FundOverviewMetric[] {
  const combinedReturn = getSeriesPeriodReturn(combinedSeries);
  const annualizedReturn = getAnnualizedReturn(combinedReturn, periodStartDate, asOfDate);
  const fundReturns = getSeriesReturnEntries(fundSeries).sort((left, right) => right.value - left.value);
  const classReturns = getSeriesReturnEntries(classSeries).sort((left, right) => right.value - left.value);
  const bestFund = fundReturns[0];
  const weakestFund = fundReturns[fundReturns.length - 1];
  const bestClass = classReturns[0];
  const weakestClass = classReturns[classReturns.length - 1];
  const rangeLabel = getRangeLabel(periodStartDate, asOfDate);

  return [
    createMetric(
      'return-total',
      'Samlet avkastning',
      combinedReturn,
      'percent',
      `NAV-endring ${rangeLabel}`,
      getReturnDelta(combinedReturn, 'Fra periodestart'),
    ),
    createMetric(
      'return-annualized',
      'Annualisert avkastning',
      annualizedReturn,
      'percent',
      'Periodens avkastning omregnet til årsbasis',
      getReturnDelta(annualizedReturn, 'Årsbasis'),
    ),
    createMetric(
      'return-best-fund',
      'Beste fond',
      bestFund?.value ?? 0,
      'percent',
      bestFund?.label ?? 'Ingen fondsdata',
      getReturnDelta(bestFund?.value ?? 0),
    ),
    createMetric(
      'return-weakest-fund',
      'Svakeste fond',
      weakestFund?.value ?? 0,
      'percent',
      weakestFund?.label ?? 'Ingen fondsdata',
      getReturnDelta(weakestFund?.value ?? 0),
    ),
    createMetric(
      'return-best-class',
      'Beste andelsklasse',
      bestClass?.value ?? 0,
      'percent',
      bestClass?.label ?? 'Ingen klassedata',
      getReturnDelta(bestClass?.value ?? 0),
    ),
    createMetric(
      'return-weakest-class',
      'Svakeste andelsklasse',
      weakestClass?.value ?? 0,
      'percent',
      weakestClass?.label ?? 'Ingen klassedata',
      getReturnDelta(weakestClass?.value ?? 0),
    ),
    createMetric(
      'return-volatility',
      'Volatilitet',
      getAnnualizedVolatility(combinedSeries, periodStartDate, asOfDate),
      'percent',
      'Annualisert standardavvik for samlet portefølje',
    ),
    createMetric(
      'return-drawdown',
      'Maks fall',
      getMaxDrawdown(combinedSeries),
      'percent',
      'Største fall fra toppunkt i perioden',
      getReturnDelta(getMaxDrawdown(combinedSeries), 'Fra toppunkt'),
    ),
    createMetric(
      'return-positive-periods',
      'Positive NAV-perioder',
      getPositivePeriodRatio(combinedSeries),
      'percent',
      'Andel perioder med positiv NAV-endring',
    ),
  ];
}

function createFundNavKpis(fundSeries: FundOverviewLineSeries[]): FundOverviewMetric[] {
  const entries = fundSeries.map((seriesItem) => {
    const values = seriesItem.points.map((point) => point.value);
    const latestPoint = seriesItem.points[seriesItem.points.length - 1];
    const highestPoint = seriesItem.points.reduce(
      (highest, point) => (point.value > highest.value ? point : highest),
      seriesItem.points[0] ?? { date: '', label: '', value: 0 },
    );
    const lowestPoint = seriesItem.points.reduce(
      (lowest, point) => (point.value < lowest.value ? point : lowest),
      seriesItem.points[0] ?? { date: '', label: '', value: 0 },
    );

    return {
      id: seriesItem.id,
      label: seriesItem.label,
      latestNav: latestPoint?.value ?? 0,
      highestNav: highestPoint.value,
      highestDate: highestPoint.date,
      lowestNav: lowestPoint.value,
      lowestDate: lowestPoint.date,
      averageNav: average(values),
      navRange: highestPoint.value - lowestPoint.value,
    };
  });
  const byLatestNav = [...entries].sort((left, right) => right.latestNav - left.latestNav);
  const byHighestNav = [...entries].sort((left, right) => right.highestNav - left.highestNav);
  const byLowestNav = [...entries].sort((left, right) => left.lowestNav - right.lowestNav);
  const byNavRange = [...entries].sort((left, right) => right.navRange - left.navRange);
  const highestLatest = byLatestNav[0];
  const lowestLatest = byLatestNav[byLatestNav.length - 1];
  const highestPoint = byHighestNav[0];
  const lowestPoint = byLowestNav[0];
  const widestRange = byNavRange[0];
  const averageLatestNav =
    entries.length > 0 ? average(entries.map((entry) => entry.latestNav)) : 0;
  const aboveAverageCount = entries.filter((entry) => entry.latestNav > averageLatestNav).length;
  const aboveAverageRatio = entries.length > 0 ? aboveAverageCount / entries.length : 0;
  const currentNavSpread =
    highestLatest && lowestLatest ? highestLatest.latestNav - lowestLatest.latestNav : 0;

  return [
    createMetric(
      'fund-nav-highest-latest',
      'Høyeste siste NAV',
      highestLatest?.latestNav ?? 0,
      'nav',
      highestLatest?.label ?? 'Ingen fondsdata',
    ),
    createMetric(
      'fund-nav-lowest-latest',
      'Laveste siste NAV',
      lowestLatest?.latestNav ?? 0,
      'nav',
      lowestLatest?.label ?? 'Ingen fondsdata',
    ),
    createMetric(
      'fund-nav-average-latest',
      'Snitt siste NAV',
      averageLatestNav,
      'nav',
      'Gjennomsnitt for fondene i valgt utvalg',
    ),
    createMetric(
      'fund-nav-current-spread',
      'Spenn i siste NAV',
      currentNavSpread,
      'nav',
      'Høyeste minus laveste siste NAV',
    ),
    createMetric(
      'fund-nav-highest-point',
      'Høyeste NAV-punkt',
      highestPoint?.highestNav ?? 0,
      'nav',
      highestPoint ? `${highestPoint.label} / ${formatDateLabel(highestPoint.highestDate)}` : 'Ingen fondsdata',
    ),
    createMetric(
      'fund-nav-lowest-point',
      'Laveste NAV-punkt',
      lowestPoint?.lowestNav ?? 0,
      'nav',
      lowestPoint ? `${lowestPoint.label} / ${formatDateLabel(lowestPoint.lowestDate)}` : 'Ingen fondsdata',
    ),
    createMetric(
      'fund-nav-widest-range',
      'Størst NAV-spenn',
      widestRange?.navRange ?? 0,
      'nav',
      widestRange?.label ?? 'Ingen fondsdata',
    ),
    createMetric(
      'fund-nav-above-average',
      'Fond over snitt',
      aboveAverageRatio,
      'percent',
      `${aboveAverageCount} av ${entries.length} fond`,
    ),
  ];
}

function createNavSection(
  buckets: DateBucket[],
  periodStartDate: string,
  asOfDate: string,
  selectedInstruments: InstrumentDefinition[],
  activeGrouping: FundOverviewChartGrouping,
  getSnapshotForDate: (date: string) => HoldingsSnapshot,
): FundOverviewNavSection {
  const groups = getGroupDefinitions(activeGrouping, selectedInstruments);
  const series = createLineSeries(
    buckets,
    groups,
    (date, instruments) => getAggregatedNavAtDate(date, instruments, getSnapshotForDate(date)).nav,
  );
  const combinedSeries = getCombinedNavSeries(buckets, selectedInstruments, getSnapshotForDate);
  const fundSeries = createLineSeries(
    buckets,
    getBreakdownGroupDefinitions('fund', selectedInstruments),
    (date, instruments) => getAggregatedNavAtDate(date, instruments, getSnapshotForDate(date)).nav,
  );
  const classSeries = createLineSeries(
    buckets,
    getBreakdownGroupDefinitions('class', selectedInstruments),
    (date, instruments) => getAggregatedNavAtDate(date, instruments, getSnapshotForDate(date)).nav,
  );
  const returnSeries = [
    combinedSeries,
    ...fundSeries.map((seriesItem, index) => ({
      ...seriesItem,
      id: `fund-${seriesItem.id}`,
      color: groupPalette[(index + 1) % groupPalette.length],
    })),
    ...classSeries.map((seriesItem, index) => ({
      ...seriesItem,
      id: `class-${seriesItem.id}`,
      color: groupPalette[(index + fundSeries.length + 1) % groupPalette.length],
    })),
  ];
  const fundNavSeries = fundSeries.map((seriesItem, index) => ({
    ...seriesItem,
    id: `fund-nav-${seriesItem.id}`,
    color: groupPalette[index % groupPalette.length],
  }));
  const returnKpis = createReturnKpis(
    combinedSeries,
    fundSeries,
    classSeries,
    periodStartDate,
    asOfDate,
  );
  const fundNavKpis = createFundNavKpis(fundSeries);

  const navAtStart = getAggregatedNavAtDate(
    periodStartDate,
    selectedInstruments,
    getSnapshotForDate(periodStartDate),
  ).nav;
  const navAtEnd = getAggregatedNavAtDate(
    asOfDate,
    selectedInstruments,
    getSnapshotForDate(asOfDate),
  ).nav;
  const fallbackPoint = combinedSeries.points[combinedSeries.points.length - 1] ?? {
    date: asOfDate,
    label: formatDateLabel(asOfDate),
    value: navAtEnd,
  };
  const highestPoint = combinedSeries.points.reduce(
    (highest, point) => (point.value > highest.value ? point : highest),
    combinedSeries.points[0] ?? fallbackPoint,
  );
  const lowestPoint = combinedSeries.points.reduce(
    (lowest, point) => (point.value < lowest.value ? point : lowest),
    combinedSeries.points[0] ?? fallbackPoint,
  );

  return {
    series,
    returnSeries,
    fundNavSeries,
    groupingOptions,
    activeGrouping,
    returnKpis,
    fundNavKpis,
    kpis: [
      createMetric(
        'nav-start',
        'NAV ved start',
        navAtStart,
        'nav',
        `Per ${formatDateLabel(periodStartDate)}`,
      ),
      createMetric(
        'nav-end',
        'Siste NAV',
        navAtEnd,
        'nav',
        `Per ${formatDateLabel(asOfDate)}`,
        {
          value: navAtEnd - navAtStart,
          format: 'nav',
          direction: getDeltaDirection(navAtEnd - navAtStart),
          label: 'Fra periodestart',
        },
      ),
      createMetric(
        'nav-high',
        'Høyeste NAV i perioden',
        highestPoint.value,
        'nav',
        `Målt ${formatDateLabel(highestPoint.date)}`,
      ),
      createMetric(
        'nav-low',
        'Laveste NAV i perioden',
        lowestPoint.value,
        'nav',
        `Målt ${formatDateLabel(lowestPoint.date)}`,
      ),
    ],
    description:
      'Sammenligner prosentvis avkastning for samlet portefølje, hvert fond og hver andelsklasse.',
  };
}

function createFlowSection(
  buckets: DateBucket[],
  granularity: BucketGranularity,
  periodTrades: NormalizedTrade[],
  periodStartDate: string,
  asOfDate: string,
  selectedInstruments: InstrumentDefinition[],
  activeGrouping: FundOverviewChartGrouping,
): FundOverviewFlowSection {
  const combinedPoints = getFlowPointsForTrades(buckets, granularity, periodTrades);
  const groups = getGroupDefinitions(activeGrouping, selectedInstruments);
  const series = groups.map((group) => {
    const instrumentIds = new Set(group.instruments.map((instrument) => instrument.instrumentId));
    const groupedTrades = periodTrades.filter((trade) => instrumentIds.has(trade.instrumentId));
    const points = getFlowPointsForTrades(buckets, granularity, groupedTrades);

    return {
      id: group.id,
      label: group.label,
      color: group.color,
      points: points.map((point) => ({
        date: point.date,
        label: point.label,
        value: point.net,
      })),
    } satisfies FundOverviewLineSeries;
  });

  const totalGrossBuy = sum(combinedPoints.map((point) => point.grossBuy));
  const totalGrossSell = sum(combinedPoints.map((point) => point.grossSell));
  const redemptionRatio = totalGrossBuy > 0 ? totalGrossSell / totalGrossBuy : 0;
  const fallbackFlowPoint = combinedPoints[0] ?? {
    date: asOfDate,
    label: getBucketLabel(asOfDate, granularity),
    grossBuy: 0,
    grossSell: 0,
    net: 0,
  };
  const mostActiveBuyPoint = combinedPoints.reduce(
    (best, point) => (point.grossBuy > best.grossBuy ? point : best),
    fallbackFlowPoint,
  );
  const mostActiveSellPoint = combinedPoints.reduce(
    (best, point) => (point.grossSell > best.grossSell ? point : best),
    fallbackFlowPoint,
  );
  const rangeLabel = getRangeLabel(periodStartDate, asOfDate);

  return {
    combinedPoints,
    series,
    buyContributors: createFlowContributorRows(periodTrades, 'Kjop'),
    sellContributors: createFlowContributorRows(periodTrades, 'Salg'),
    kpis: [
      createMetric('gross-buy', 'Brutto tegninger', totalGrossBuy, 'currency', `I perioden ${rangeLabel}`),
      createMetric(
        'gross-sell',
        'Brutto innløsninger',
        totalGrossSell,
        'currency',
        `I perioden ${rangeLabel}`,
      ),
      createMetric(
        'net-flow',
        'Netto kapitalflyt',
        totalGrossBuy - totalGrossSell,
        'currency',
        `Tegninger minus innløsninger i perioden ${rangeLabel}`,
      ),
      createMetric(
        'redemption-ratio',
        'Innløsning/tegning',
        redemptionRatio,
        'percent',
        totalGrossBuy > 0 ? 'Brutto innløsninger delt på brutto tegninger' : 'Ingen tegninger i perioden',
      ),
      createMetric(
        'flow-buy-activity',
        'Største tegningsperiode',
        mostActiveBuyPoint.grossBuy,
        'currency',
        mostActiveBuyPoint.label,
      ),
      createMetric(
        'flow-sell-activity',
        'Største innløsningsperiode',
        mostActiveSellPoint.grossSell,
        'currency',
        mostActiveSellPoint.label,
      ),
    ],
    description:
      'Viser kapital inn og ut av fondene: tegninger over nullinjen, innløsninger under og netto kapitalflyt som linje.',
    groupingOptions,
    activeGrouping,
    granularityLabel:
      granularity === 'day' ? 'dag' : granularity === 'year' ? 'år' : 'måned',
  };
}

function createDividendSection(
  periodTrades: NormalizedTrade[],
  periodStartDate: string,
  asOfDate: string,
): FundOverviewDividendSection {
  const allRows: FundOverviewDividendRow[] = periodTrades
    .filter((trade) => trade.transactionType === 'Utbytte')
    .map((trade) => ({
      tradeId: trade.tradeId,
      customerId: trade.customerId,
      date: trade.tradeDate,
      dateLabel: formatDateLabel(trade.tradeDate),
      investorName: trade.investorName,
      investorType: trade.investorType,
      fundLabel: trade.fundLabel,
      classLabel: trade.classLabel,
      amount: trade.amount,
      rate: trade.price,
    }));

  const rows = [...allRows]
    .sort((left, right) =>
      right.amount === left.amount
        ? right.date.localeCompare(left.date)
        : right.amount - left.amount,
    );

  const recipientCount = new Set(allRows.map((row) => row.investorName)).size;
  const totalAmount = sum(allRows.map((row) => row.amount));
  const averageAmount = allRows.length > 0 ? totalAmount / allRows.length : 0;
  const largestDividend = rows[0]?.amount ?? 0;

  return {
    rows,
    kpis: [
      createMetric('dividend-total', 'Totalt utbytte', totalAmount, 'currency', `I perioden ${getRangeLabel(periodStartDate, asOfDate)}`),
      createMetric('dividend-count', 'Antall utbetalinger', allRows.length, 'number', 'Registrerte utbyttehendelser'),
      createMetric('dividend-recipients', 'Mottakere', recipientCount, 'number', 'Unike andelseiere med utbytte'),
      createMetric('dividend-largest', 'Største utbetaling', largestDividend, 'currency', rows[0] ? `${rows[0].investorName} / ${rows[0].dateLabel}` : 'Ingen utbytter i perioden'),
      createMetric('dividend-average', 'Snitt per utbetaling', averageAmount, 'currency', allRows.length > 0 ? `Basert på ${allRows.length} utbetalinger` : 'Ingen utbytter i perioden'),
    ],
    description:
      allRows.length > 0
        ? `Viser faktiske utbytteutbetalinger fra transaksjonsmocken i perioden ${getRangeLabel(periodStartDate, asOfDate)}.`
        : `Ingen utbyttehendelser i perioden ${getRangeLabel(periodStartDate, asOfDate)}.`,
  };
}

function createShareholderSection(
  asOfDate: string,
  selectedInstruments: InstrumentDefinition[],
  selectedInstrumentIds: Set<string>,
  endHoldings: HoldingsSnapshot,
  totalAum: number,
): FundOverviewShareholderSection {
  const ownerAccumulator = new Map<
    string,
    {
      customerId: string;
      marketValue: number;
      units: number;
      exposureCount: number;
    }
  >();

  for (const [compositeKey, units] of endHoldings.unitsByInvestorInstrument.entries()) {
    if (units <= 0) {
      continue;
    }

    const [customerId, instrumentId] = compositeKey.split(investorInstrumentSeparator);

    if (!selectedInstrumentIds.has(instrumentId)) {
      continue;
    }

    const price =
      findLatestPriceOnOrBefore(priceHistoryByInstrument.get(instrumentId) ?? [], asOfDate)?.nav ?? 0;
    const current = ownerAccumulator.get(customerId) ?? {
      customerId,
      marketValue: 0,
      units: 0,
      exposureCount: 0,
    };

    current.marketValue += units * price;
    current.units += units;
    current.exposureCount += 1;
    ownerAccumulator.set(customerId, current);
  }

  const rows: FundOverviewTopShareholder[] = Array.from(ownerAccumulator.values())
    .filter((owner) => owner.marketValue > 0)
    .sort((left, right) => right.marketValue - left.marketValue)
    .map((owner) => {
      const investor = investorById.get(owner.customerId);

      return {
        customerId: owner.customerId,
        investorName: investor?.name ?? owner.customerId,
        investorType: investor?.customerType ?? 'Ukjent',
        investorCategory: investor ? getInvestorCategoryLabel(investor.category) : 'Ukjent',
        marketValue: owner.marketValue,
        ownershipShare: totalAum > 0 ? owner.marketValue / totalAum : 0,
        units: owner.units,
        exposureCount: owner.exposureCount,
      };
    });

  const top1 = rows[0];
  const top3Share = sum(rows.slice(0, 3).map((row) => row.ownershipShare));
  const top10Share = sum(rows.slice(0, 10).map((row) => row.ownershipShare));
  const professionalAum = sum(
    rows
      .filter((row) => row.investorCategory === 'Profesjonell')
      .map((row) => row.marketValue),
  );

  return {
    rows,
    kpis: [
      createMetric(
        'largest-holder',
        'Største eierandel',
        top1?.ownershipShare ?? 0,
        'percent',
        top1 ? top1.investorName : `Per ${formatDateLabel(asOfDate)}`,
      ),
      createMetric(
        'top-3-share',
        'Topp 3 eierandel',
        top3Share,
        'percent',
        'Andel av valgt kapital',
      ),
      createMetric(
        'top-10-share',
        'Topp 10 eierandel',
        top10Share,
        'percent',
        'Andel av valgt kapital',
      ),
      createMetric(
        'professional-share',
        'Profesjonell kapital',
        totalAum > 0 ? professionalAum / totalAum : 0,
        'percent',
        'Andel av kapital eid av profesjonelle',
      ),
      createMetric(
        'average-holder',
        'Snittkapital per eier',
        endHoldings.shareholders > 0 ? totalAum / endHoldings.shareholders : 0,
        'currency',
        `${endHoldings.shareholders} aktive eiere`,
      ),
    ],
    description: `Eierbok per ${formatDateLabel(asOfDate)}, beregnet fra andelsbevegelser og siste NAV for valgt utvalg.`,
    showUnits: selectedInstruments.length === 1,
  };
}

function mapCompositionEntries(
  entries: { id: string; label: string; value: number }[],
): FundOverviewCompositionPoint[] {
  return entries
    .filter((entry) => entry.value > 0)
    .sort((left, right) => right.value - left.value)
    .map((entry, index) => ({
      ...entry,
      color: groupPalette[index % groupPalette.length],
    }));
}

function createCompositionSection(
  selectedInstruments: InstrumentDefinition[],
  endHoldings: HoldingsSnapshot,
  asOfDate: string,
  totalAum: number,
  shareholderRows: FundOverviewTopShareholder[],
): FundOverviewCompositionSection {
  const valueByFundId = new Map<string, { id: string; label: string; value: number }>();
  const valueByClassId = new Map<string, { id: string; label: string; value: number }>();

  for (const instrument of selectedInstruments) {
    const units = Math.max(0, endHoldings.unitsByInstrument.get(instrument.instrumentId) ?? 0);
    const nav =
      findLatestPriceOnOrBefore(priceHistoryByInstrument.get(instrument.instrumentId) ?? [], asOfDate)?.nav ?? 0;
    const marketValue = units * nav;

    const fundEntry = valueByFundId.get(instrument.fundId) ?? {
      id: instrument.fundId,
      label: instrument.fundLabel,
      value: 0,
    };
    fundEntry.value += marketValue;
    valueByFundId.set(instrument.fundId, fundEntry);

    const classEntry = valueByClassId.get(instrument.classId) ?? {
      id: instrument.classId,
      label: instrument.classLabel,
      value: 0,
    };
    classEntry.value += marketValue;
    valueByClassId.set(instrument.classId, classEntry);
  }

  const valueByCategory = new Map<string, { id: string; label: string; value: number }>();

  for (const row of shareholderRows) {
    const entry = valueByCategory.get(row.investorCategory) ?? {
      id: row.investorCategory,
      label: row.investorCategory,
      value: 0,
    };
    entry.value += row.marketValue;
    valueByCategory.set(row.investorCategory, entry);
  }

  const largestOwnerEntries = shareholderRows.slice(0, 5).map((row) => ({
    id: row.customerId,
    label: row.investorName,
    value: row.marketValue,
  }));
  const topOwnerValue = sum(largestOwnerEntries.map((entry) => entry.value));

  if (totalAum > topOwnerValue) {
    largestOwnerEntries.push({
      id: 'other-owners',
      label: 'Andre',
      value: totalAum - topOwnerValue,
    });
  }

  return {
    funds: mapCompositionEntries(Array.from(valueByFundId.values())),
    classes: mapCompositionEntries(Array.from(valueByClassId.values())),
    investorCategories: mapCompositionEntries(Array.from(valueByCategory.values())),
    largestOwners: mapCompositionEntries(largestOwnerEntries),
  };
}

export function getFundOverviewData(filters: FundOverviewFilters): FundOverviewSnapshot {
  const requestedFundIds =
    filters.fundIds ?? (filters.fundId && filters.fundId !== 'all' ? [filters.fundId] : []);
  const requestedClassIds =
    filters.classIds ??
    (filters.classId && filters.classId !== 'all'
      ? ([filters.classId] as FundOverviewShareClassId[])
      : []);
  const selectedFundIds = normalizeSelectedFundIds(requestedFundIds);
  const selectedClassIds = normalizeSelectedClassIds(requestedClassIds);
  const selectedInvestorCategoryIds = normalizeSelectedOptionIds(
    filters.investorCategoryIds,
    investorCategoryOptions,
  );
  const selectedInvestorTypeIds = normalizeSelectedOptionIds(
    filters.investorTypeIds,
    investorTypeOptions,
  );
  const selectedInvestorIds = getSelectedInvestorIds(
    selectedInvestorCategoryIds,
    selectedInvestorTypeIds,
  );
  const selectedPeriodId = periodOptions.some((option) => option.id === filters.periodId)
    ? filters.periodId
    : '12m';
  const selectedNavGrouping = groupingOptions.some((option) => option.id === filters.navGrouping)
    ? filters.navGrouping
    : 'combined';
  const selectedFlowGrouping = groupingOptions.some((option) => option.id === filters.flowGrouping)
    ? filters.flowGrouping
    : 'combined';

  const selectedInstruments = getSelectedInstruments(selectedFundIds, selectedClassIds);
  const selectedInstrumentIds = new Set(
    selectedInstruments.map((instrument) => instrument.instrumentId),
  );
  const selectionPriceRanges = selectedInstruments
    .map((instrument) => priceHistoryByInstrument.get(instrument.instrumentId) ?? [])
    .filter((prices) => prices.length > 0);

  const availableDateOptions = getAvailableDateOptions(selectionPriceRanges);
  const availableDates = availableDateOptions.map((option) => option.date);
  const earliestDate = availableDates[0] ?? '2026-01-31';
  const latestDate = availableDates[availableDates.length - 1] ?? earliestDate;
  const requestedEndDate = selectedPeriodId === 'custom' ? filters.endDate ?? latestDate : latestDate;
  const asOfDate = resolveAvailableDate(requestedEndDate, availableDates, 'floor');
  const presetStartDate =
    selectedPeriodId === 'custom'
      ? filters.startDate ?? getPeriodStartDate('12m', asOfDate, earliestDate)
      : getPeriodStartDate(selectedPeriodId, asOfDate, earliestDate);
  const periodStartDate = resolveAvailableDate(presetStartDate, availableDates, 'ceil');
  const normalizedPeriodStartDate = periodStartDate > asOfDate ? asOfDate : periodStartDate;
  const granularity = getBucketGranularity(selectedPeriodId, normalizedPeriodStartDate, asOfDate);
  const buckets = getDateBuckets(normalizedPeriodStartDate, asOfDate, granularity, availableDates);
  const holdingsSnapshotCache = new Map<string, HoldingsSnapshot>();
  const getSnapshotForDate = (date: string) => {
    if (!holdingsSnapshotCache.has(date)) {
      holdingsSnapshotCache.set(
        date,
        getHoldingsSnapshot(date, selectedInstrumentIds, selectedInvestorIds),
      );
    }

    return holdingsSnapshotCache.get(date)!;
  };

  const startHoldings = getSnapshotForDate(normalizedPeriodStartDate);
  const endHoldings = getSnapshotForDate(asOfDate);
  const startAggregate = getAggregatedNavAtDate(
    normalizedPeriodStartDate,
    selectedInstruments,
    startHoldings,
  );
  const endAggregate = getAggregatedNavAtDate(asOfDate, selectedInstruments, endHoldings);
  const periodTrades = getPeriodTrades(
    selectedInstrumentIds,
    selectedInvestorIds,
    normalizedPeriodStartDate,
    asOfDate,
  );
  const grossBuyTotal = sum(
    periodTrades
      .filter((trade) => trade.transactionType === 'Kjop')
      .map((trade) => Math.max(trade.amount, 0)),
  );
  const grossSellTotal = sum(
    periodTrades
      .filter((trade) => trade.transactionType === 'Salg')
      .map((trade) => Math.max(trade.amount, 0)),
  );
  const dividends = sum(
    periodTrades
      .filter((trade) => trade.transactionType === 'Utbytte')
      .map((trade) => trade.amount),
  );
  const netSubscriptions = grossBuyTotal - grossSellTotal;
  const periodReturn = startAggregate.nav > 0 ? endAggregate.nav / startAggregate.nav - 1 : 0;
  const navSection = createNavSection(
    buckets,
    normalizedPeriodStartDate,
    asOfDate,
    selectedInstruments,
    selectedNavGrouping,
    getSnapshotForDate,
  );
  const flowSection = createFlowSection(
    buckets,
    granularity,
    periodTrades,
    normalizedPeriodStartDate,
    asOfDate,
    selectedInstruments,
    selectedFlowGrouping,
  );
  const dividendSection = createDividendSection(
    periodTrades,
    normalizedPeriodStartDate,
    asOfDate,
  );
  const shareholderSection = createShareholderSection(
    asOfDate,
    selectedInstruments,
    selectedInstrumentIds,
    endHoldings,
    endAggregate.totalAum,
  );
  const compositionSection = createCompositionSection(
    selectedInstruments,
    endHoldings,
    asOfDate,
    endAggregate.totalAum,
    shareholderSection.rows,
  );

  return {
    fundOptions,
    classOptions: shareClassOptions,
    investorCategoryOptions,
    investorTypeOptions,
    periodOptions,
    groupingOptions,
    availableDateOptions,
    filters: {
      fundIds: selectedFundIds,
      classIds: selectedClassIds,
      investorCategoryIds: selectedInvestorCategoryIds,
      investorTypeIds: selectedInvestorTypeIds,
      periodId: selectedPeriodId,
      startDate: normalizedPeriodStartDate,
      endDate: asOfDate,
      navGrouping: selectedNavGrouping,
      flowGrouping: selectedFlowGrouping,
    },
    selectedFundLabel: getSelectedFundLabel(selectedFundIds),
    selectedClassLabel: getSelectedClassLabel(selectedClassIds),
    selectedPeriodLabel:
      periodOptions.find((option) => option.id === selectedPeriodId)?.label ?? 'Siste 12 måneder',
    asOfDate,
    periodStartDate: normalizedPeriodStartDate,
    metrics: createMetrics(
      startAggregate.totalAum,
      endAggregate.totalAum,
      startHoldings.shareholders,
      endHoldings.shareholders,
      netSubscriptions,
      periodReturn,
      startAggregate.nav,
      endAggregate.nav,
      dividends,
      asOfDate,
      normalizedPeriodStartDate,
    ),
    navSection,
    flowSection,
    compositionSection,
    dividendSection,
    shareholderSection,
    notes: [
      `Valgt univers: ${getSelectedFundLabel(selectedFundIds)} / ${getSelectedClassLabel(selectedClassIds).toLowerCase()}.`,
      `Mockdataen dekker ${fundDefinitions.length} fond og ${instrumentDefinitions.length} andelsklasser; siste tilgjengelige NAV i utvalget er ${formatDateLabel(asOfDate)}.`,
    ],
  };
}
