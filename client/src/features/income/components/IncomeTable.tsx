import fundPrices from "../../../mocks/fundPrices.json";
import investors from "../../../mocks/investors.json";
import trades from "../../../mocks/trades.json";

import { getIncomeData } from "../lib/getIncomeData";

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
            minimumFractionDigits: 0,
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

const IncomeTableBodyRow = ({fund, isPrimary}) => {
    return (
        <tr>
            <IncomeTableBodyRowCellText value={fund.name} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellInteger value={fund.volume} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={fund.volumeChange} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellMonetary value={fund.kurs} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={fund.kursChange} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellMonetary value={fund.income} isPrimary={isPrimary} />
            <IncomeTableBodyRowCellPercentage value={fund.incomeChange} isPrimary={isPrimary} />
        </tr>
    )
}

const IncomeTableBodySection = ({fund}) => {
    return (
        <>
            <IncomeTableBodyRow fund={fund} isPrimary="true" />
            <IncomeTableBodyRow fund={fund} isPrimary="false" />
        </>
    )
}

const IncomeTableBody = ({incomeTableData}) => {
    return (
        <tbody>
            {incomeTableData.map((fund) => (
                <IncomeTableBodySection fund={fund} key={fund.name} />
            ))}
        </tbody>
    );
}

const IncomeTable = ({incomeTableData}) => {
    const incomeTableHeaders = [
        "Fond",
        "Volum",
        "Volumendring",
        "Kurs",
        "Kursendring",
        "Inntekt",
        "Inntektsendring"
    ];

    const incomeData = getIncomeData(trades, investors, fundPrices);

    return (
        <div className="data-table-card">
            <div className="data-table-card__header">
                <h3 className="data-table-card__title">Inntesktstabell</h3>
            </div>
            <div className="table-scroll">
                <table className="data-table transactions-table">
                    <IncomeTableHeader incomeTableHeaders={incomeTableHeaders} /> 
                    <IncomeTableBody incomeTableData={incomeTableData} />
                </table>
            </div>
        </div>
    )
}

export default IncomeTable;
