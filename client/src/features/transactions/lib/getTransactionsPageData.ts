import { Transaction } from "../types/transactions";
import trades from "../../../mocks/trades.json";

export type TransactionsPageData = {
    transactions: Transaction[];
};

export const getTransactionsPageData = (): TransactionsPageData => {
    return {
        transactions: trades as Transaction[],
    };
};
