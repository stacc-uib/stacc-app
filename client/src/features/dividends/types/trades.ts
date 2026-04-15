export type TradeDirection = 'kjop' | 'salg';

export type TradeSettlementStatus =
  | 'ikke-oppgjort'
  | 'delvis-oppgjort'
  | 'oppgjort';

export type TradeClassOption = {
  id: 'A' | 'B' | 'C';
  label: string;
  minimumSubscriptionAmount: number;
  annualManagementFee: number;
  latestPrice: number;
  latestPriceDate: string | null;
  shareClassLabel: string;
};

export type TradeFundOption = {
  id: string;
  name: string;
  shortName: string;
  classes: TradeClassOption[];
};

export type TradeInvestorHolding = {
  holdingId: string;
  fundId: string;
  fundName: string;
  classId: 'A' | 'B' | 'C';
  shareClassLabel: string;
  units: number;
  estimatedValue: number;
};

export type TradeInvestorRecentTrade = {
  tradeId: string;
  tradeDate: string;
  tradeDateLabel: string;
  transactionType: 'Kjøp' | 'Salg';
  fundName: string;
  shareClassLabel: string;
  amount: number;
  units: number;
};

export type TradeInvestorOption = {
  customerId: string;
  investorName: string;
  investorType: string;
  investorCategory: 'Profesjonell' | 'Ikke-profesjonell';
  pepStatus: 'Ja' | 'Nei';
  amlRiskLevel: 'Lav' | 'Medium' | 'Høy';
  documentationStatus: 'Komplett' | 'Mangler oppdatering' | 'Mangler dokumentasjon';
  holdings: TradeInvestorHolding[];
  recentTrades: TradeInvestorRecentTrade[];
};

export type TradeRegistrationData = {
  funds: TradeFundOption[];
  investors: TradeInvestorOption[];
};
