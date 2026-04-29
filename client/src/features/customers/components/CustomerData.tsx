import { useEffect, useState } from 'react';
import investorsData from '../../../mocks/investors.json';
import tradesData from '../../../mocks/trades.json';
import MultiSelectFilter from '../../../shared/components/MultiSelectFilter';
import { getCustomerComplianceData } from '../../../shared/lib/getCustomerComplianceData';
import type { InvestorClassificationStatus } from '../../../shared/types/compliance';
import { formatCurrency } from '../../../shared/utils/format';
import { HoldingFilter } from './CustomerChanges';

export type FundType = 'Norden' | 'Global' | 'Kreditt';

export const ALL_FUND_TYPES: readonly FundType[] = ['Norden', 'Global', 'Kreditt'] as const;
export const ALL_CLASSES = ['Klasse A', 'Klasse B', 'Klasse C'] as const;
export type KlasseType = (typeof ALL_CLASSES)[number];
export const ALL_CUSTOMER_TYPES = [
  'Aksjeselskap',
  'Ansatt',
  'Fond',
  'Fondsforvalter',
  'Forsikringsselskap',
  'Pensjonskasse',
  'Privatperson',
  'Stiftelse',
] as const;
export type CustomerType = (typeof ALL_CUSTOMER_TYPES)[number];

export type Fund = {
  type: FundType;
  amount: number;
};

export type Customer = {
  id: string;
  name: string;
  klasse: string;
  type: string;
  totalBeholdning: number;
  funds: Fund[];
};

type InvestorRecord = {
  customerId: string;
  name: string;
  customerType: string;
  category: string;
};

type TradeRecord = {
  id: string;
  customerId: string;
  customerName: string;
  fundName: string;
  shareClass: string;
  tradeDate: string;
  transactionType: string;
  units: number;
  price: number;
  amount: number;
  unitEffect: number;
};

function getFundTypeFromName(fundName: string): FundType {
  if (fundName.includes('Global')) return 'Global';
  if (fundName.includes('Norden')) return 'Norden';
  if (fundName.includes('Kreditt')) return 'Kreditt';
  return 'Global';
}

function getClassFromShareClass(shareClass: string): string {
  if (shareClass.includes('Klasse A')) return 'Klasse A';
  if (shareClass.includes('Klasse B')) return 'Klasse B';
  if (shareClass.includes('Klasse C')) return 'Klasse C';
  return 'Klasse A';
}

function getLatestTradeForCustomer(customerId: string, trades: TradeRecord[]): TradeRecord | null {
  const customerTrades = trades.filter((trade) => trade.customerId === customerId);
  if (customerTrades.length === 0) return null;

  return customerTrades.reduce((latest, current) =>
    new Date(current.tradeDate) > new Date(latest.tradeDate) ? current : latest,
  );
}

function calculateCustomerHoldings(
  customerId: string,
  trades: TradeRecord[],
): { totalValue: number; funds: Fund[] } {
  const fundMap = new Map<FundType, number>();

  trades
    .filter((trade) => trade.customerId === customerId)
    .forEach((trade) => {
      const fundType = getFundTypeFromName(trade.fundName);
      const isSalg = trade.transactionType.toLowerCase() === 'salg';
      const value = isSalg ? -trade.amount : trade.amount;
      fundMap.set(fundType, (fundMap.get(fundType) || 0) + value);
    });

  const funds: Fund[] = Array.from(fundMap.entries())
    .filter(([, amount]) => amount > 0)
    .map(([type, amount]) => ({ type, amount }));

  const totalValue = funds.reduce((sum, f) => sum + f.amount, 0);
  return { totalValue, funds };
}

function matchesHoldingFilter(customer: Customer, filter: HoldingFilter): boolean {
  if (!filter) return true;
  const fundsAboveMillion = customer.funds.filter((f) => f.amount >= 1_000_000);
  const fundsNearMillion = customer.funds.filter(
    (f) => f.amount >= 900_000 && f.amount < 1_000_000,
  );
  if (filter === 'sterk') {
    return customer.klasse === 'Klasse C' && customer.totalBeholdning > 1_000_000;
  }
  if (filter === 'naer') {
    return fundsAboveMillion.length === 2 && fundsNearMillion.length >= 1;
  }
  return true;
}

function getComplianceBadgeClass(status: InvestorClassificationStatus): string {
  switch (status) {
    case 'pep-forfalt':
    case 'ikke-profesjonell':
      return 'status-badge status-badge--critical';
    case 'mangler-naering':
    case 'pep-forfaller-snart':
      return 'status-badge status-badge--warning';
    default:
      return 'status-badge status-badge--ok';
  }
}

function CustomersList({
  filteredCustomerId,
  holdingFilter,
}: {
  filteredCustomerId?: string;
  holdingFilter?: HoldingFilter;
}) {
  const [data, setData] = useState<Customer[] | null>(null);
  const [selectedFundTypes, setSelectedFundTypes] = useState<FundType[]>([...ALL_FUND_TYPES]);
  const [selectedClasses, setSelectedClasses] = useState<KlasseType[]>([...ALL_CLASSES]);
  const [selectedCustomerTypes, setSelectedCustomerTypes] = useState<CustomerType[]>([
    ...ALL_CUSTOMER_TYPES,
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function processData() {
      setLoading(true);
      setError(null);

      try {
        const investors = investorsData as InvestorRecord[];
        const trades = tradesData as TradeRecord[];

        let customers: Customer[] = investors.map((investor) => {
          const latestTrade = getLatestTradeForCustomer(investor.customerId, trades);
          const { totalValue, funds } = calculateCustomerHoldings(investor.customerId, trades);

          let klasse = 'Klasse A';
          if (latestTrade) {
            klasse = getClassFromShareClass(latestTrade.shareClass);
          }

          return {
            id: investor.customerId,
            name: investor.name,
            klasse,
            type: investor.customerType,
            totalBeholdning: totalValue,
            funds,
          };
        });

        if (filteredCustomerId) {
          customers = customers.filter((c) => c.id === filteredCustomerId);
        }

        await new Promise((r) => setTimeout(r, 250));
        if (!cancelled) setData(customers);
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Feil ved behandling av data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    processData();
    return () => {
      cancelled = true;
    };
  }, [filteredCustomerId]);

  if (loading) return <div>Laster kunder…</div>;
  if (error) return <div className="error">Feil: {error}</div>;
  if (!data || data.length === 0) return <div>Ingen kunder funnet.</div>;

  return (
    <table className="customers-table" aria-label="Kundeoversikt">
      <thead>
        <tr>
          <th>KundeID</th>
          <th>Kundenavn</th>
          <th className="th-fondstyper">
            <MultiSelectFilter
              label="Klasse"
              options={ALL_CLASSES}
              selected={selectedClasses}
              onChange={setSelectedClasses}
            />
          </th>
          <th className="th-fondstyper">
            <MultiSelectFilter
              label="Kundetype"
              options={ALL_CUSTOMER_TYPES}
              selected={selectedCustomerTypes}
              onChange={setSelectedCustomerTypes}
            />
          </th>
          <th className="th-fondstyper">
            <MultiSelectFilter
              label="Fondsbeholdning"
              options={ALL_FUND_TYPES}
              selected={selectedFundTypes}
              onChange={setSelectedFundTypes}
              ariaLabel="Filtrer fondstyper"
            />
          </th>
          <th>Compliance</th>
          <th>Beholdning</th>
        </tr>
      </thead>
      <tbody>
        {data
          .filter((c) => {
            if (!matchesHoldingFilter(c, holdingFilter ?? null)) return false;
            const activeClasses =
              selectedClasses.length === 0 ? ALL_CLASSES : selectedClasses;
            if (!activeClasses.includes(c.klasse as KlasseType)) return false;
            const activeTypes =
              selectedCustomerTypes.length === 0 ? ALL_CUSTOMER_TYPES : selectedCustomerTypes;
            if (!activeTypes.includes(c.type as CustomerType)) return false;
            const activeFundTypes =
              selectedFundTypes.length === 0 ? ALL_FUND_TYPES : selectedFundTypes;
            return c.funds.some((f) => activeFundTypes.includes(f.type));
          })
          .map((c) => {
            const activeFundTypes =
              selectedFundTypes.length === 0 ? ALL_FUND_TYPES : selectedFundTypes;
            const filteredHolding = c.funds
              .filter((f) => activeFundTypes.includes(f.type))
              .reduce((sum, f) => sum + f.amount, 0);
            const complianceData = getCustomerComplianceData(c.id);
            return (
              <tr
                key={c.id}
                className="cd-clickable-row"
                onClick={() => {
                  window.location.hash = `#kundeoversikt/${c.id}`;
                }}
                style={{ cursor: 'pointer' }}
              >
                <td className="td-id">{c.id}</td>
                <td className="td-name">{c.name}</td>
                <td>{c.klasse}</td>
                <td>{c.type}</td>
                <td className="td-right">{formatCurrency(filteredHolding)}</td>
                <td>
                  {complianceData ? (
                    complianceData.classificationStatus === 'ok' ? (
                      <span className={getComplianceBadgeClass(complianceData.classificationStatus)}>
                        {complianceData.classificationLabel}
                      </span>
                    ) : (
                      <span
                        className={getComplianceBadgeClass(complianceData.classificationStatus)}
                        role="button"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.hash = '#rapporter/investorer';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            e.preventDefault();
                            window.location.hash = '#rapporter/investorer';
                          }
                        }}
                      >
                        {complianceData.classificationLabel}
                      </span>
                    )
                  ) : (
                    <span className="status-badge status-badge--neutral">Ukjent</span>
                  )}
                </td>
                <td className="td-right">{formatCurrency(c.totalBeholdning)}</td>
              </tr>
            );
          })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={7} className="table-footer" />
        </tr>
      </tfoot>
    </table>
  );
}

export default CustomersList;
