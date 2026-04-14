import type { Transaction } from "../types/transactions";
import { applyDateRange } from "./getTransactionsDateRange";

export type TransactionsGrowth = {
    countGrowthPct: number | null;
    amountGrowthPct: number | null;
};

export const getTransactionsGrowth = (
    allTransactions: Transaction[],
    fromDate: string,
    toDate: string,
): TransactionsGrowth => {
    const fromMs = new Date(fromDate).getTime();
    const toMs = new Date(toDate).getTime();
    const periodMs = toMs - fromMs;

    // Forrige periode: like lang, rett før
    const prevTo = new Date(fromMs - 1).toISOString().slice(0, 10);
    const prevFrom = new Date(fromMs - periodMs).toISOString().slice(0, 10);

    const current = applyDateRange(allTransactions, { from: fromDate, to: toDate });
    const previous = applyDateRange(allTransactions, { from: prevFrom, to: prevTo });

    const currentAmount = current.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const previousAmount = previous.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const countGrowthPct = previous.length > 0
        ? ((current.length - previous.length) / previous.length) * 100
        : null;

    const amountGrowthPct = previousAmount > 0
        ? ((currentAmount - previousAmount) / previousAmount) * 100
        : null;

    return { countGrowthPct, amountGrowthPct };
};
