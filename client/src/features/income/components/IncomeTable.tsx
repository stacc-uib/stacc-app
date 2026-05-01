import type { IncomeData } from "../lib/getIncomeData";

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

const IncomeTableBodyRow = ({fundIncome, isPrimary} : {fundIncome: ShareClassIncome, isPrimary: boolean}) => {

    const unitsChange = 100 * (fundIncome.units - fundIncome.unitsInitial) / fundIncome.unitsInitial;
    const priceChange = 100 * (fundIncome.price - fundIncome.priceInitial) / fundIncome.priceInitial;

    return (
        <tr>
            <IncomeTableBodyRowCellText value={fundIncome.name} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellInteger value={fundIncome.units} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={unitsChange} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellMonetary value={fundIncome.price} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={priceChange} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellMonetary value={fundIncome.income} isPrimary={isPrimary} />
        </tr>
    )
}

type ShareClassIncome = {
    name: string;
    units: number;
    unitsInitial: number;
    price: number;
    priceInitial: number;
    income: number;
}

function getIncomeDataByShareClass(incomeData: IncomeData): Map<string, ShareClassIncome> {
    const result = new Map<string, ShareClassIncome>();

    if (incomeData.events.length == 0) {
        return result;
    }

    let firstDate = incomeData.events[0].date ?? "";
    let lastDate = incomeData.events[incomeData.events.length - 1].date ?? "";

    for (const event of incomeData.events) {
        if (!result.has(event.shareClass)) {
            result.set(event.shareClass, {
                name: event.shareClass,
                units: 0,
                unitsInitial: 0,
                price: 0,
                priceInitial: event.price,
                income: 0,
            });
        }

        let currShareClassIncome = result.get(event.shareClass)!;

        if (event.date == firstDate) {
            currShareClassIncome.unitsInitial += event.units;
        }

        if (event.date == lastDate) {
            currShareClassIncome.units += event.units;
        }

        currShareClassIncome.income += event.amount;
        currShareClassIncome.price = event.price;

        // Update the Map with the modified object
        result.set(event.shareClass, currShareClassIncome);
    }


    return result;
}

const IncomeTableBody = ({incomeData} : {incomeData: IncomeData}) => {
    let byShareClass: Map<string, ShareClassIncome> = getIncomeDataByShareClass(incomeData);

    return (
        <tbody>
            {Array.from(byShareClass).map(([shareClass, fundIncome]) => (
                <IncomeTableBodyRow fundIncome={fundIncome} isPrimary={true} key={shareClass} />
            ))}
        </tbody>
    );
}

const IncomeTable = ({incomeData} : {incomeData: IncomeData}) => {
    const incomeTableHeaders: string[] = [
        "Fond",
        "Volum",
        "Volumendring",
        "Kurs",
        "Kursendring",
        "Inntekt",
    ];

    return (
        <div className="data-table-card">
            <div className="table-scroll">
                <table className="data-table transactions-table">
                    <IncomeTableHeader incomeTableHeaders={incomeTableHeaders} /> 
                    <IncomeTableBody incomeData={incomeData} />
                </table>
            </div>
        </div>
    )
}

export default IncomeTable;

