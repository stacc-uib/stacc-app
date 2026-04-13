import { useMemo, useState } from 'react';
import { exportTransactionsCsv } from '../lib/exportTransactionsCsv';
import type { Transaction } from '../types/transactions';

const PAGE_SIZE = 25;

const selectStyle = {
  minHeight: '38px',
  padding: '0.5rem 0.75rem',
  border: '1px solid rgba(17, 24, 39, 0.12)',
  borderRadius: '0.3rem',
  background: '#fff',
  color: '#374151',
  fontSize: '0.9rem',
};

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
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);

  const funds = useMemo(() =>
    Array.from(new Set(transactions.map((tx) => tx.fundName as string))).sort(),
    [transactions]
  );

  const types = useMemo(() =>
    Array.from(new Set(transactions.map((tx) => tx.transactionType as string))).sort(),
    [transactions]
  );

  const classes = useMemo(() =>
    Array.from(new Set(
      transactions.map((tx) => getShareClassName(tx.shareClass as string)).filter(Boolean)
    )).sort(),
    [transactions]
  );

  const filtered = useMemo(() => {
    setPage(0);
    return transactions.filter((tx) => {
      if (searchQuery && !tx.customerName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (fundFilter && tx.fundName !== fundFilter) return false;
      if (typeFilter && tx.transactionType !== typeFilter) return false;
      if (classFilter && getShareClassName(tx.shareClass ?? '') !== classFilter) return false;
      if (statusFilter === 'oppgjort' && !tx.settlementDate) return false;
      if (statusFilter === 'ikke-oppgjort' && tx.settlementDate) return false;
      return true;
    });
  }, [transactions, searchQuery, fundFilter, typeFilter, classFilter, statusFilter]);

  function handleReset() {
    setSearchQuery('');
    setFundFilter('');
    setTypeFilter('');
    setClassFilter('');
    setStatusFilter('');
    setPage(0);
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const isFiltered = searchQuery || fundFilter || typeFilter || classFilter || statusFilter;
  const start = page * PAGE_SIZE + 1;
  const end = Math.min((page + 1) * PAGE_SIZE, filtered.length);

  return (
    <div className="data-table-card">
      <div className="data-table-card__header compliance-registry__header">
        <div>
          <h3 className="data-table-card__title">Transaksjoner</h3>
          <p className="data-table-card__description">
            {isFiltered
              ? `Viser ${start}-${end} av ${filtered.length} filtrerte (${transactions.length} totalt)`
              : `Viser ${start}-${end} av ${transactions.length} transaksjoner`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexShrink: 0, maxWidth: '420px' }}>
          <label className="compliance-registry__search" style={{ minWidth: 'unset', flex: 1 }}>
            <span>Søk etter kunde</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Navn på kunde..."
            />
          </label>
          <button
            type="button"
            className="queue-filter"
            onClick={() => exportTransactionsCsv(filtered)}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Last ned CSV
          </button>
        </div>
      </div>

      <div className="compliance-registry__toolbar">
        <div className="queue-filter-row">
          <select value={fundFilter} onChange={(e) => setFundFilter(e.target.value)} style={{ ...selectStyle, minWidth: '140px' }}>
            <option value="">Alle fond</option>
            {funds.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...selectStyle, minWidth: '160px' }}>
            <option value="">Alle typer</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ ...selectStyle, minWidth: '120px' }}>
            <option value="">Alle klasser</option>
            {classes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...selectStyle, minWidth: '150px' }}>
            <option value="">Alle statuser</option>
            <option value="oppgjort">Oppgjort</option>
            <option value="ikke-oppgjort">Ikke oppgjort</option>
          </select>

          {isFiltered && (
            <button type="button" className="queue-filter" onClick={handleReset}>
              Nullstill
            </button>
          )}
        </div>

        <p className="compliance-registry__results">{filtered.length} treff</p>
      </div>

      <div className="table-scroll">
        <table className="data-table compliance-registry__table" style={{ fontSize: '0.82rem', minWidth: 'unset' }}>
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

      {totalPages > 1 && (
        <div className="queue-filter-row" style={{ padding: '1rem 0 0', justifyContent: 'center' }}>
          <button type="button" className="queue-filter" onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            Forrige
          </button>
          <span style={{ padding: '0 0.5rem', color: '#6b7280', fontSize: '0.9rem', alignSelf: 'center' }}>
            Side {page + 1} av {totalPages}
          </span>
          <button type="button" className="queue-filter" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
            Neste
          </button>
        </div>
      )}
    </div>
  );
}

export default TransactionsTable;
