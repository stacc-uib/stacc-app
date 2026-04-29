import getIncomeData from "./getIncomeData";

import type { DateRange } from "../types/dateRange";

function getIncomeDataByShareClass(incomeData: IncomeData, range: DateRange): Map<string, ShareClassIncome> {
    const result = new Map<string, ShareClassIncome>();

    for (const event of incomeData.events) {
        if (!result.has(event.shareClass)) {
            result.set(event.shareClass, {
                name: event.shareClass,
                units: 0,
                unitsInitial: 1,
                price: 0,
                priceInitial: event.price,
                income: 0,
            });
        }

        let currShareClassIncome = result.get(event.shareClass)!;

        currShareClassIncome.units += event.units;
        currShareClassIncome.income += event.amount;
        currShareClassIncome.price = event.price;

        // Update the Map with the modified object
        result.set(event.shareClass, currShareClassIncome);
    }


    return result;
}

