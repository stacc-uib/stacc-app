import type { Transaction } from "../types/transactions";

export type DateRange = {
    from: string;
    to: string;
};

export type Preset = '1y' | '5y' | '10y' | '20y';

export const getTransactionsDateRange = (transactions: Transaction[]): DateRange => {
    const dates = transactions
        .map((tx) => tx.tradeDate)
        .filter((d): d is string => typeof d === 'string')
        .sort();

    return {
        from: dates[0] ?? '',
        to: dates[dates.length - 1] ?? '',
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

export const getPresetRange = (preset: Preset, maxDate: string, _minDate: string): DateRange => {
    const d = new Date(maxDate);
    switch (preset) {
        case '1y':  d.setFullYear(d.getFullYear() - 1); break;
        case '5y':  d.setFullYear(d.getFullYear() - 5); break;
        case '10y': d.setFullYear(d.getFullYear() - 10); break;
        case '20y': d.setFullYear(d.getFullYear() - 20); break;
    }
    return { from: d.toISOString().slice(0, 10), to: maxDate };
};
