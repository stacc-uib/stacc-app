import { useMemo, useState } from 'react';
import type { Transaction } from '../types/transactions';

const PAGE_SIZE = 25;

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
}

function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

function getShareClassName(shareClass: string) {
  const match = shareClass.match(/Klasse\s+\w+/);
  return match ? match[0] : shareClass;
}

type Props = {
  transactions: Transaction[];
};

function TransactionsTable({ transactions }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [fundFilter, setFundFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const funds = useMemo(() =>
    Array.from(new Set(transactions.map((tx) => tx.fundName as string))).sort(),
    [transactions]
  );

  const types = useMemo(() =>
    Array.from(new Set(transactions.map((tx) => tx.transactionType as string))).sort(),
    [transactions]
  );

  const filtered = useMemo(() =>
    transactions.filter((tx) => {
      if (searchQuery && !tx.customerName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (fundFilter && tx.fundName !== fundFilter) return false;
      if (typeFilter && tx.transactionType !== typeFilter) return false;
      return true;
    }),
    [transactions, searchQuery, fundFilter, typeFilter]
  );

  function handleReset() {
    setSearchQuery('');
    setFundFilter('');
    setTypeFilter('');
  }

  const visible = filtered.slice(0, PAGE_SIZE);
  const isFiltered = searchQuery || fundFilter || typeFilter;

  return (
    <div className="data-table-card">
      <div className="data-table-card__header compliance-registry__header">
        <div>
          <h3 className="data-table-card__title">Transaksjoner</h3>
          <p className="data-table-card__description">
            {isFiltered
              ? `Viser ${visible.length} av ${filtered.length} filtrerte (${transactions.length} totalt)`
              : `Viser de ${visible.length} nyeste av ${transactions.length} transaksjoner`}
          </p>
        </div>

        <label className="compliance-registry__search">
          <span>Søk etter kunde</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Navn på kunde..."
          />
        </label>
      </div>

      <div className="compliance-registry__toolbar">
        <div className="queue-filter-row">
          <select
            value={fundFilter}
            onChange={(e) => setFundFilter(e.target.value)}
            className="transactions-toolbar__select"
          >
            <option value="">Alle fond</option>
            {funds.map((fund) => (
              <option key={fund} value={fund}>{fund}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="transactions-toolbar__select"
          >
            <option value="">Alle typer</option>
            {types.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {isFiltered && (
            <button type="button" className="queue-filter" onClick={handleReset}>
              Nullstill
            </button>
          )}
        </div>

        <p className="compliance-registry__results">
          {filtered.length} treff
        </p>
      </div>

      <div className="table-scroll">
        <table className="data-table transactions-table">
          <thead>
            <tr>
              <th>Kunde</th>
              <th>Dato</th>
              <th>Fond</th>
              <th>Klasse</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Antall</th>
              <th style={{ textAlign: 'right' }}>Kurs</th>
              <th style={{ textAlign: 'right' }}>Beløp</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((tx) => (
              <tr key={tx.id}>
                <td>
                  <div className="table-primary-cell">
                    <strong>{tx.customerName}</strong>
                  </div>
                </td>
                <td>{formatDate(tx.tradeDate ?? '')}</td>
                <td>{tx.fundName ?? ''}</td>
                <td>{getShareClassName(tx.shareClass ?? '')}</td>
                <td>{tx.transactionType ?? ''}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(tx.units ?? 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(tx.price ?? 0)}</td>
                <td style={{ textAlign: 'right' }}>{formatNumber(tx.amount ?? 0)}</td>
                <td>
                  <span className={`status-badge ${tx.settlementDate ? 'status-badge--ok' : 'status-badge--neutral'}`}>
                    {tx.settlementDate ? 'Oppgjort' : 'Ikke oppgjort'}
                  </span>
                </td>
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Ingen transaksjoner funnet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TransactionsTable;
