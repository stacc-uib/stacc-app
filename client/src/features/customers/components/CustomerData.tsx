import React, { useEffect, useState } from 'react';
import investorsData from '../../../mocks/investors.json';
import tradesData from '../../../mocks/trades.json';
import fundsData from '../../../mocks/funds.json';
import FundTypeFilter, { ALL_FUND_TYPES } from './FundTypeFilter';
import ClassFilter, { ALL_CLASSES, KlasseType } from './ClassFilter';
import CustomerTypeFilter, { ALL_CUSTOMER_TYPES, CustomerType } from './CustomerTypeFilter';

export type FundType = 'Norden' | 'Global' | 'Kreditt';

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
  return 'Global'; // fallback
}

function getClassFromShareClass(shareClass: string): string {
  if (shareClass.includes('Klasse A')) return 'Klasse A';
  if (shareClass.includes('Klasse B')) return 'Klasse B';
  if (shareClass.includes('Klasse C')) return 'Klasse C';
  return 'Klasse A'; // fallback
}

function getLatestTradeForCustomer(customerId: string, trades: TradeRecord[]): TradeRecord | null {
  const customerTrades = trades.filter(trade => trade.customerId === customerId);
  if (customerTrades.length === 0) return null;
  
  return customerTrades.reduce((latest, current) => {
    return new Date(current.tradeDate) > new Date(latest.tradeDate) ? current : latest;
  });
}

function calculateCustomerHoldings(customerId: string, trades: TradeRecord[]): { totalValue: number; funds: Fund[] } {
  const fundMap = new Map<FundType, number>();
  let totalValue = 0;

  trades
    .filter(trade => trade.customerId === customerId)
    .forEach(trade => {
      const fundType = getFundTypeFromName(trade.fundName);
      const value = trade.unitEffect * trade.price;
      
      const currentAmount = fundMap.get(fundType) || 0;
      fundMap.set(fundType, currentAmount + value);
      totalValue += value;
    });

  const funds: Fund[] = Array.from(fundMap.entries())
    .filter(([_, amount]) => amount > 0)
    .map(([type, amount]) => ({ type, amount }));

  return { totalValue, funds };
}

function formatCurrency(n: number) {
  return n.toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


function CustomersList({ filteredCustomerId }: { filteredCustomerId?: string }) {
  const [data, setData] = useState<Customer[] | null>(null);
  const [selectedFundTypes, setSelectedFundTypes] = useState([...ALL_FUND_TYPES]);
  const [selectedClasses, setSelectedClasses] = useState<KlasseType[]>([...ALL_CLASSES]);
  const [selectedCustomerTypes, setSelectedCustomerTypes] = useState<CustomerType[]>([...ALL_CUSTOMER_TYPES]);
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

        let customers: Customer[] = investors.map(investor => {
          const latestTrade = getLatestTradeForCustomer(investor.customerId, trades);
          const { totalValue, funds } = calculateCustomerHoldings(investor.customerId, trades);
          
          let klasse = 'Klasse A'; // default
          if (latestTrade) {
            klasse = getClassFromShareClass(latestTrade.shareClass);
          }

          return {
            id: investor.customerId,
            name: investor.name,
            klasse,
            type: investor.customerType,
            totalBeholdning: totalValue,
            funds
          };
        });

        // Filtrer hvis en kunde er valgt
        if (filteredCustomerId) {
          customers = customers.filter(c => c.id === filteredCustomerId);
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
            <ClassFilter selected={selectedClasses} onChange={setSelectedClasses} />
          </th>
          <th className="th-fondstyper">
            <CustomerTypeFilter selected={selectedCustomerTypes} onChange={setSelectedCustomerTypes} />
          </th>
          <th className="th-fondstyper">
            <FundTypeFilter selected={selectedFundTypes} onChange={setSelectedFundTypes} />
          </th>
          <th>Beholdning</th>
        </tr>
      </thead>
      <tbody>
        {data
          .filter(c => {
            const activeClasses = selectedClasses.length === 0 ? ALL_CLASSES : selectedClasses;
            if (!activeClasses.includes(c.klasse as KlasseType)) return false;
            const activeTypes = selectedCustomerTypes.length === 0 ? ALL_CUSTOMER_TYPES : selectedCustomerTypes;
            if (!activeTypes.includes(c.type as CustomerType)) return false;
            const activeFundTypes = selectedFundTypes.length === 0 ? ALL_FUND_TYPES : selectedFundTypes;
            return c.funds.some(f => activeFundTypes.includes(f.type));
          })
          .map((c) => {
          const activeFundTypes = selectedFundTypes.length === 0 ? ALL_FUND_TYPES : selectedFundTypes;
          const filteredHolding = c.funds
            .filter(f => activeFundTypes.includes(f.type))
            .reduce((sum, f) => sum + f.amount, 0);
          return (
            <tr
              key={c.id}
              className="cd-clickable-row"
              onClick={() => { window.location.hash = `#kundeoversikt/${c.id}`; }}
              style={{ cursor: 'pointer' }}
            >
              <td className="td-id">{c.id}</td>
              <td className="td-name">{c.name}</td>
              <td>{c.klasse}</td>
              <td>{c.type}</td>
              <td className="td-right">{formatCurrency(filteredHolding)}</td>
              <td className="td-right">{formatCurrency(c.totalBeholdning)}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={6} className="table-footer" />
        </tr>
      </tfoot>
    </table>
  );
}

export default CustomersList;

