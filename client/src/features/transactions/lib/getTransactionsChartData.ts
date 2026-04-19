import type { Transaction } from "../types/transactions";

export type VolumeDataPoint = {
    label: string;
    count: number;
};

export type TypeDataPoint = {
    type: string;
    count: number;
    percentage: number;
};

export type TransactionsChartData = {
    volumeByPeriod: VolumeDataPoint[];
    byType: TypeDataPoint[];
};

const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];

export const getTransactionsChartData = (transactions: Transaction[]): TransactionsChartData => {
    const dates = transactions.map((tx) => tx.tradeDate).filter((d): d is string => !!d).sort();
    const spanMs = dates.length >= 2
        ? new Date(dates[dates.length - 1]).getTime() - new Date(dates[0]).getTime()
        : 0;
    const useMonths = spanMs < 2 * 365 * 24 * 60 * 60 * 1000;

    // Store { label, sortKey } per period
    const periodMap = new Map<string, { label: string; sortKey: string; count: number }>();
    for (const tx of transactions) {
        if (!tx.tradeDate) continue;
        const d = new Date(tx.tradeDate);
        const year = d.getFullYear();
        const month = d.getMonth();
        const sortKey = useMonths
            ? `${year}-${String(month + 1).padStart(2, '0')}`
            : `${year}`;
        const label = useMonths
            ? `${MONTH_NAMES[month]} ${year}`
            : `${year}`;
        const existing = periodMap.get(sortKey);
        periodMap.set(sortKey, { label, sortKey, count: (existing?.count ?? 0) + 1 });
    }

    const volumeByPeriod = Array.from(periodMap.values())
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
        .map(({ label, count }) => ({ label, count }));

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

    return { volumeByPeriod, byType };
};
