import type { Transaction } from "../types/transactions";

export type TransactionsKpi = {
    totalTransactions: number;
    totalKjop: number;
    totalSalg: number;
    nettoTegning: number;
    bruttoTegning: number;
    averageTransactionSize: number;
};

export const getTransactionsKpi = (transactions: Transaction[]): TransactionsKpi => {
    const kjop = transactions.filter((tx) => tx.transactionType === "Kjøp");
    const salg = transactions.filter((tx) => tx.transactionType === "Salg");

    const toNum = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : 0);

    const sumKjop = kjop.reduce((sum, tx) => sum + toNum(tx.amount), 0);
    const sumSalg = salg.reduce((sum, tx) => sum + toNum(tx.amount), 0);
    const totalAmount = transactions.reduce((sum, tx) => sum + Math.abs(toNum(tx.amount)), 0);

    return {
        totalTransactions: transactions.length,
        totalKjop: kjop.length,
        totalSalg: salg.length,
        nettoTegning: sumKjop - sumSalg,
        bruttoTegning: sumKjop + sumSalg,
        averageTransactionSize: transactions.length > 0 ? totalAmount / transactions.length : 0,
    };
};