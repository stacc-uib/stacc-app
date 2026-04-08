import type { Transaction } from "../types/transactions";
import trades from "../../../mocks/trades.json";

export type TransactionsPageData = {
    transactions: Transaction[];
    total: number;
};

export const getTransactionsPageData = (): TransactionsPageData => {
    const valid = (trades as Transaction[])
        .filter((tx) => tx.tradeDate !== null && tx.customerName !== null);

    return {
        transactions: valid.slice(-20).reverse(),
        total: valid.length,
    };
};
