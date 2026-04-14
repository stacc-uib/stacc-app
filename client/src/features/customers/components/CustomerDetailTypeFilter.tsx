import React, { useEffect, useRef, useState } from 'react';

type Props = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

function CustomerDetailTypeFilter({ options, selected, onChange }: Props) {
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

  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter(o => o !== opt)
        : [...selected, opt]
    );
  };

  const isFiltered = selected.length < options.length;

  return (
    <div className="th-filter-wrapper">
      <span>Type</span>
      <div className="th-filter-control" ref={ref}>
        <button
          className={`th-filter-btn${isFiltered ? ' th-filter-btn--active' : ''}`}
          onClick={() => setIsOpen(o => !o)}
          aria-label="Filtrer type"
          title="Filtrer type"
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
              onClick={() => onChange(selected.length === options.length ? [] : [...options])}
            >
              {selected.length === options.length ? 'Fjern alle' : 'Velg alle'}
            </button>
            <div className="th-filter-divider" />
            {options.map(opt => (
              <label key={opt} className="th-filter-option">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDetailTypeFilter;
