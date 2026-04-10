import type { Transaction } from "../types/transactions";

export type VolumeDataPoint = {
    year: number;
    count: number;
};

export type TypeDataPoint = {
    type: string;
    count: number;
    percentage: number;
};

export type TransactionsChartData = {
    volumeByYear: VolumeDataPoint[];
    byType: TypeDataPoint[];
};

export const getTransactionsChartData = (transactions: Transaction[]): TransactionsChartData => {
    // Volum per år
    const countByYear = new Map<number, number>();
    for (const tx of transactions) {
        if (!tx.tradeDate) continue;
        const year = new Date(tx.tradeDate).getFullYear();
        countByYear.set(year, (countByYear.get(year) ?? 0) + 1);
    }
    const volumeByYear = Array.from(countByYear.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => a.year - b.year);

    // Fordeling per transaksjonstype
    const countByType = new Map<string, number>();
    for (const tx of transactions) {
        if (!tx.transactionType) continue;
        countByType.set(tx.transactionType, (countByType.get(tx.transactionType) ?? 0) + 1);
    }
    const total = transactions.length;
    const byType = Array.from(countByType.entries())
        .map(([type, count]) => ({
            type,
            count,
            percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count);

    return { volumeByYear, byType };
};
