export type Trade = {
  id: string;
  customerId: string;
  customerName: string | null;
  fundName: string | null;
  shareClass: string | null;
  tradeDate: string | null;
  settlementDate: string | null;
  transactionType: "Andre kostnader" | "Kildeskatt" | "Kjøp" | "Kostnadsførte kjøpsomk." | "Realisert valutatap (Disagio)" | "Salg" | "Tildelt ved aksjesplitt" | "Urealisert gevinst" | "Urealisert tap" | "Utbytte" | null;
  units: number | null;
  price: number | null;
  amount: number | null;
  unitEffect: number | null;
};
