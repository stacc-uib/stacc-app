import type { FundPrice, Trade } from '../types/income';

const CLASS_B_MONTHLY_RATE = (1 + 0.0075) ** (1 / 12) - 1;
const CLASS_C_MONTHLY_RATE = (1 + 0.01) ** (1 / 12) - 1;

export interface IncomeEvent {
    date: string;
    customerId: string;
    shareClass: string;
    units: number;
    price: number;
    feeRate: number;
    amount: number;
    incomeType: 'management fee' | 'dividend';
}

export interface IncomeData {
    events: IncomeEvent[];
}

type CustomerHolding = Map<string, number>;

export default function getIncomeData(
    trades: Trade[],
    fundPrices: FundPrice[],
): IncomeData {
    const validTrades = trades.filter(
        (t) =>
            t.tradeDate != null &&
            t.customerName != null &&
            t.customerId !== 'None' &&
            t.units != null &&
            t.units > 0.0,
    );

    const customerHoldings = new Map<string, CustomerHolding>();
    const incomeEvents: IncomeEvent[] = [];
    let tradeIdx = 0;
    const tradesLength = validTrades.length;

    for (const fp of fundPrices) {
        while (tradeIdx < tradesLength && validTrades[tradeIdx].tradeDate! < fp.date) {
            const currTrade = validTrades[tradeIdx];
            if (!customerHoldings.has(currTrade.customerId)) {
                customerHoldings.set(currTrade.customerId, new Map<string, number>());
            }
            const currCustomerHolding = customerHoldings.get(currTrade.customerId)!;
            if (!currCustomerHolding.has(currTrade.shareClass!)) {
                currCustomerHolding.set(currTrade.shareClass!, 0);
            }
            const currHolding = currCustomerHolding.get(currTrade.shareClass!)!;
            if (currTrade.transactionType === 'Kjøp') {
                currCustomerHolding.set(currTrade.shareClass!, currHolding + currTrade.units!);
            } else if (currTrade.transactionType === 'Salg') {
                currCustomerHolding.set(currTrade.shareClass!, currHolding - currTrade.units!);
            }
            tradeIdx += 1;
        }

        for (const [customerId, holdings] of customerHoldings) {
            for (const [shareClass, units] of holdings) {
                if (shareClass.at(-1) === 'B') {
                    incomeEvents.push({
                        date: fp.date,
                        customerId,
                        shareClass,
                        units,
                        price: fp.classB,
                        feeRate: CLASS_B_MONTHLY_RATE,
                        amount: units * fp.classB * CLASS_B_MONTHLY_RATE,
                        incomeType: 'management fee',
                    });
                } else if (shareClass.at(-1) === 'C') {
                    incomeEvents.push({
                        date: fp.date,
                        customerId,
                        shareClass,
                        units,
                        price: fp.classC,
                        feeRate: CLASS_C_MONTHLY_RATE,
                        amount: units * fp.classC * CLASS_C_MONTHLY_RATE,
                        incomeType: 'management fee',
                    });
                }
            }
        }
    }
    return { events: incomeEvents };
}

export type DateRange = { from: string; to: string };
export type Preset = '1y' | '5y' | '10y' | 'ytd';

export function getIncomeDateRange(incomeData: IncomeData): DateRange {
    const dates = incomeData.events
        .map((e) => e.date)
        .filter((d): d is string => typeof d === 'string')
        .sort();
    return { from: dates[0] ?? '', to: dates[dates.length - 1] ?? '' };
}

export function getPresetRange(preset: Preset, maxDate: string, _minDate: string): DateRange {
    const d = new Date(maxDate);
    switch (preset) {
        case 'ytd': d.setFullYear(d.getFullYear(), 0, 1); break;
        case '1y':  d.setFullYear(d.getFullYear() - 1); break;
        case '5y':  d.setFullYear(d.getFullYear() - 5); break;
        case '10y': d.setFullYear(d.getFullYear() - 10); break;
    }
    return { from: d.toISOString().slice(0, 10), to: maxDate };
}
