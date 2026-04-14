import { getCumulativeInvestmentData } from "../lib/getCumulativeInvestmentData";

const IncomeTableHeaderCell = ({label}) => {
    return(
        <th style={{ textAlign: 'center' }}>{label}</th>
    )
}

const IncomeTableHeader = ({incomeTableHeaders}) => {
    return (
        <thead>
            <tr>
                {incomeTableHeaders.map((label) => (
                    <IncomeTableHeaderCell label={label} key={label} />
                ))}
            </tr>
        </thead>
    ) 
};
const IncomeTableBodyRowCellPrimary = ({value}) => {
    return (
        <td>
            <div className="table-primary-cell">
                <strong>{value}</strong>
            </div>
        </td>
    )
}
const IncomeTableBodyRowCellInteger = ({value}) => {
    const formatInteger = (value: number) => {
        return new Intl.NumberFormat('nb-NO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }

    return (
        <td style={{ textAlign: 'center' }}>
            {formatInteger(value)}
        </td>
    )
}

const IncomeTableBodyRowCellPercentage = ({value}) => {
    const formatPercentageChange = (value: number) =>  {
        const color = value >= 0 ? 'green' : 'red';
        return (
            <span style={{ color: color }}>{value}%</span>
        )
    }

    return (
        <td style={{ textAlign: 'center' }}>
            {formatPercentageChange(value)}
        </td>
    )
}

const IncomeTableBodyRowCellMonetary = ({value}) => {
    const formatMonetaryValue = (value: number) => {
        return new Intl.NumberFormat('nb-NO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    }
    
    return (
        <td style={{ textAlign: 'right' }}>
            {formatMonetaryValue(value)} kr
        </td>
    )

}

const IncomeTableBodyRow = ({fund}) => {
    return (
        <tr>
            <IncomeTableBodyRowCellPrimary value={fund.name} />
            <IncomeTableBodyRowCellInteger value={fund.volume} />
            <IncomeTableBodyRowCellPercentage value={fund.volumeChange} />
            <IncomeTableBodyRowCellMonetary value={fund.kurs} />
            <IncomeTableBodyRowCellPercentage value={fund.kursChange} />
            <IncomeTableBodyRowCellMonetary value={fund.kurs * fund.volume} />
            <IncomeTableBodyRowCellMonetary value={fund.income} />
            <IncomeTableBodyRowCellPercentage value={fund.incomeChange} />
        </tr>
    )
}

const IncomeTableBody = ({incomeTableData}) => {
    return (
        <tbody>
            {incomeTableData.map((fund) => (
                <IncomeTableBodyRow fund={fund} key={fund.name} />
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
        "Markedsverdi",
        "Inntekt",
        "Inntektsendring"
    ];

    const allInvestmentData = [
        getCumulativeInvestmentData("Escali Norden AS", "Escali Norden AS - Klasse A"),
        getCumulativeInvestmentData("Escali Norden AS", "Escali Norden AS - Klasse B"),
        getCumulativeInvestmentData("Escali Norden AS", "Escali Norden AS - Klasse C"),
        getCumulativeInvestmentData("Escali Global AS", "Escali Global AS - Klasse A"),
        getCumulativeInvestmentData("Escali Global AS", "Escali Global AS - Klasse B"),
        getCumulativeInvestmentData("Escali Global AS", "Escali Global AS - Klasse C"),
        getCumulativeInvestmentData("Escali Kreditt AS", "Escali Kreditt AS - Klasse A"),
        getCumulativeInvestmentData("Escali Kreditt AS", "Escali Kreditt AS - Klasse B"),
        getCumulativeInvestmentData("Escali Kreditt AS", "Escali Kreditt AS - Klasse C")
    ];


    return (
        <div className="data-table-card">
            <div className="data-table-card__header">
                <h3 className="data-table-card__title">Inntektstabell</h3>
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
