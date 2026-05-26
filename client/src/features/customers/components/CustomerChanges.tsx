import React from 'react';

export type HoldingFilter = 'naer' | null;

type Props = {
  activeFilter: HoldingFilter;
  onFilterChange: (f: HoldingFilter) => void;
};

function CustomerChanges({ activeFilter, onFilterChange }: Props) {
  const toggle = () => {
    onFilterChange(activeFilter === 'naer' ? null : 'naer');
  };

  return (
    <div className="holding-filter-buttons">
      <button
        className={`holding-filter-btn holding-filter-btn--orange${activeFilter === 'naer' ? ' holding-filter-btn--active' : ''}`}
        onClick={toggle}
        aria-pressed={activeFilter === 'naer'}
      >
        Potensielle Klasse B – Nær
      </button>
    </div>
  );
}

export default CustomerChanges;
