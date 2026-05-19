import { useMemo, useState } from 'react';
import InvestorList from "../components/InvestorList";

import type { Investor } from '../types/investor';
import investors from "../../../mocks/investors.json";
import type { Trade } from '../types/trade';
import trades from "../../../mocks/trades.json";

function isValidNumber(input: string) {
  const regex = /^[+-]?\d+([.,]\d*)?$/;
  return regex.test(input);
}

type Holdings = Map<string, Map<string, Map<string, number>>>

function getFundHolders(trades: Trade[]): Holdings {
    let result = new Map<string, Map<string, Map<string, number>>>;

    for (const trade of trades) {
        const fundName = trade.fundName!.slice(0, -3);
        const className = trade.shareClass![trade.shareClass!.length - 1];

        if (!result.has(fundName)) {
            result.set(fundName, new Map<string, Map<string, number>>);
        }

        const currentFund = result.get(fundName)!;

        if (!currentFund.has(className)) {
            currentFund.set(className, new Map<string, number>);
        }

        const currentClass = currentFund.get(className)!;

        if (!currentClass.has(trade.customerId)) {
            currentClass.set(trade.customerId, 0);
        }

        const currentHolding = currentClass.get(trade.customerId)!;

        if (trade.transactionType === "Kjøp") {
            currentClass.set(trade.customerId, currentHolding + trade.units!);
        } else if (trade.transactionType === "Salg") {
            if (currentHolding < trade.units!) {
                throw new Error("holding went negative");
            }
            currentClass.set(trade.customerId, currentHolding - trade.units!);
        }
    }

    return result;
}

function filterInvestors(investors: Investor[], holdings: Holdings, selectedFund: string, selectedClass: string): Investor[] {
    if (selectedFund === "" || selectedClass === "") {
        return investors;
    }

    const relevantHoldings = holdings.get(selectedFund)!.get(selectedClass)!;

    let result = investors.filter((investor) => relevantHoldings.has(investor.customerId));
    result.filter((investor) => relevantHoldings.get(investor.customerId)! > 0);

    return result;
}

const DividendsPage = () => {
    const validTrades = useMemo(() => trades.filter((t) =>
        t.tradeDate !== null &&
        t.customerName !== null &&
        t.customerId !== "None" &&
        t.units !== null &&
        t.units > 0.0
    ), []);

    const today = new Date().toISOString().substring(0, 10);
    const funds = ['Escali Global', 'Escali Kreditt', 'Escali Norden'];
    const classes = ['A', 'B', 'C'];

    const [selectedFund, setSelectedFund] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [tradeDate, setTradeDate] = useState(today);
    const [priceInput, setPriceInput] = useState('');
    const [referenceText, setReferenceText] = useState('');

    const showInvestorList = funds.includes(selectedFund) && classes.includes(selectedClass);
    const canSubmit = showInvestorList && isValidNumber(priceInput);

    const holdings = useMemo(() => getFundHolders(validTrades), []);
    const filteredInvestors = filterInvestors(investors, holdings, selectedFund, selectedClass);

    function handleReset() {
        setSelectedFund('');
        setSelectedClass('');
        setTradeDate(today);
        setPriceInput('');
        setReferenceText('');
    }

    return (
        <div className="content-card">
            <p className="content-card__eyebrow">Utbytte</p>
            <h1>Registrer utbytte</h1>

            <section className="feature-section feature-section--trade-registration">
                <div className="">
                    <div className="trade-registration__main">
                        <section className="data-table-card trade-card">
                            <div className="trade-card__header">
                                <div>
                                    <p className="feature-section__eyebrow">Utbytteregistrering</p>
                                    <h2 className="data-table-card__title">Registrer utbytte</h2>
                                    <p className="data-table-card__description">
                                        Fyll inn utbyttedetaljene. Berørte kunder vises under.
                                    </p>
                                </div>
                            </div>
                            <div className="trade-form-grid">
                                <label className="trade-field">
                                    <span>Fond</span>
                                    <select
                                        value={selectedFund}
                                        onChange={(event) => setSelectedFund(event.target.value)}
                                    >
                                        <option value="">Velg fond</option>
                                        {funds.map((fund) => (
                                            <option key={fund} value={fund}>
                                                {fund}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="trade-field">
                                    <span>Klasse</span>
                                    <select
                                        value={selectedClass}
                                        onChange={(event) => setSelectedClass(event.target.value)}
                                    >
                                        <option value="">Velg klasse</option>
                                        {classes.map((shareClass) => (
                                            <option key={shareClass} value={shareClass}>
                                                {shareClass}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="trade-field">
                                    <span>Utbyttedato</span>
                                    <input
                                        type="date"
                                        value={tradeDate}
                                        onChange={(event) => setTradeDate(event.target.value)}
                                    />
                                </label>
                                <label className="trade-field">
                                    <span>Beløp per andel</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={priceInput}
                                        onChange={(event) => setPriceInput(event.target.value)}
                                        placeholder="0"
                                    />
                                </label>
                            </div>

                            <label className="trade-field trade-field--textarea">
                                <span>Referanse / kommentar</span>
                                <textarea
                                    value={referenceText}
                                    onChange={(event) => setReferenceText(event.target.value)}
                                    placeholder="Legg til oppgjørsreferanse eller kommentar"
                                    rows={4}
                                />
                            </label>
                            <div className="trade-actions">
                                <button
                                    type="button"
                                    className="queue-action queue-action--primary"
                                    onClick={handleReset}
                                    disabled={!canSubmit}
                                >
                                    Bekreft utbytte 
                                </button>
                                <button
                                    type="button"
                                    className="queue-action"
                                    onClick={handleReset}
                                >
                                    Lagre utkast
                                </button>
                                <button type="button" className="queue-action" onClick={handleReset}>
                                    Nullstill
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </section>
            {showInvestorList ? 
            <section className="data-table-card trade-card" style={{marginTop: "2em"}}>
                <InvestorList 
                    investors={filteredInvestors} 
                    holdings={holdings!.get(selectedFund)!.get(selectedClass)!} 
                />
            </section> : null}
        </div>
    )
};

export default DividendsPage;
