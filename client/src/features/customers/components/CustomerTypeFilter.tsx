import React, { useEffect, useRef, useState } from 'react';

export const ALL_CUSTOMER_TYPES = [
  'Aksjeselskap',
  'Ansatt',
  'Fond',
  'Fondsforvalter',
  'Forsikringsselskap',
  'Pensjonskasse',
  'Privatperson',
  'Stiftelse',
] as const;

export type CustomerType = typeof ALL_CUSTOMER_TYPES[number];

type Props = {
  selected: CustomerType[];
  onChange: (selected: CustomerType[]) => void;
};

function CustomerTypeFilter({ selected, onChange }: Props) {
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

  const toggle = (type: CustomerType) => {
    onChange(
      selected.includes(type)
        ? selected.filter(t => t !== type)
        : [...selected, type]
    );
  };

  const isFiltered = selected.length < ALL_CUSTOMER_TYPES.length;

  return (
    <div className="th-filter-wrapper">
      <span>Kundetype</span>
      <div className="th-filter-control" ref={ref}>
        <button
          className={`th-filter-btn${isFiltered ? ' th-filter-btn--active' : ''}`}
          onClick={() => setIsOpen(o => !o)}
          aria-label="Filtrer kundetype"
          title="Filtrer kundetype"
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
              onClick={() => onChange(selected.length === ALL_CUSTOMER_TYPES.length ? [] : [...ALL_CUSTOMER_TYPES])}
            >
              {selected.length === ALL_CUSTOMER_TYPES.length ? 'Fjern alle' : 'Velg alle'}
            </button>
            <div className="th-filter-divider" />
            {ALL_CUSTOMER_TYPES.map(t => (
              <label key={t} className="th-filter-option">
                <input
                  type="checkbox"
                  checked={selected.includes(t)}
                  onChange={() => toggle(t)}
                />
                {t}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerTypeFilter;
