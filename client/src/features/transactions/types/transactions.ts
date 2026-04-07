export type Transaction = {
  id: string;
  customerId: string;
  customerName: string;
  fundName: string;
  shareClass: string;
  tradeDate: string;
  settlementDate: string;
  transactionType: "Andre kostnader" | "Kildeskatt" | "Kjøp" | "Kostnadsførte kjøpsomk." | "Realisert valutatap (Disagio)" | "Salg" | "Tildelt ved aksjesplitt" | "Urealisert gevinst" | "Urealisert tap" | "Utbytte";
  units: number;
  price: number;
  amount: number;
  unitEffect: number;
};