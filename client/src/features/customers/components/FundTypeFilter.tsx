import React, { useEffect, useRef, useState } from 'react';
import { FundType } from './CustomerData';

export const ALL_FUND_TYPES: FundType[] = ['Norden', 'Global', 'Kreditt'];

type Props = {
  selected: FundType[];
  onChange: (selected: FundType[]) => void;
};

function FundTypeFilter({ selected, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (fund: FundType) => {
    onChange(
      selected.includes(fund)
        ? selected.filter(f => f !== fund)
        : [...selected, fund]
    );
  };

  const isFiltered = selected.length < ALL_FUND_TYPES.length;

  return (
    <div className="th-filter-wrapper">
      <span>Fondsbeholdning</span>
      <div className="th-filter-control" ref={ref}>
        <button
          className={`th-filter-btn${isFiltered ? ' th-filter-btn--active' : ''}`}
          onClick={() => setIsOpen(o => !o)}
          aria-label="Filtrer fondstyper"
          title="Filtrer fondstyper"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M1.5 2h13l-5 6v5l-3-1.5V8L1.5 2z"/>
          </svg>
          {isFiltered && <span className="th-filter-badge">{selected.length}</span>}
        </button>
        {isOpen && (
          <div className="th-filter-dropdown" role="listbox" aria-multiselectable="true">
            <button
              className="th-filter-clear-btn"
              onClick={() => onChange(selected.length === ALL_FUND_TYPES.length ? [] : [...ALL_FUND_TYPES])}
            >
              {selected.length === ALL_FUND_TYPES.length ? 'Fjern alle' : 'Velg alle'}
            </button>
            <div className="th-filter-divider" />
            {ALL_FUND_TYPES.map(ft => (
              <label key={ft} className="th-filter-option">
                <input
                  type="checkbox"
                  checked={selected.includes(ft)}
                  onChange={() => toggle(ft)}
                />
                {ft}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FundTypeFilter;
