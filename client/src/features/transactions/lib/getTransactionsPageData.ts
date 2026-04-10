import type { Transaction } from "../types/transactions";
import { getTransactionsKpi, type TransactionsKpi } from "./getTransactionsKpi";
import trades from "../../../mocks/trades.json";

export type TransactionsPageData = {
    transactions: Transaction[];
    kpi: TransactionsKpi;
};

export const getTransactionsPageData = (): TransactionsPageData => {
    const valid = (trades as unknown as Transaction[])
        .filter((tx) =>
            tx.tradeDate !== null &&
            tx.tradeDate !== undefined &&
            tx.customerName !== null &&
            tx.customerName !== undefined &&
            tx.customerId !== "None"
        )
        .reverse();

    return {
        transactions: valid,
        kpi: getTransactionsKpi(valid),
    };
};
