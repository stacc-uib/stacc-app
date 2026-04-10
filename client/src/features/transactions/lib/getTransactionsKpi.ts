import type { Transaction } from "../types/transactions";

export type TransactionsKpi = {
    totalTransactions: number;
    totalKjop: number;
    totalSalg: number;
    nettoTegning: number;
    bruttoTegning: number;
};

export const getTransactionsKpi = (transactions: Transaction[]): TransactionsKpi => {
    const kjop = transactions.filter((tx) => tx.transactionType === "Kjøp");
    const salg = transactions.filter((tx) => tx.transactionType === "Salg");

    const sumKjop = kjop.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);
    const sumSalg = salg.reduce((sum, tx) => sum + (tx.amount ?? 0), 0);

    return {
        totalTransactions: transactions.length,
        totalKjop: kjop.length,
        totalSalg: salg.length,
        // Netto tegning: netto kapitalinngang (kjøp minus salg)
        nettoTegning: sumKjop - sumSalg,
        // Brutto tegning: total omsatt kapital begge veier
        bruttoTegning: sumKjop + sumSalg,
    };
};
