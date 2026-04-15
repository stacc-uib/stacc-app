import fundPrices from "../../../mocks/fundPrices.ts";
import investors from "../../../mocks/investors.ts";
import trades from "../../../mocks/trades.ts";

import type { FundPrice } from "../types/fundPrice";
import type { Investor } from "../types/investor";
import type { Trade } from "../types/trade";

const CLASS_B_MONTHLY_RATE = 0.0075 / 12;
const CLASS_C_MONTHLY_RATE = 0.01 / 12;

export interface IncomeEvent {
    date: string;
    customerId: string;
    shareClass: string;
    units: number;
    price: number;
    feeRate: number;
    amount: number;
    incomeType: "management fee" | "dividend";
}

export interface CumulativeIncomeData {
    events: IncomeEvent[];
}

// map from fund / share class to units owned
export type CustomerHolding = Map<string, number>;

export function getCumulativeIncomeData(
    trades: Trade[],
    investors: Investor[],
    fundPrices: FundPrice[]
): CumulativeIncomeData {
    const validTrades = trades.filter((t) =>
        t.tradeDate != null &&
        t.customerName != null &&
        t.customerId !== "None" &&
        t.units > 0.0
    );

    // map from customerId to holdings
    let customerHoldings = new Map<string, CustomerHolding>();

    let incomeEvents: IncomeEvent[] = [];

    let trade_idx = 0;
    const tradesLength = validTrades.length;

    for (const fp of fundPrices) {
        while (trade_idx < tradesLength && validTrades[trade_idx].tradeDate < fp.date) {
            let currTrade = validTrades[trade_idx];

            if (!customerHoldings.has(currTrade.customerId)) {
                customerHoldings.set(currTrade.customerId, new Map<string, number>());
            }
            let currCustomerHolding = customerHoldings.get(currTrade.customerId);

            if (!currCustomerHolding.has(currTrade.shareClass)) {
                currCustomerHolding.set(currTrade.shareClass, 0);
            }

            let currHolding = currCustomerHolding.get(currTrade.shareClass);

            if (currTrade.transactionType === "Kjøp") {
                currCustomerHolding.set(currTrade.shareClass, currHolding + currTrade.units);
            } else if (currTrade.transactionType === "Salg") {
                currCustomerHolding.set(currTrade.shareClass, currHolding - currTrade.units);
            } 

            if (currCustomerHolding.get(currTrade.shareClass) < 0) {
                throw new Error("Total holding went negative...");
            }

            trade_idx += 1;
        }

        // Calculate income events
        for (const [customerId, holdings] of customerHoldings) {
            for (const [shareClass, units] of holdings) {
                if (shareClass.at(-1) == 'B') {
                    incomeEvents.push({
                        date: fp.date,
                        customerId: customerId,
                        shareClass: shareClass,
                        units: units,
                        price: fp.classB,
                        feeRate: CLASS_B_MONTHLY_RATE,
                        amount: units * fp.classB * CLASS_B_MONTHLY_RATE,
                        incomeType: "management fee"
                    } as IncomeEvent);
                } else if (shareClass.at(-1) == 'C') {
                    incomeEvents.push({
                        date: fp.date,
                        customerId: customerId,
                        shareClass: shareClass,
                        units: units,
                        price: fp.classC,
                        feeRate: CLASS_C_MONTHLY_RATE,
                        amount: units * fp.classC * CLASS_C_MONTHLY_RATE,
                        incomeType: "management fee"
                    } as IncomeEvent);
                } else if (shareClass.at(-1) != 'A'){
                    throw new Error("unexpected share class name");
                }
            }
        }
    }
    return incomeEvents;
}
