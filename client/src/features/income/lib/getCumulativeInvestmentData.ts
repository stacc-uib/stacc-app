import trades from "../../../mocks/trades.json";
import type { Trade } from "../types/trade";

export type CumulativeInvestmentSnapshot = {
    date: string | null;
    units: number | null;
    price: number | null;
}

export type CumulativeInvestmentData = {
    fundName: string | null;
    shareClass: string | null;
    snapshots: CumulativeInvestmentSnapshot[];
}

export function getCumulativeInvestmentData(fundName: string, shareClass: string): CumulativeInvestmentData {
    const valid_transactions = (trades as unknown as Transaction[]).filter((t) =>
        t.tradeDate !== null && t.tradeDate !== undefined &&
        t.customerName !== null && t.customerName !== undefined &&
        t.customerId !== "None" &&
        t.fundName == fundName &&
        t.shareClass == shareClass
    );

    let investmentData: CumulativeInvestmentData = {
        fundName: fundName,
        shareClass: shareClass,
        snapshots: []
    }

    let prev_snapshot: CumulativeInvestmentSnapshot = {
        date: null,
        units: 0,
        price: 0
    };

    for (const transaction of valid_transactions) {
        let new_snapshot = { ...prev_snapshot };
        new_snapshot.date = transaction.tradeDate;
        new_snapshot.price = transaction.price;
        if (transaction.transactionType == "Kjøp") {
            new_snapshot.units += transaction.units;
        } else if (transaction.transactionType == "Salg") {
            new_snapshot.units -= transaction.units;
        }

        if (new_snapshot.units < 0) {
            throw new Error("total units was negative...");
        }
        investmentData.snapshots.push(new_snapshot);
        prev_snapshot = new_snapshot;
    }

    return investmentData;
    
}
