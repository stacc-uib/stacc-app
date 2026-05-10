import { useState } from "react";
import type { IncomeData } from "../lib/getIncomeData";
import type { Investor } from "../types/investor";

const IncomeTableHeader = ({incomeTableHeaders} : {incomeTableHeaders: string[]}) => {
    return (
        <thead>
            <tr>
                {incomeTableHeaders.map((label: string) => (
                    <th key={label} style={{ textAlign: 'center' }}>
                        {label}
                    </th>
                ))}
            </tr>
        </thead>
    ) 
};

const IncomeTableBodyRowCellText = ({value, isPrimary} : {value: string, isPrimary: boolean}) => {
    if (isPrimary) {
        return (
            <td>
                <div className="table-primary-cell">
                    <strong>{value}</strong>
                </div>
            </td>
        )
    } else {
        return (
            <td>
                <div className="table-primary-cell">
                    {value}
                </div>
            </td>
        )
    }
}

const IncomeTableBodyRowCellInteger = ({value, isPrimary} : {value: number, isPrimary: boolean}) => {
    const formatInteger = (val: number) => {
        return new Intl.NumberFormat('nb-NO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    }

    if (isPrimary) {
        return (
            <td style={{ textAlign: 'center' }}>
                <strong>{formatInteger(value)}</strong>
            </td>
        )
    } else {
        return (
            <td style={{ textAlign: 'center' }}>
                {formatInteger(value)}
            </td>
        )
    }

}

const IncomeTableBodyRowCellPercentage = ({value, isPrimary} : {value: number, isPrimary: boolean}) => {
    const formatPercentageChange = (val: number) =>  {
        if (val.toFixed(2) === "0.00") {
            return <span>0,00%</span>;
        }

        const color: string = val >= 0 ? 'green' : 'red';
        const prefix: string = val >= 0 ? '+' : '';

        const formatted = new Intl.NumberFormat('nb-NO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);

        return (
            <span style={{ color: color }}>{prefix}{formatted}%</span>
        )
    }

    if (isPrimary) {
        return (
            <td style={{ textAlign: 'center' }}>
                <strong>{formatPercentageChange(value)}</strong>
            </td>
        )
    } else {
        return (
            <td style={{ textAlign: 'center' }}>
                {formatPercentageChange(value)}
            </td>
        )
    }
}

const IncomeTableBodyRowCellMonetary = ({value, isPrimary} : {value: number, isPrimary: boolean}) => {
    const formatMonetaryValue = (value: number) => {
        return new Intl.NumberFormat('nb-NO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    }

    if (isPrimary) {
        return (
            <td style={{ textAlign: 'right' }}>
                <strong>{formatMonetaryValue(value)} kr</strong>
            </td>
        )
    } else {
        return (
            <td style={{ textAlign: 'right' }}>
                {formatMonetaryValue(value)} kr
            </td>
        )
    }

}

const IncomeTableBodyRow = ({fundIncome, isPrimary} : {fundIncome: IncomePeriod, isPrimary: boolean}) => {

    const unitsChange = fundIncome.units !== fundIncome.unitsInitial ? 100 * (fundIncome.units - fundIncome.unitsInitial) / fundIncome.unitsInitial : 0;
    const aumChange = fundIncome.aum !== fundIncome.aumInitial ? 100 * (fundIncome.aum - fundIncome.aumInitial) / fundIncome.aumInitial : 0;

    const style = isPrimary ? {borderTop: "2px solid #d3d3d3", borderBottom: "3px double #d3d3d3"} : {};

    return (
        <tr style={style}>
            <IncomeTableBodyRowCellText value={fundIncome.name} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellInteger value={fundIncome.units} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={unitsChange} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellMonetary value={fundIncome.aum} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={aumChange} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellMonetary value={fundIncome.income} isPrimary={isPrimary} />
        </tr>
    )
}

type IncomePeriod = {
    name: string;
    units: number;
    unitsInitial: number;
    aum: number;
    aumInitial: number;
    income: number;
}

function splitIncomeData(incomeData: IncomeData, investors: Investor[], splitBy: string): Map<string, IncomePeriod> {
    const result = new Map<string, IncomePeriod>();

    if (incomeData.events.length == 0) {
        return result;
    }


    let firstDate = incomeData.events[0].date ?? "";
    let lastDate = incomeData.events[incomeData.events.length - 1].date ?? "";

    for (const event of incomeData.events) {
        let key: string;

        if (splitBy === "fund") {
            key = event.shareClass.slice(0, event.shareClass.indexOf('-') - 1);
        } else if (splitBy == "class") {
            key = event.shareClass.split(" - ")[1];
        } else if (splitBy == "fundandclass") {
            key = event.shareClass;
        } else if (splitBy == "segment") {
            const customer = investors.find(x => x.customerId === event.customerId)!;
            key = customer.customerType;
        } else if (splitBy == "category") {
            const customer = investors.find(x => x.customerId === event.customerId)!;
            key = customer.category;
        } else {
            throw new Error("unexpected splitBy");
        }

        if (!result.has(key)) {
            result.set(key, {
                name: key,
                units: 0,
                unitsInitial: 0,
                aum: 0,
                aumInitial: 0,
                income: 0,
            });
        }

        let currIncomePeriod = result.get(key)!;

        if (event.date == firstDate) {
            currIncomePeriod.unitsInitial += event.units;
            currIncomePeriod.aumInitial += event.units * event.price;
        }

        if (event.date == lastDate) {
            currIncomePeriod.units += event.units;
            currIncomePeriod.aum += event.units * event.price;
        }

        currIncomePeriod.income += event.amount;

        // Update the Map with the modified object
        result.set(key, currIncomePeriod);
    }


    return result;
}


function generateTotalIncomePeriod(incomePeriodMap: Map<string, IncomePeriod>): IncomePeriod {
    let result: IncomePeriod = {
        name: "Totalt",
        units: 0,
        unitsInitial: 0,
        aum: 0,
        aumInitial: 0,
        income: 0
    }

    for (const [name, incomePeriod] of incomePeriodMap) {
        result.units += incomePeriod.units;
        result.unitsInitial += incomePeriod.unitsInitial;
        result.aum += incomePeriod.aum;
        result.aumInitial += incomePeriod.aumInitial;
        result.income += incomePeriod.income;
    }
    return result;
}


const IncomeTableBody = ({incomeData, investors, splitBy} : {incomeData: IncomeData, investors: Investor[], splitBy: string}) => {
    const incomeDataSplit: Map<string, IncomePeriod> = splitIncomeData(incomeData, investors, splitBy);

    let totalIncomePeriod = generateTotalIncomePeriod(incomeDataSplit);
    return (
        <tbody>
            {Array.from(incomeDataSplit)
                .sort(([keyA, _], [keyB, __]) => keyA.localeCompare(keyB))
                .map(([key, income]) => (
                <IncomeTableBodyRow fundIncome={income} isPrimary={false} key={key} />
            ))}
            <IncomeTableBodyRow fundIncome={totalIncomePeriod} isPrimary={true} />
        </tbody>
    );
}


const SplitByButtons = ({splitBy, setSplitBy}: {splitBy: string, setSplitBy: any}) => {

  const buttons = [
    { label: "Fond", value: "fund" as const },
    { label: "Fondsklasse", value: "class" as const },
    { label: "Fond og klasse", value: "fundandclass" as const },
    { label: "Kundesegment", value: "segment" as const },
    { label: "Kundekategori", value: "category" as const },
  ];

  return (
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {buttons.map((button) => (
              <button
                  className={`btn btn-light ${splitBy === button.value ? " active" : ""}`}
                  key={button.value}
                  onClick={() => setSplitBy(button.value)}
              >
                {button.label}
              </button>
      ))}
      </div>
  );
};

const IncomeTable = ({incomeData, investors, splitBy, setSplitBy} : {incomeData: IncomeData, investors: Investor[], splitBy: string, setSplitBy: any}) => {
    const incomeTableHeaders: string[] = [
        "Fond",
        "Volum",
        "Volumendring",
        "AUM",
        "AUM-endring",
        "Inntekt",
    ];

    return (
        <div className="data-table-card feature-section__surface">
            <SplitByButtons splitBy={splitBy} setSplitBy={setSplitBy as any} />
            <div className="table-scroll">
                <table className="data-table transactions-table">
                    <IncomeTableHeader incomeTableHeaders={incomeTableHeaders} /> 
                    <IncomeTableBody incomeData={incomeData} investors={investors} splitBy={splitBy} />
                </table>
            </div>
        </div>
    )
}

export default IncomeTable;

