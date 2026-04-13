import type { Transaction } from "../types/transactions";

export type DateRange = {
    from: string;
    to: string;
};

export const getTransactionsDateRange = (transactions: Transaction[]): DateRange => {
    const dates = transactions
        .map((tx) => tx.tradeDate)
        .filter((d): d is string => typeof d === 'string');

    return {
        from: dates.reduce((min, d) => d < min ? d : min, dates[0] ?? ''),
        to: dates.reduce((max, d) => d > max ? d : max, dates[0] ?? ''),
    };
};

export const applyDateRange = (transactions: Transaction[], range: DateRange): Transaction[] => {
    return transactions.filter((tx) => {
        if (!tx.tradeDate) return false;
        if (range.from && tx.tradeDate < range.from) return false;
        if (range.to && tx.tradeDate > range.to) return false;
        return true;
    });
};

// Returnerer en DateRange basert på en snarvei relativt til maks-dato i dataen
export const getPresetRange = (preset: '1m' | '6m' | '1y' | '5y' | '10y', maxDate: string): DateRange => {
    const to = maxDate;
    const d = new Date(maxDate);

    switch (preset) {
        case '1m':  d.setMonth(d.getMonth() - 1); break;
        case '6m':  d.setMonth(d.getMonth() - 6); break;
        case '1y':  d.setFullYear(d.getFullYear() - 1); break;
        case '5y':  d.setFullYear(d.getFullYear() - 5); break;
        case '10y': d.setFullYear(d.getFullYear() - 10); break;
    }

    return { from: d.toISOString().slice(0, 10), to };
};
