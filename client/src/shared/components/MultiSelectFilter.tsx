import { useEffect, useRef, useState } from 'react';

type MultiSelectFilterProps<T extends string> = {
  /** Column header label displayed next to the filter icon */
  label: string;
  /** All available options */
  options: readonly T[];
  /** Currently selected options */
  selected: T[];
  /** Called when selection changes */
  onChange: (selected: T[]) => void;
  /** Accessible label for the filter button */
  ariaLabel?: string;
};

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1.5 2h13l-5 6v5l-3-1.5V8L1.5 2z" />
    </svg>
  );
}

function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
  ariaLabel,
}: MultiSelectFilterProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFiltered = selected.length < options.length;

  function toggle(option: T) {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option],
    );
  }

  function toggleAll() {
    onChange(selected.length === options.length ? [] : [...options]);
  }

  return (
    <div className="th-filter-wrapper">
      <span>{label}</span>
      <div className="th-filter-control" ref={ref}>
        <button
          className={`th-filter-btn${isFiltered ? ' th-filter-btn--active' : ''}`}
          onClick={() => setIsOpen((open) => !open)}
          aria-label={ariaLabel ?? `Filtrer ${label.toLowerCase()}`}
          title={ariaLabel ?? `Filtrer ${label.toLowerCase()}`}
        >
          <FilterIcon />
          {isFiltered && <span className="th-filter-badge">{selected.length}</span>}
        </button>

        {isOpen && (
          <div className="th-filter-dropdown" role="listbox" aria-multiselectable="true">
            <button className="th-filter-clear-btn" onClick={toggleAll}>
              {selected.length === options.length ? 'Fjern alle' : 'Velg alle'}
            </button>
            <div className="th-filter-divider" />
            <div className="th-filter-options-scroll">
              {options.map((option) => (
                <label key={option} className="th-filter-option">
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => toggle(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MultiSelectFilter;
