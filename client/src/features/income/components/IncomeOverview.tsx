import type { IncomeData } from "../lib/getIncomeData";
import type { FundPrice } from "../types/fundPrice";
import type { Trade } from "../types/trade";

const MetricDelta = ({initialValue, currentValue, label}: {initialValue: number, currentValue: number, label: string }) => {
    const percentageChange = 100 * (currentValue - initialValue) / initialValue;
    const percentageChangeFormatted = formatPercentageChange(percentageChange);

    const arrow = percentageChange > 0 ? '\u2191' : '\u2193';
    const direction = percentageChange > 0 ? "up" : "down"; 

    return (
        <div className={`fund-overview__delta fund-overview__delta--${direction}`}>
            <span className="fund-overview__delta-arrow" aria-hidden="true">
                {arrow}
            </span>
            <span>{percentageChangeFormatted}</span>
            <span className="fund-overview__delta-label">{label}</span>
        </div>
    )
}

const MetricDeltaPP = ({initialValue, currentValue, label}: {initialValue: number, currentValue: number, label: string }) => {
    const percentageChange = currentValue - initialValue;
    const percentageChangeFormatted = formatPercentageChangePoints(percentageChange);

    const arrow = percentageChange > 0 ? '\u2191' : '\u2193';
    const direction = percentageChange > 0 ? "up" : "down"; 

    return (
        <div className={`fund-overview__delta fund-overview__delta--${direction}`}>
            <span className="fund-overview__delta-arrow" aria-hidden="true">
                {arrow}
            </span>
            <span>{percentageChangeFormatted}</span>
            <span className="fund-overview__delta-label">{label}</span>
        </div>
    )
}

function formatMonetaryValue(value: number): string {
    return new Intl.NumberFormat('nb-NO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatMonetaryValue2(value: number): string {
    return new Intl.NumberFormat('nb-NO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

const formatPercentageChange = (val: number) =>  {
    const prefix: string = val >= 0 ? '+' : '';

    const formatted = new Intl.NumberFormat('nb-NO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);

    return prefix + " " + formatted + "%";
}

const formatPercentageChangePoints = (val: number) =>  {
    const prefix: string = val >= 0 ? '+' : '';

    const formatted = new Intl.NumberFormat('nb-NO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val);

    return prefix + " " + formatted + "pp.";
}

const KpiBox = ({initialValue, currentValue, label, deltaLabel}: {initialValue: number, currentValue: number, label: string, deltaLabel: string}) => {
    return (
        <div className="col">
          <article className="summary-card">
            <p className="summary-card__label" style={{ fontSize: '0.8rem' }}>{label}</p>
            <p className="summary-card__value" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)' }}>{formatMonetaryValue(currentValue) + " kr"}</p>
            <MetricDelta currentValue={currentValue} initialValue={initialValue} label={deltaLabel} />
          </article>
        </div>
    )
};

const KpiBoxPercentage = ({initialValue, currentValue, label, deltaLabel}: {initialValue: number, currentValue: number, label: string, deltaLabel: string}) => {
    return (
        <div className="col">
          <article className="summary-card">
            <p className="summary-card__label" style={{ fontSize: '0.8rem' }}>{label}</p>
            <p className="summary-card__value" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)' }}>{formatMonetaryValue2(currentValue) + " %"}</p>
            <MetricDeltaPP currentValue={currentValue} initialValue={initialValue} label={deltaLabel} />
          </article>
        </div>
    )
};

function ytdIncome(incomeData: IncomeData): number {
    const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
    const today = new Date(incomeData.events[incomeData.events.length - 1].date!)

    let income: number = 0;

    for (const event of incomeData.events) {
        let eventDate = new Date(event.date!);
        if (eventDate >= firstDayOfYear) {
            income += event.amount;
        }
    }
    return income;
}

function ytdIncomeLastPeriod(incomeData: IncomeData): number {
    const firstDayOfLastYear = new Date(new Date().getFullYear() - 1, 0, 1);
    let thisDayLastYear = new Date(incomeData.events[incomeData.events.length - 1].date!)
    thisDayLastYear.setFullYear(thisDayLastYear.getFullYear() - 1);

    let income: number = 0;

    for (const event of incomeData.events) {
        let eventDate = new Date(event.date!);
        if (eventDate >= firstDayOfLastYear && eventDate <= thisDayLastYear) {
            income += event.amount;
        }
    }
    return income;
}

function annualIncomeLastYear(incomeData: IncomeData): number {
    const firstDayOfLastYear = new Date(new Date().getFullYear() - 1, 0, 1);
    const lastDayOfLastYear = new Date(new Date().getFullYear() - 1, 11, 31);

    let income: number = 0;

    for (const event of incomeData.events) {
        let eventDate = new Date(event.date!);
        if (eventDate >= firstDayOfLastYear && eventDate <= lastDayOfLastYear) {
            income += event.amount;
        }
    }
    return income;
}

interface MonthlyIncome {
    month: string; // Format: "YYYY-MM"
    total: number;
}

function projectedAnnualIncome(incomeData: IncomeData, alpha: number): number {
    const now = new Date();
    const thisMonth = now.toISOString().substring(0, 7);

    const monthlyTotals: Record<string, number> = {};
    for (const event of incomeData.events) {
        const month = event.date.substring(0, 7);
        if (month == thisMonth) {
            break;
        }
        monthlyTotals[month] = (monthlyTotals[month] || 0) + event.amount;
    }

    const monthlyIncome: MonthlyIncome[] = Object.entries(monthlyTotals)
        .map(([month, total]) => ({ month, total }))
        .sort((a, b) => a.month.localeCompare(b.month));

    if (monthlyIncome.length < 2) {
        throw new Error("At least 2 months of data are required to calculate growth.");
    }

    let smoothedGrowthRate = 0;
    for (let i = 1; i < monthlyIncome.length; i++) {
        const prevTotal = monthlyIncome[i - 1].total;
        const currTotal = monthlyIncome[i].total;
        const growthRate = (currTotal - prevTotal) / prevTotal;
        smoothedGrowthRate = alpha * growthRate + (1 - alpha) * smoothedGrowthRate;
    }

    const lastMonthEntry = monthlyIncome[monthlyIncome.length - 1];
    const [lastYearStr, lastMonthStr] = lastMonthEntry.month.split('-');
    const lastYear = parseInt(lastYearStr);
    const lastMonth = parseInt(lastMonthStr);
    const thisYear = now.getFullYear();

    const monthsLeft = thisYear === lastYear ? 12 - lastMonth : 12;

    let restOfYearIncome = 0;
    let previousMonthIncome = lastMonthEntry.total;
    const ytd = ytdIncome(incomeData);

    for (let i = 0; i < monthsLeft; i++) {
        previousMonthIncome *= (1 + smoothedGrowthRate);
        restOfYearIncome += previousMonthIncome;
    }

    return restOfYearIncome + ytd;
}


const YTDIncomeBox = ({incomeData} : {incomeData: IncomeData}) => {
    return (
        <KpiBox 
            currentValue={ytdIncome(incomeData)} 
            initialValue={ytdIncomeLastPeriod(incomeData)} 
            label={"YTD inntekter"} 
            deltaLabel={"Samme dato forrige år"} 
        />
    )
}

const ProjectedIncomeBox = ({incomeData} : {incomeData: IncomeData}) => {
    return (
        <KpiBox
            currentValue={projectedAnnualIncome(incomeData, 0.3)} 
            initialValue={annualIncomeLastYear(incomeData)} 
            label={"Projisert årsinntekt"} 
            deltaLabel={"Endring fra forrige år"} 
        />
    )
}

function aumAtDate(trades: Trade[], fundPrices: FundPrice[], maxDate: Date): number {
    let validTrades = trades.filter((t) => 
        t.tradeDate !== null &&
        t.customerName !== null &&
        t.customerId !== "None" &&
        t.units !== null &&
        t.units > 0.0 && 
        new Date(t.tradeDate) <= maxDate 
    );

    // map from customerId to holdings
    let customerHoldings = new Map<string, Map<string, number>>();

    const validFundPrices = fundPrices.filter((fp) => new Date(fp.date!) <= maxDate)
    validFundPrices.sort((a,b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    const funds = ["Escali Global AS", "Escali Norden AS", "Escali Kreditt AS"];
    const latestPrices = funds.map(f => validFundPrices.find(p => p.fundName === f));

    for (const trade of validTrades) {
        if (!customerHoldings.has(trade.customerId)) {
            customerHoldings.set(trade.customerId, new Map<string, number>());
        }

        let currCustomerHolding = customerHoldings.get(trade.customerId)!;

        if (!currCustomerHolding.has(trade.shareClass!)) {
            currCustomerHolding.set(trade.shareClass!, 0);
        }

        let currHolding = currCustomerHolding.get(trade.shareClass!)!;

        if (trade.transactionType === "Kjøp") {
            currCustomerHolding.set(trade.shareClass!, currHolding + trade.units!);
        } else if (trade.transactionType === "Salg") {
            currCustomerHolding.set(trade.shareClass!, currHolding - trade.units!);
        } 


        if (currCustomerHolding.get(trade.shareClass!)! < 0) {
            throw new Error("Total holding went negative...");
        }
    }

    let aum = 0;

    for (const [customerId, holdings] of customerHoldings) {
        for (const [shareClass, units] of holdings) {
            const fp = (() => {
                for (const price of latestPrices) {
                    if (shareClass.includes(price!.fundName!)) {
                        return price;
                    }
                }
                throw new Error("something wrong");
            })()!;


            if (shareClass[shareClass.length - 1] == 'B') {
                aum += fp.classB! * units;
            } else if (shareClass[shareClass.length - 1] == 'C') {
                aum += fp.classC! * units;
            } else if (shareClass[shareClass.length - 1] != 'A'){
                throw new Error("unexpected share class name");
            }
        }
    }
    return aum;
}



const AumBox = ({trades, fundPrices} : {trades: Trade[], fundPrices: FundPrice[]}) => {
    const aum = aumAtDate(trades, fundPrices, new Date("2026-01-31"));
    const aumLastYear = aumAtDate(trades, fundPrices, new Date("2025-01-31"));

    return (
        <KpiBox
            currentValue={aum} 
            initialValue={aumLastYear} 
            label={"AUM"} 
            deltaLabel={"Endring fra forrige år"} 
        />
    )
}

const EffectiveRateBox = ({incomeData, trades, fundPrices} : {incomeData: IncomeData, trades: Trade[], fundPrices: FundPrice[]}) => {
    const aum = aumAtDate(trades, fundPrices, new Date("2026-01-31"));
    const ytd = ytdIncome(incomeData);
    const rate = 12 * 100 * ytd / aum;

    const aumLastYear = aumAtDate(trades, fundPrices, new Date("2025-01-31"));
    const ytdLastYear = ytdIncomeLastPeriod(incomeData)
    const rateLastYear  = 12 * 100 * ytdLastYear / aumLastYear;

    return (
        <KpiBoxPercentage
            currentValue={rate} 
            initialValue={rateLastYear} 
            label={"Eff. forvaltningshonorar"} 
            deltaLabel={"Endring fra forrige år"} 
        />
    )
}

const IncomeOverview = ({incomeData, trades, fundPrices} : {incomeData: IncomeData, trades: Trade[], fundPrices: FundPrice[]}) => {

    return (
        <div className="feature-section__surface row g-3" style={{ marginBottom: '1.5rem' }}>
            <YTDIncomeBox incomeData={incomeData} />
            <ProjectedIncomeBox incomeData={incomeData} />
            <AumBox trades={trades} fundPrices={fundPrices} />
            <EffectiveRateBox incomeData={incomeData} trades={trades} fundPrices={fundPrices} />
        </div>
    )
};

export default IncomeOverview;

