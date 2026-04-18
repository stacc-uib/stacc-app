import type { Transaction } from "../types/transactions";
import { applyDateRange } from "./getTransactionsDateRange";

export type TransactionsGrowth = {
    countGrowthPct: number | null;
    amountGrowthPct: number | null;
};

export const getTransactionsGrowth = (
    transactions: Transaction[],
    fromDate: string,
    toDate: string,
): TransactionsGrowth => {
    const fromMs = new Date(fromDate).getTime();
    const toMs = new Date(toDate).getTime();
    const midMs = fromMs + (toMs - fromMs) / 2;
    const midDate = new Date(midMs).toISOString().slice(0, 10);

    const firstHalf = applyDateRange(transactions, { from: fromDate, to: midDate });
    const secondHalf = applyDateRange(transactions, { from: midDate, to: toDate });

    const firstAmount = firstHalf.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const secondAmount = secondHalf.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const countGrowthPct = firstHalf.length > 0
        ? ((secondHalf.length - firstHalf.length) / firstHalf.length) * 100
        : null;

    const amountGrowthPct = firstAmount > 0
        ? ((secondAmount - firstAmount) / firstAmount) * 100
        : null;

    return { countGrowthPct, amountGrowthPct };
};
