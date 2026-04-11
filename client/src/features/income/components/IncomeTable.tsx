
function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatPercentageChange(value: number) {
  const color = value >= 0 ? 'green' : 'red';
  return <strong><span style={{ color: color }}>{value}%</span></strong>;
}

function getShareClassName(shareClass: string) {
  const match = shareClass.match(/Klasse\s+\w+/);
  return match ? match[0] : shareClass;
}


function IncomeTable({ incomeInfo }: Props) {
  return (
    <div className="data-table-card">
      <div className="data-table-card__header">
        <h3 className="data-table-card__title">Inntektstabell</h3>
      </div>

      <div className="table-scroll">
        <table className="data-table transactions-table">
          <thead>
            <tr>
              <th>Fond</th>
              <th style={{ textAlign: 'right' }}>Volum</th>
              <th>Volumendring</th>
              <th>Kurs</th>
              <th>Kursendring</th>
              <th>Markedsverdi</th>
              <th>Inntekt</th>
              <th>Inntektsendring</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {incomeInfo.map((fund) => (
              <tr key={fund.name}>
                <td>
                  <div className="table-primary-cell">
                    <strong>{fund.name}</strong>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>NOK {formatNumber(fund.volume?? 0)}</td>
                <td style={{ textAlign: 'center' }}>{formatPercentageChange(fund.volume_change)}</td>
                <td style={{ textAlign: 'right' }}>NOK {formatNumber(fund.kurs?? 0)}</td>
                <td style={{ textAlign: 'center' }}>{formatPercentageChange(fund.kurs_change)}</td>
                <td style={{ textAlign: 'right' }}>NOK {formatNumber(fund.kurs * fund.volume ?? 0)}</td>
                <td style={{ textAlign: 'right' }}>NOK {formatNumber(fund.income ?? 0)}</td>
                <td style={{ textAlign: 'center' }}>{formatPercentageChange(fund.income_change)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default IncomeTable;
