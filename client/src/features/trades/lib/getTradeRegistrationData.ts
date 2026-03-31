import investors from '../../../mocks/investors.json';
import tradeRecords from '../../../mocks/trades.json';
import { investorComplianceDetails } from '../../compliance/mocks/investorComplianceDetails';
import type {
  TradeClassOption,
  TradeFundOption,
  TradeInvestorHolding,
  TradeInvestorOption,
  TradeInvestorRecentTrade,
  TradeRegistrationData,
} from '../types/trades';

type InvestorRecord = {
  customerId: string;
  name: string;
  customerType: string;
  category: 'Professional' | 'Retail';
};

type RawTradeRecord = {
  id: string;
  customerId: string | null;
  customerName: string | null;
  fundName: string | null;
  shareClass: string | null;
  tradeDate: string | null;
  transactionType: string | null;
  units: number | null;
  price: number | null;
  amount: number | null;
  unitEffect: number | null;
};

const fundBlueprints = [
  { id: 'escali-norden', shortName: 'Escali Norden', name: 'Escali Norden' },
  { id: 'escali-global', shortName: 'Escali Global', name: 'Escali Global' },
  { id: 'escali-kreditt', shortName: 'Escali Kreditt', name: 'Escali Kreditt' },
] as const;

const classBlueprints = [
  {
    id: 'A',
    label: 'Klasse A',
    minimumSubscriptionAmount: 0,
    annualManagementFee: 0,
  },
  {
    id: 'B',
    label: 'Klasse B',
    minimumSubscriptionAmount: 1_000_000,
    annualManagementFee: 0.75,
  },
  {
    id: 'C',
    label: 'Klasse C',
    minimumSubscriptionAmount: 100_000,
    annualManagementFee: 1,
  },
] as const;

function formatDateLabel(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
}

function normalizeTransactionType(value: string | null): 'Kjop' | 'Salg' | 'Utbytte' | null {
  if (!value) {
    return null;
  }

  if (value.includes('Salg')) {
    return 'Salg';
  }

  if (value.includes('Utbytte')) {
    return 'Utbytte';
  }

  return 'Kjop';
}

function getFundIdFromName(fundName: string | null) {
  if (!fundName) {
    return null;
  }

  const match = fundBlueprints.find((fund) => fundName.includes(fund.shortName));
  return match?.id ?? null;
}

function getClassIdFromShareClass(shareClass: string | null) {
  if (!shareClass) {
    return null;
  }

  if (shareClass.includes('Klasse A')) {
    return 'A';
  }

  if (shareClass.includes('Klasse B')) {
    return 'B';
  }

  if (shareClass.includes('Klasse C')) {
    return 'C';
  }

  return null;
}

function compareDatesDescending(left: string | null, right: string | null) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return right.localeCompare(left);
}

function getLatestTradePriceMap() {
  const latestTradeByInstrument = new Map<
    string,
    { price: number; tradeDate: string | null }
  >();

  for (const trade of tradeRecords as RawTradeRecord[]) {
    const transactionType = normalizeTransactionType(trade.transactionType);
    const fundId = getFundIdFromName(trade.fundName);
    const classId = getClassIdFromShareClass(trade.shareClass);

    if (
      transactionType === 'Utbytte' ||
      !fundId ||
      !classId ||
      !trade.price ||
      !trade.tradeDate
    ) {
      continue;
    }

    const instrumentId = `${fundId}-${classId}`;
    const current = latestTradeByInstrument.get(instrumentId);

    if (!current || compareDatesDescending(current.tradeDate, trade.tradeDate) > 0) {
      latestTradeByInstrument.set(instrumentId, {
        price: trade.price,
        tradeDate: trade.tradeDate,
      });
    }
  }

  return latestTradeByInstrument;
}

function getFunds(): TradeFundOption[] {
  const latestTradePriceMap = getLatestTradePriceMap();

  return fundBlueprints.map((fund) => ({
    id: fund.id,
    name: fund.name,
    shortName: fund.shortName,
    classes: classBlueprints.map((shareClass) => {
      const latestTrade = latestTradePriceMap.get(`${fund.id}-${shareClass.id}`);

      return {
        id: shareClass.id,
        label: shareClass.label,
        minimumSubscriptionAmount: shareClass.minimumSubscriptionAmount,
        annualManagementFee: shareClass.annualManagementFee,
        latestPrice: latestTrade?.price ?? 0,
        latestPriceDate: latestTrade?.tradeDate ?? null,
        shareClassLabel: `${fund.shortName} - ${shareClass.label}`,
      } satisfies TradeClassOption;
    }),
  }));
}

function getInvestorHoldings(funds: TradeFundOption[]) {
  const holdingUnitsByInvestor = new Map<string, number>();
  const priceByInstrument = new Map<string, number>();

  for (const fund of funds) {
    for (const shareClass of fund.classes) {
      priceByInstrument.set(`${fund.id}-${shareClass.id}`, shareClass.latestPrice);
    }
  }

  for (const trade of tradeRecords as RawTradeRecord[]) {
    const fundId = getFundIdFromName(trade.fundName);
    const classId = getClassIdFromShareClass(trade.shareClass);

    if (!trade.customerId || trade.customerId === 'None' || !fundId || !classId) {
      continue;
    }

    const unitEffect = trade.unitEffect ?? 0;
    const key = `${trade.customerId}-${fundId}-${classId}`;
    holdingUnitsByInvestor.set(key, (holdingUnitsByInvestor.get(key) ?? 0) + unitEffect);
  }

  return { holdingUnitsByInvestor, priceByInstrument };
}

function getRecentTradesByInvestor() {
  const recentTradesByInvestor = new Map<string, TradeInvestorRecentTrade[]>();

  for (const trade of tradeRecords as RawTradeRecord[]) {
    const transactionType = normalizeTransactionType(trade.transactionType);

    if (
      !trade.customerId ||
      trade.customerId === 'None' ||
      !trade.tradeDate ||
      !trade.fundName ||
      !trade.shareClass ||
      !trade.amount ||
      !trade.units ||
      !transactionType ||
      transactionType === 'Utbytte'
    ) {
      continue;
    }

    const items = recentTradesByInvestor.get(trade.customerId) ?? [];
    items.push({
      tradeId: trade.id,
      tradeDate: trade.tradeDate,
      tradeDateLabel: formatDateLabel(trade.tradeDate),
      transactionType,
      fundName: trade.fundName.replace(' AS', ''),
      shareClassLabel: trade.shareClass.replace(' AS', ''),
      amount: trade.amount,
      units: trade.units,
    });
    recentTradesByInvestor.set(trade.customerId, items);
  }

  for (const [customerId, items] of recentTradesByInvestor.entries()) {
    recentTradesByInvestor.set(
      customerId,
      items
        .sort((left, right) => right.tradeDate.localeCompare(left.tradeDate))
        .slice(0, 4),
    );
  }

  return recentTradesByInvestor;
}

export function getTradeRegistrationData(): TradeRegistrationData {
  const funds = getFunds();
  const complianceDetailByCustomerId = new Map(
    investorComplianceDetails.map((detail) => [detail.customerId, detail]),
  );
  const { holdingUnitsByInvestor, priceByInstrument } = getInvestorHoldings(funds);
  const recentTradesByInvestor = getRecentTradesByInvestor();

  const investorOptions = (investors as InvestorRecord[])
    .map((investor) => {
      const complianceDetail = complianceDetailByCustomerId.get(investor.customerId);

      const holdings = funds
        .flatMap((fund) =>
          fund.classes.map((shareClass) => {
            const key = `${investor.customerId}-${fund.id}-${shareClass.id}`;
            const units = holdingUnitsByInvestor.get(key) ?? 0;

            if (units <= 0) {
              return null;
            }

            return {
              holdingId: key,
              fundId: fund.id,
              fundName: fund.shortName,
              classId: shareClass.id,
              shareClassLabel: shareClass.label,
              units,
              estimatedValue: units * (priceByInstrument.get(`${fund.id}-${shareClass.id}`) ?? 0),
            } satisfies TradeInvestorHolding;
          }),
        )
        .filter((holding): holding is TradeInvestorHolding => holding !== null)
        .sort((left, right) => right.estimatedValue - left.estimatedValue);

      return {
        customerId: investor.customerId,
        investorName: investor.name,
        investorType: investor.customerType,
        investorCategory:
          investor.category === 'Professional' ? 'Profesjonell' : 'Ikke-profesjonell',
        pepStatus: complianceDetail?.pepStatus ? 'Ja' : 'Nei',
        amlRiskLevel:
          complianceDetail?.amlRiskLevel === 'Høy'
            ? 'Hoy'
            : complianceDetail?.amlRiskLevel ?? 'Lav',
        documentationStatus: complianceDetail?.documentationStatus ?? 'Komplett',
        holdings,
        recentTrades: recentTradesByInvestor.get(investor.customerId) ?? [],
      } satisfies TradeInvestorOption;
    })
    .sort((left, right) => left.investorName.localeCompare(right.investorName, 'nb'));

  return {
    funds,
    investors: investorOptions,
  };
}
