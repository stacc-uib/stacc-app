import React from 'react';

export type HoldingFilter = 'sterk' | 'naer' | null;

type Props = {
  activeFilter: HoldingFilter;
  onFilterChange: (f: HoldingFilter) => void;
};

function CustomerChanges({ activeFilter, onFilterChange }: Props) {
  const toggle = (filter: 'sterk' | 'naer') => {
    onFilterChange(activeFilter === filter ? null : filter);
  };

  return (
    <div className="holding-filter-buttons">
      <button
        className={`holding-filter-btn holding-filter-btn--yellow${activeFilter === 'sterk' ? ' holding-filter-btn--active' : ''}`}
        onClick={() => toggle('sterk')}
        aria-pressed={activeFilter === 'sterk'}
      >
        Stor kunde i klasse C
      </button>
      <button
        className={`holding-filter-btn holding-filter-btn--orange${activeFilter === 'naer' ? ' holding-filter-btn--active' : ''}`}
        onClick={() => toggle('naer')}
        aria-pressed={activeFilter === 'naer'}
      >
        Potensielle Klasse B – Nær
      </button>
    </div>
  );
}

export default CustomerChanges;
