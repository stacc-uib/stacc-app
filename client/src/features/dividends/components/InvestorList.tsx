import type { Investor } from "../types/investor"

function formatNumber(val: number) {
    return new Intl.NumberFormat('nb-NO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);
}

const InvestorListHeader = ({investorListHeaders}: {investorListHeaders: string[]}) => {
    return (
        <thead>
            <tr>
                {investorListHeaders.map((label: string) => (
                    <th key={label}>
                        {label}
                    </th>
                ))}
            </tr>
        </thead>
    ) 
};

const InvestorListBody = ({investors, holdings, dividend}: {investors: Investor[], holdings: Map<string, number>, dividend: number}) => {
    return (
        <tbody>
            {investors.map((investor) => 
                <tr key={investor.customerId}>
                    <td style={{ color: '#9ca3af', fontSize: '0.75rem', paddingLeft: "1rem"}}>{investor.customerId}</td>
                    <td><strong>{investor.name}</strong></td>
                    <td>{investor.customerType}</td>
                    <td style={{textAlign: "right"}}>{formatNumber(holdings.get(investor.customerId)!)}</td> 
                    <td style={{textAlign: "right"}}>kr {formatNumber(holdings.get(investor.customerId)! * dividend)}</td>
                </tr> 
            )}
        </tbody>
    )
}

const InvestorList = ({investors, holdings, dividend} : {investors: Investor[], holdings: Map<string, number>, dividend: number}) => {
    const investorListHeaders: string[] = [
        "Kundeid",
        "Kundenavn",
        "Kundetype",
        "Andeler",
        "Totalt utbytte",
    ];


    return (
        <>
            <h4 style={{paddingLeft: "0.5rem"}}>Berørte kunder</h4>
                <table className="data-table customer-table">
                    <InvestorListHeader investorListHeaders={investorListHeaders} /> 
                    <InvestorListBody investors={investors} holdings={holdings} dividend={dividend} />
                </table>
        </>
    );
};

export default InvestorList;
