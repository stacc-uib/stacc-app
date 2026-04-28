export type FundOverviewClassId = 'all' | 'A' | 'B' | 'C';

export type FundOverviewShareClassId = Exclude<FundOverviewClassId, 'all'>;

export type FundOverviewPeriodId = '1m' | 'qtd' | 'ytd' | '12m' | 'itd' | 'custom';

export type FundOverviewChartGrouping = 'combined' | 'fund' | 'class';

export type FundOverviewMetricFormat = 'currency' | 'number' | 'percent' | 'nav';

export type FundOverviewMetricDelta = {
  value: number;
  format: FundOverviewMetricFormat;
  direction: 'up' | 'down' | 'flat';
  label?: string;
};

export type FundOverviewFilters = {
  fundIds?: string[];
  classIds?: FundOverviewShareClassId[];
  fundId?: string;
  classId?: FundOverviewClassId;
  periodId: FundOverviewPeriodId;
  startDate?: string;
  endDate?: string;
  navGrouping: FundOverviewChartGrouping;
  flowGrouping: FundOverviewChartGrouping;
};

export type FundOverviewResolvedFilters = Omit<FundOverviewFilters, 'fundIds' | 'classIds'> & {
  fundIds: string[];
  classIds: FundOverviewShareClassId[];
};

export type FundOverviewSelectOption = {
  id: string;
  label: string;
};

export type FundOverviewDateOption = {
  date: string;
  label: string;
};

export type FundOverviewMetric = {
  id: string;
  label: string;
  value: number;
  format: FundOverviewMetricFormat;
  meta: string;
  delta?: FundOverviewMetricDelta;
};

export type FundOverviewLinePoint = {
  date: string;
  label: string;
  value: number;
};

export type FundOverviewLineSeries = {
  id: string;
  label: string;
  color: string;
  points: FundOverviewLinePoint[];
};

export type FundOverviewFlowPoint = {
  date: string;
  label: string;
  grossBuy: number;
  grossSell: number;
  net: number;
};

export type FundOverviewFlowContributorRow = {
  customerId: string;
  investorName: string;
  investorType: string;
  investorCategory: string;
  amount: number;
  tradeCount: number;
  shareOfFlow: number;
};

export type FundOverviewCompositionPoint = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export type FundOverviewCompositionSection = {
  funds: FundOverviewCompositionPoint[];
  classes: FundOverviewCompositionPoint[];
  investorCategories: FundOverviewCompositionPoint[];
  largestOwners: FundOverviewCompositionPoint[];
};

export type FundOverviewNavSection = {
  series: FundOverviewLineSeries[];
  kpis: FundOverviewMetric[];
  description: string;
  groupingOptions: FundOverviewSelectOption[];
  activeGrouping: FundOverviewChartGrouping;
};

export type FundOverviewFlowSection = {
  combinedPoints: FundOverviewFlowPoint[];
  series: FundOverviewLineSeries[];
  kpis: FundOverviewMetric[];
  buyContributors: FundOverviewFlowContributorRow[];
  sellContributors: FundOverviewFlowContributorRow[];
  description: string;
  granularityLabel: string;
  groupingOptions: FundOverviewSelectOption[];
  activeGrouping: FundOverviewChartGrouping;
};

export type FundOverviewDividendRow = {
  tradeId: string;
  date: string;
  dateLabel: string;
  investorName: string;
  investorType: string;
  fundLabel: string;
  classLabel: string;
  amount: number;
  rate: number;
};

export type FundOverviewDividendSection = {
  rows: FundOverviewDividendRow[];
  kpis: FundOverviewMetric[];
  description: string;
};

export type FundOverviewTopShareholder = {
  customerId: string;
  investorName: string;
  investorType: string;
  investorCategory: string;
  marketValue: number;
  ownershipShare: number;
  units: number;
  exposureCount: number;
};

export type FundOverviewShareholderSection = {
  rows: FundOverviewTopShareholder[];
  kpis: FundOverviewMetric[];
  description: string;
  showUnits: boolean;
};

export type FundOverviewSnapshot = {
  fundOptions: FundOverviewSelectOption[];
  classOptions: FundOverviewSelectOption[];
  periodOptions: FundOverviewSelectOption[];
  groupingOptions: FundOverviewSelectOption[];
  availableDateOptions: FundOverviewDateOption[];
  filters: FundOverviewResolvedFilters;
  selectedFundLabel: string;
  selectedClassLabel: string;
  selectedPeriodLabel: string;
  asOfDate: string;
  periodStartDate: string;
  metrics: FundOverviewMetric[];
  navSection: FundOverviewNavSection;
  flowSection: FundOverviewFlowSection;
  compositionSection: FundOverviewCompositionSection;
  dividendSection: FundOverviewDividendSection;
  shareholderSection: FundOverviewShareholderSection;
  notes: string[];
};
