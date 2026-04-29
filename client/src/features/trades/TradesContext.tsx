import { createContext, useContext, useState, type ReactNode } from 'react';

export type RegisteredTrade = {
  id: string;
  customerId: string;
  customerName: string;
  fundName: string;
  shareClass: string;
  tradeDate: string;
  settlementDate: string;
  transactionType: string;
  units: number;
  price: number;
  amount: number;
  unitEffect: number;
  settlementStatus: 'ikke-oppgjort' | 'delvis-oppgjort' | 'oppgjort';
};

type TradesContextValue = {
  registeredTrades: RegisteredTrade[];
  addTrade: (trade: RegisteredTrade) => void;
};

const TradesContext = createContext<TradesContextValue | null>(null);

export function TradesProvider({ children }: { children: ReactNode }) {
  const [registeredTrades, setRegisteredTrades] = useState<RegisteredTrade[]>([]);

  function addTrade(trade: RegisteredTrade) {
    setRegisteredTrades((prev) => [trade, ...prev]);
  }

  return (
    <TradesContext.Provider value={{ registeredTrades, addTrade }}>
      {children}
    </TradesContext.Provider>
  );
}

export function useTradesContext(): TradesContextValue {
  const ctx = useContext(TradesContext);
  if (!ctx) {
    throw new Error('useTradesContext must be used within a TradesProvider');
  }
  return ctx;
}
