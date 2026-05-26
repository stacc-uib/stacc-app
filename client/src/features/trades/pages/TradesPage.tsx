import { useEffect, useMemo, useRef, useState } from 'react';
import { getTradeRegistrationData } from '../lib/getTradeRegistrationData';
import { useTradesContext } from '../TradesContext';
import type { TradeDirection, TradeSettlementStatus } from '../types/trades';

const FUND_ID_TO_FULL_NAME: Record<string, string> = {
  'escali-global': 'Escali Global AS',
  'escali-norden': 'Escali Norden AS',
  'escali-kreditt': 'Escali Kreditt AS',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(value === 0 ? 0 : value === 1 ? 1 : 2).replace('.', ',')} %`;
}

function formatDateLabel(dateString: string | null) {
  if (!dateString) return 'Ikke registrert';
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
}

function parseLocalizedNumber(value: string) {
  if (!value.trim()) return 0;
  const normalizedValue = value.replace(/\s/g, '').replace(',', '.');
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatEditableNumber(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(maximumFractionDigits).replace(/\.?0+$/, '').replace('.', ',');
}

function isQuarterStart(dateString: string) {
  const [, month, day] = dateString.split('-').map(Number);
  return day === 1 && [1, 4, 7, 10].includes(month);
}

function TradesPage() {
  const tradeData = useMemo(() => getTradeRegistrationData(), []);
  const { addTrade, registeredTrades } = useTradesContext();

  const investorPickerRef = useRef<HTMLDivElement | null>(null);
  const [investorQuery, setInvestorQuery] = useState('');
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [isInvestorPickerOpen, setIsInvestorPickerOpen] = useState(false);

  const [direction, setDirection] = useState<TradeDirection>('kjop');
  const [selectedFundId, setSelectedFundId] = useState('escali-global');
  const [selectedClassId, setSelectedClassId] = useState<'A' | 'B' | 'C'>('C');
  const [tradeDate, setTradeDate] = useState('2026-04-01');
  const [priceInput, setPriceInput] = useState('');
  const [unitsInput, setUnitsInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [settlementStatus, setSettlementStatus] = useState<TradeSettlementStatus>('ikke-oppgjort');
  const [referenceText, setReferenceText] = useState('');
  const [tradeDone, setTradeDone] = useState<{ summary: string; direction: TradeDirection } | null>(null);

  const filteredInvestors = useMemo(() => {
    const normalizedQuery = investorQuery.trim().toLowerCase();
    return tradeData.investors.filter((investor) => {
      if (!normalizedQuery) return true;
      return [investor.investorName, investor.customerId, investor.investorType, investor.investorCategory]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [investorQuery, tradeData.investors]);

  const selectedInvestor = useMemo(
    () => tradeData.investors.find((i) => i.customerId === selectedInvestorId) ?? null,
    [selectedInvestorId, tradeData.investors],
  );

  const selectedFund = useMemo(
    () => tradeData.funds.find((f) => f.id === selectedFundId) ?? tradeData.funds[0],
    [selectedFundId, tradeData.funds],
  );

  const selectedClass = useMemo(
    () => selectedFund.classes.find((c) => c.id === selectedClassId) ?? selectedFund.classes[0],
    [selectedClassId, selectedFund],
  );

  const selectedHolding = useMemo(() => {
    if (!selectedInvestor) return null;
    return selectedInvestor.holdings.find(
      (h) => h.fundId === selectedFund.id && h.classId === selectedClass.id,
    ) ?? null;
  }, [selectedClass.id, selectedFund.id, selectedInvestor]);

  const unitsValue = parseLocalizedNumber(unitsInput);
  const priceValue = parseLocalizedNumber(priceInput);
  const amountValue = parseLocalizedNumber(amountInput);
  const holdingsValue = selectedInvestor
    ? selectedInvestor.holdings.reduce((total, h) => total + h.estimatedValue, 0)
    : 0;

  const projectedValue = amountValue > 0
    ? direction === 'kjop'
      ? holdingsValue + amountValue
      : holdingsValue - amountValue
    : null;

  const validationMessages = useMemo(() => {
    const messages: string[] = [];

    if (!selectedInvestor) {
      messages.push('Velg investor for å registrere handel.');
      return messages;
    }

    if (selectedInvestor.investorCategory === 'Ikke-profesjonell') {
      messages.push('Kun profesjonelle investorer kan registreres for ny handel i denne arbeidsflaten.');
    }

    if (
      direction === 'kjop' &&
      selectedClass.minimumSubscriptionAmount > 0 &&
      amountValue > 0 &&
      amountValue < selectedClass.minimumSubscriptionAmount
    ) {
      messages.push(
        `Beløpet er under minstetegning på ${formatCurrency(selectedClass.minimumSubscriptionAmount)} for valgt andelsklasse.`,
      );
    }

    if (direction === 'kjop' && tradeDate && !isQuarterStart(tradeDate)) {
      messages.push('Nytegning skal normalt registreres på første dag i kvartalet.');
    }

    if (direction === 'salg' && unitsValue > (selectedHolding?.units ?? 0)) {
      messages.push('Antall andeler overstiger investorens registrerte beholdning i valgt klasse.');
    }

    return messages;
  }, [amountValue, direction, selectedClass.minimumSubscriptionAmount, selectedHolding?.units, selectedInvestor, tradeDate, unitsValue]);

  const canSubmit =
    Boolean(selectedInvestor) &&
    unitsValue > 0 &&
    amountValue > 0 &&
    priceValue > 0 &&
    validationMessages.length === 0;

  useEffect(() => {
    setPriceInput(formatEditableNumber(selectedClass.latestPrice, 2));

    if (!selectedInvestor) {
      setUnitsInput('');
      setAmountInput('');
      return;
    }

    if (direction === 'kjop') {
      const minimumAmount =
        selectedClass.minimumSubscriptionAmount > 0
          ? selectedClass.minimumSubscriptionAmount
          : selectedClass.latestPrice;
      const nextUnits = selectedClass.latestPrice > 0 ? minimumAmount / selectedClass.latestPrice : 0;
      setAmountInput(formatEditableNumber(minimumAmount, 0));
      setUnitsInput(formatEditableNumber(nextUnits, 2));
      return;
    }

    if (!selectedHolding) {
      setUnitsInput('');
      setAmountInput('');
      return;
    }

    const suggestedUnits = Math.min(selectedHolding.units, 50);
    setUnitsInput(formatEditableNumber(suggestedUnits, 2));
    setAmountInput(formatEditableNumber(suggestedUnits * selectedClass.latestPrice, 0));
  }, [direction, selectedClass, selectedHolding, selectedInvestor]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!investorPickerRef.current?.contains(event.target as Node)) {
        setIsInvestorPickerOpen(false);
        if (selectedInvestor) setInvestorQuery(selectedInvestor.investorName);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [selectedInvestor]);

  function handleUnitsChange(nextValue: string) {
    setUnitsInput(nextValue);
    const nextUnits = parseLocalizedNumber(nextValue);
    if (priceValue > 0) setAmountInput(formatEditableNumber(nextUnits * priceValue, 0));
  }

  function handleAmountChange(nextValue: string) {
    setAmountInput(nextValue);
    const nextAmount = parseLocalizedNumber(nextValue);
    if (priceValue > 0) setUnitsInput(formatEditableNumber(nextAmount / priceValue, 2));
  }

  function handlePriceChange(nextValue: string) {
    setPriceInput(nextValue);
    const nextPrice = parseLocalizedNumber(nextValue);
    if (unitsValue > 0 && nextPrice > 0) {
      setAmountInput(formatEditableNumber(unitsValue * nextPrice, 0));
      return;
    }
    if (amountValue > 0 && nextPrice > 0) {
      setUnitsInput(formatEditableNumber(amountValue / nextPrice, 2));
    }
  }

  function handleConfirm() {
    if (!selectedInvestor) return;

    const fullFundName = FUND_ID_TO_FULL_NAME[selectedFund.id] ?? selectedFund.shortName;
    const shareClassLabel = `${fullFundName} - ${selectedClass.label}`;

    setTradeDone({
      summary: `${selectedInvestor.investorName} — ${direction === 'kjop' ? 'Kjøp' : 'Salg'} ${formatNumber(unitsValue)} andeler i ${selectedFund.shortName} ${selectedClass.label.toLowerCase()} til ${formatCurrency(amountValue)}`,
      direction,
    });

    addTrade({
      id: `trade-${1502 + registeredTrades.length}`,
      customerId: selectedInvestor.customerId,
      customerName: selectedInvestor.investorName,
      fundName: fullFundName,
      shareClass: shareClassLabel,
      tradeDate,
      settlementDate: tradeDate,
      transactionType: direction === 'kjop' ? 'Kjøp' : 'Salg',
      units: unitsValue,
      price: priceValue,
      amount: amountValue,
      unitEffect: direction === 'kjop' ? unitsValue : -unitsValue,
      settlementStatus,
    });
  }

  function handleReset() {
    setDirection('kjop');
    setSelectedFundId('escali-global');
    setSelectedClassId('C');
    setTradeDate('2026-04-01');
    setPriceInput('');
    setUnitsInput('');
    setAmountInput('');
    setSettlementStatus('ikke-oppgjort');
    setReferenceText('');
    setSelectedInvestorId('');
    setInvestorQuery('');
    setTradeDone(null);
  }

  function handleInvestorSelect(customerId: string) {
    const investor = tradeData.investors.find((item) => item.customerId === customerId);
    setSelectedInvestorId(customerId);
    setInvestorQuery(investor?.investorName ?? '');
    setIsInvestorPickerOpen(false);
  }

  // ─── Bekreftelse-skjerm ───────────────────────────────────────────────────
  if (tradeDone) {
    return (
      <div className="content-card">
        <p className="content-card__eyebrow">Handler og andelseierregister</p>
        <h1>Registrer ny handel</h1>
        <section className="feature-section feature-section--trade-registration">
          <div className="feature-section__surface trade-registration">
            <div className="trade-done-screen">
              <div className="trade-done-screen__icon" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="56" height="56">
                  <circle cx="24" cy="24" r="24" fill="#dcfce7" />
                  <path d="M14 25l7 7 13-14" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="trade-done-screen__title">Handel registrert</h2>
              <p className="trade-done-screen__summary">{tradeDone.summary}</p>
              <div className="trade-done-screen__actions">
                <button type="button" className="queue-action queue-action--primary" onClick={handleReset}>
                  Registrer ny handel
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ─── Registreringsskjema ──────────────────────────────────────────────────
  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Handler og andelseierregister</p>
      <h1>Registrer ny handel</h1>

      <section className="feature-section feature-section--trade-registration">
        <div className="feature-section__surface trade-registration">
          <div className="trade-registration__layout">

            {/* ── Skjema (venstre) ─────────────────────────────────────── */}
            <div className="trade-registration__main">
              <section className="data-table-card trade-card">
                <div className="trade-card__header">
                  <div>
                    <p className="feature-section__eyebrow">Handelsregistrering</p>
                    <h2 className="data-table-card__title">Registrer handel</h2>
                  </div>
                </div>

                {/* Investor — første felt, full bredde */}
                <div className="trade-field" style={{ marginBottom: '0.65rem' }}>
                  <span>Investor</span>
                  <div className="trade-picker" ref={investorPickerRef}>
                    <input
                      type="search"
                      value={
                        isInvestorPickerOpen
                          ? investorQuery
                          : selectedInvestor?.investorName ?? investorQuery
                      }
                      onFocus={() => {
                        setIsInvestorPickerOpen(true);
                        setInvestorQuery(selectedInvestor?.investorName ?? '');
                      }}
                      onChange={(event) => {
                        setInvestorQuery(event.target.value);
                        setSelectedInvestorId('');
                        setIsInvestorPickerOpen(true);
                      }}
                      placeholder="Søk etter investor"
                    />
                    <span className="trade-picker__arrow" aria-hidden="true">▾</span>

                    {isInvestorPickerOpen && (
                      <div className="trade-picker__menu" role="listbox" aria-label="Investorliste">
                        {filteredInvestors.map((investor) => (
                          <button
                            key={investor.customerId}
                            type="button"
                            className="trade-picker__option"
                            onClick={() => handleInvestorSelect(investor.customerId)}
                          >
                            <span>{investor.investorName}</span>
                            <span>{investor.customerId}</span>
                          </button>
                        ))}
                        {filteredInvestors.length === 0 && (
                          <div className="trade-picker__empty">Ingen investorer matcher søket.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Kjøp / Salg */}
                <div className="trade-toggle-group" role="radiogroup" aria-label="Velg handelstype">
                  <button
                    type="button"
                    className={`trade-toggle${direction === 'kjop' ? ' trade-toggle--active' : ''}`}
                    onClick={() => setDirection('kjop')}
                    aria-pressed={direction === 'kjop'}
                  >
                    Kjøp
                  </button>
                  <button
                    type="button"
                    className={`trade-toggle${direction === 'salg' ? ' trade-toggle--active' : ''}`}
                    onClick={() => setDirection('salg')}
                    aria-pressed={direction === 'salg'}
                  >
                    Salg
                  </button>
                </div>

                {/* Handelsfelter */}
                <div className="trade-form-grid">
                  <label className="trade-field">
                    <span>Fond</span>
                    <select
                      value={selectedFund.id}
                      onChange={(e) => setSelectedFundId(e.target.value)}
                    >
                      {tradeData.funds.map((fund) => (
                        <option key={fund.id} value={fund.id}>{fund.shortName}</option>
                      ))}
                    </select>
                  </label>

                  <label className="trade-field">
                    <span>Klasse</span>
                    <select
                      value={selectedClass.id}
                      onChange={(e) => setSelectedClassId(e.target.value as 'A' | 'B' | 'C')}
                    >
                      {selectedFund.classes.map((shareClass) => (
                        <option key={shareClass.id} value={shareClass.id}>{shareClass.label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="trade-field">
                    <span>Handelsdato</span>
                    <input
                      type="date"
                      value={tradeDate}
                      onChange={(e) => setTradeDate(e.target.value)}
                    />
                  </label>

                  <label className="trade-field">
                    <span>Kurs</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={priceInput}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="0"
                    />
                  </label>

                  <label className="trade-field">
                    <span>Antall andeler</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={unitsInput}
                      onChange={(e) => handleUnitsChange(e.target.value)}
                      placeholder="0"
                    />
                  </label>

                  <label className="trade-field">
                    <span>Beløp (NOK)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountInput}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0"
                    />
                  </label>
                </div>

                {/* Fondsinformasjon */}
                <div className="trade-metric-row">
                  <article className="trade-metric">
                    <span className="trade-metric__label">Minstetegning</span>
                    <strong>{formatCurrency(selectedClass.minimumSubscriptionAmount)}</strong>
                  </article>
                  <article className="trade-metric">
                    <span className="trade-metric__label">Årlig honorar</span>
                    <strong>{formatPercent(selectedClass.annualManagementFee)}</strong>
                  </article>
                  <article className="trade-metric">
                    <span className="trade-metric__label">Siste kursdato</span>
                    <strong>{formatDateLabel(selectedClass.latestPriceDate)}</strong>
                  </article>
                  <article className="trade-metric">
                    <span className="trade-metric__label">Tilgjengelige andeler</span>
                    <strong>{formatNumber(selectedHolding?.units ?? 0)}</strong>
                  </article>
                </div>

                {/* Validering */}
                {validationMessages.length > 0 ? (
                  <div className="trade-callout trade-callout--warning">
                    <h3 className="trade-callout__title">Avklar før bekreftelse</h3>
                    <div className="stack-list">
                      {validationMessages.map((message) => (
                        <p key={message} className="trade-callout__body">{message}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="trade-callout">
                    <h3 className="trade-callout__title">Klar til registrering</h3>
                    <p className="trade-callout__body">
                      Handelen er klar til neste steg med estimert verdi {formatCurrency(amountValue)}.
                    </p>
                  </div>
                )}

                {/* Oppgjør */}
                <div className="trade-settlement">
                  <p className="trade-settlement__label">Oppgjørsstatus</p>
                  <div className="trade-settlement__options">
                    {([
                      { id: 'ikke-oppgjort', label: 'Ikke oppgjort' },
                      { id: 'delvis-oppgjort', label: 'Delvis oppgjort' },
                      { id: 'oppgjort', label: 'Oppgjort' },
                    ] as const).map((option) => (
                      <label key={option.id} className="trade-radio">
                        <input
                          type="radio"
                          name="settlementStatus"
                          value={option.id}
                          checked={settlementStatus === option.id}
                          onChange={() => setSettlementStatus(option.id)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Referanse */}
                <label className="trade-field trade-field--textarea">
                  <span>Referanse / kommentar</span>
                  <textarea
                    value={referenceText}
                    onChange={(e) => setReferenceText(e.target.value)}
                    placeholder="Legg til oppgjørsreferanse eller kommentar"
                    rows={3}
                  />
                </label>

                {/* Handlinger */}
                <div className="trade-actions">
                  <button
                    type="button"
                    className="queue-action queue-action--primary"
                    onClick={handleConfirm}
                    disabled={!canSubmit}
                  >
                    Bekreft handel
                  </button>
                  <button type="button" className="queue-action" onClick={handleReset}>
                    Nullstill
                  </button>
                </div>
              </section>
            </div>

            {/* ── Investorinformasjon (høyre) ───────────────────────────── */}
            <aside className="trade-registration__aside">
              {selectedInvestor ? (
                <>
                  <section className="data-table-card trade-card trade-sidebar-card trade-sidebar-card--separated">
                    <div className="trade-card__header">
                      <div>
                        <p className="feature-section__eyebrow">Investor</p>
                        <h2 className="data-table-card__title">{selectedInvestor.investorName}</h2>
                      </div>
                    </div>

                    <div className="trade-sidebar-card__content">
                      <dl className="trade-definition-list">
                        <div>
                          <dt>Kunde-ID</dt>
                          <dd>{selectedInvestor.customerId}</dd>
                        </div>
                        <div>
                          <dt>Kundetype</dt>
                          <dd>{selectedInvestor.investorType}</dd>
                        </div>
                        <div>
                          <dt>Kategori</dt>
                          <dd>{selectedInvestor.investorCategory}</dd>
                        </div>
                        <div>
                          <dt>Total verdi</dt>
                          <dd>{formatCurrency(holdingsValue)}</dd>
                        </div>
                        {projectedValue !== null && (
                          <div>
                            <dt>Etter handel</dt>
                            <dd style={{ color: projectedValue >= holdingsValue ? '#15803d' : '#b91c1c' }}>
                              {formatCurrency(projectedValue)}
                              <span style={{ fontSize: '0.82rem', fontWeight: 400, marginLeft: '0.4rem', color: 'inherit' }}>
                                ({direction === 'kjop' ? '+' : '-'}{formatCurrency(amountValue)})
                              </span>
                            </dd>
                          </div>
                        )}
                      </dl>

                      {/* Vis kun badge for avvikende/kritiske tilstander */}
                      <div className="trade-sidebar-card__status-row">
                        {selectedInvestor.pepStatus === 'Ja' && (
                          <span className="status-badge status-badge--critical" title="Politisk eksponert person">
                            PEP
                          </span>
                        )}
                        {selectedInvestor.amlRiskLevel === 'Høy' && (
                          <span className="status-badge status-badge--critical">AML Høy</span>
                        )}
                        {selectedInvestor.amlRiskLevel === 'Medium' && (
                          <span className="status-badge status-badge--warning">AML Medium</span>
                        )}
                        {selectedInvestor.pepStatus === 'Nei' && selectedInvestor.amlRiskLevel === 'Lav' && (
                          <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>Ingen risikoavvik</span>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="data-table-card trade-card trade-sidebar-card trade-sidebar-card--separated">
                    <div className="trade-card__header">
                      <div>
                        <p className="feature-section__eyebrow">Beholdning</p>
                        <h2 className="data-table-card__title">Eksisterende plasseringer</h2>
                      </div>
                    </div>

                    <div className="stack-list">
                      {selectedInvestor.holdings.length > 0 ? (
                        selectedInvestor.holdings.slice(0, 4).map((holding) => (
                          <article key={holding.holdingId} className="trade-mini-card">
                            <div className="stack-card__row stack-card__row--dense">
                              <h3 className="stack-card__title">{holding.fundName}</h3>
                              <span className="status-badge status-badge--neutral">
                                {holding.shareClassLabel}
                              </span>
                            </div>
                            <p className="stack-card__body">{formatNumber(holding.units)} andeler</p>
                            <p className="stack-card__meta stack-card__meta--strong">
                              {formatCurrency(holding.estimatedValue)}
                            </p>
                          </article>
                        ))
                      ) : (
                        <p className="trade-sidebar-card__empty">
                          Ingen aktiv beholdning registrert for valgt investor.
                        </p>
                      )}
                    </div>
                  </section>
                </>
              ) : (
                <section className="data-table-card trade-card trade-sidebar-card trade-sidebar-card--empty-state">
                  <div className="trade-card__header">
                    <div>
                      <p className="feature-section__eyebrow">Investor</p>
                      <h2 className="data-table-card__title">Ingen investor valgt</h2>
                    </div>
                  </div>
                  <p className="trade-sidebar-card__empty">
                    Investorinformasjon og beholdning vises her når du har valgt en investor.
                  </p>
                </section>
              )}
            </aside>

          </div>
        </div>
      </section>
    </div>
  );
}

export default TradesPage;
