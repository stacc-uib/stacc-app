export type Trade = {
  id: string;
  customerId: string;
  customerName: string | null;
  fundName: string | null;
  shareClass: string | null;
  tradeDate: string | null;
  settlementDate: string | null;
  transactionType: string | null;
  units: number | null;
  price: number | null;
  amount: number | null;
  unitEffect: number | null;
};

