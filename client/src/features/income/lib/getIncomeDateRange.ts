import type { Trade } from "../types/trade";
import type { IncomeData } from "../lib/getIncomeData";
import type { DateRange } from "../types/dateRange";

export type Preset = '1y' | '5y' | '10y' | 'ytd';

export const getIncomeDateRange = (incomeData: IncomeData): DateRange => {
    const dates = incomeData.events
        .map((event) => event.date)
        .filter((d): d is string => typeof d === 'string')
        .sort();

    return {
        from: dates[0] ?? '',
        to: new Date().toISOString().split('T')[0],
    };
};

export const applyDateRange = (incomeData: IncomeData, range: DateRange): IncomeData => {
    let events = incomeData.events.filter((event) => {
        if (range.from && event.date < range.from) return false;
        if (range.to && event.date > range.to) return false;
        return true;
    });
    return { events: events } as IncomeData;
};

export const getPresetRange = (preset: Preset, maxDate: string, _minDate: string): DateRange => {
    const d = new Date(maxDate);
    switch (preset) {
        case 'ytd': d.setFullYear(d.getFullYear(), 0, 1); break;
        case '1y':  d.setFullYear(d.getFullYear() - 1); break;
        case '5y':  d.setFullYear(d.getFullYear() - 5); break;
        case '10y': d.setFullYear(d.getFullYear() - 10); break;
    }
    return { from: d.toISOString().slice(0, 10), to: maxDate };
};

