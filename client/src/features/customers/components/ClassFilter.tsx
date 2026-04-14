import React, { useEffect, useRef, useState } from 'react';

export const ALL_CLASSES = ['Klasse A', 'Klasse B', 'Klasse C'] as const;
export type KlasseType = typeof ALL_CLASSES[number];

type Props = {
  selected: KlasseType[];
  onChange: (selected: KlasseType[]) => void;
};

function ClassFilter({ selected, onChange }: Props) {
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

  const toggle = (klasse: KlasseType) => {
    onChange(
      selected.includes(klasse)
        ? selected.filter(k => k !== klasse)
        : [...selected, klasse]
    );
  };

  const isFiltered = selected.length < ALL_CLASSES.length;

  return (
    <div className="th-filter-wrapper">
      <span>Klasse</span>
      <div className="th-filter-control" ref={ref}>
        <button
          className={`th-filter-btn${isFiltered ? ' th-filter-btn--active' : ''}`}
          onClick={() => setIsOpen(o => !o)}
          aria-label="Filtrer klasse"
          title="Filtrer klasse"
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
              onClick={() => onChange(selected.length === ALL_CLASSES.length ? [] : [...ALL_CLASSES])}
            >
              {selected.length === ALL_CLASSES.length ? 'Fjern alle' : 'Velg alle'}
            </button>
            <div className="th-filter-divider" />
            {ALL_CLASSES.map(k => (
              <label key={k} className="th-filter-option">
                <input
                  type="checkbox"
                  checked={selected.includes(k)}
                  onChange={() => toggle(k)}
                />
                {k}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassFilter;