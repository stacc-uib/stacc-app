import IncomeData from "../lib/getIncomeData";

const IncomeTableHeader = ({incomeTableHeaders}) => {
    return (
        <thead>
            <tr>
                {incomeTableHeaders.map((label) => (
                    <th key={label} style={{ textAlign: 'center' }}>
                        {label}
                    </th>
                ))}
            </tr>
        </thead>
    ) 
};

const IncomeTableBodyRowCellText = ({value, isPrimary}) => {
    if (isPrimary == "true") {
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

const IncomeTableBodyRowCellInteger = ({value, isPrimary}) => {
    const formatInteger = (value: number) => {
        return new Intl.NumberFormat('nb-NO', {
            minimumFractionDigsits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    if (isPrimary == "true") {
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

const IncomeTableBodyRowCellPercentage = ({value, isPrimary}) => {
    const formatPercentageChange = (value: number) =>  {
        const color = value >= 0 ? 'green' : 'red';
        const prefix = value >= 0 ? '+' : '';

        return (
            <span style={{ color: color }}>{prefix}{value}%</span>
        )
    }

    if (isPrimary == "true") {
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

const IncomeTableBodyRowCellMonetary = ({value, isPrimary}) => {
    const formatMonetaryValue = (value: number) => {
        return new Intl.NumberFormat('nb-NO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    }

    if (isPrimary == "true") {
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

const IncomeTableBodyRow = ({fundIncome, isPrimary}) => {
    const unitsChange = 100 * (fundIncome.units - fundIncome.unitsInitial) / fundIncome.unitsInitial;
    const priceChange = 100 * (fundIncome.price - fundIncome.priceInitial) / fundIncome.priceInitial;
    const incomeChange = 100 * (fundIncome.income - fundIncome.incomeInitial) / fundIncome.incomeInitial;

    return (
        <tr>
            <IncomeTableBodyRowCellText value={fundIncome.name} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellInteger value={fundIncome.units} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={unitsChange} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellMonetary value={fundIncome.price} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={priceChange} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellMonetary value={fundIncome.income} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={incomeChange} isPrimary={isPrimary} />
        </tr>
    )
}

const IncomeTableBodySection = ({fundIncome}) => {
    return (
        <>
            <IncomeTableBodyRow fundIncome={fundIncome} isPrimary="true" />
        </>
    )
}

interface ShareClassIncome {
    name: string;
    units: number;
    unitsInitial: number;
    price: number;
    priceInitial: number;
    income: number;
    incomeInitial: number;
}

function getIncomeDataByShareClass(incomeData: IncomeData): Map<string, ShareClassIncome> {
    const result = new Map<string, ShareClassIncome>();
    console.log(incomeData);

    for (const event of incomeData.events) {
        if (!result.has(event.shareClass)) {
            result.set(event.shareClass, {
                name: event.shareClass,
                units: 0,
                unitsInitial: 0,
                price: 0,
                priceInitial: event.price,
                income: 0,
                incomeInitial: 0
            });
        }

        const currShareClassIncome = result.get(event.shareClass)!;
        currShareClassIncome.units += event.units;
        currShareClassIncome.price = event.price;
        currShareClassIncome.income += event.income;

        // Update the Map with the modified object
        result.set(event.shareClass, currShareClassIncome);
    }
    return result;
}

const IncomeTableBody = ({incomeData}) => {
    const byShareClass = getIncomeDataByShareClass(incomeData);
    console.log(byShareClass);

    return (
        <tbody>
            {Array.from(byShareClass).map(([shareClass, fundIncome]) => (
                <IncomeTableBodySection fundIncome={fundIncome} key={shareClass} />
            ))}
        </tbody>
    );
}

const IncomeTable = ({incomeData}) => {
    const incomeTableHeaders = [
        "Fond",
        "Volum",
        "Volumendring",
        "Kurs",
        "Kursendring",
        "Inntekt",
        "Inntektsendring"
    ];

    return (
        <div className="data-table-card">
            <div className="data-table-card__header">
                <h3 className="data-table-card__title">Funker ikke enda! :)</h3>
            </div>
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
