import { useEffect, useMemo, useRef, useState } from 'react';

export type InvestorPickerItem = {
  id: string;
  label: string;
  secondaryLabel?: string;
};

type InvestorPickerProps = {
  /** Full list of items to search through */
  items: InvestorPickerItem[];
  /** Currently selected item id (empty string = none) */
  selectedId: string;
  /** Called when an item is selected */
  onSelect: (id: string) => void;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Accessible label for the input */
  ariaLabel?: string;
  /** Text shown when no results match the query */
  emptyText?: string;
  /**
   * Optional list of searchable fields per item.
   * By default searches label and secondaryLabel.
   */
  getSearchableValues?: (item: InvestorPickerItem) => string[];
};

function InvestorPicker({
  items,
  selectedId,
  onSelect,
  placeholder = 'Søk…',
  ariaLabel = 'Søk',
  emptyText = 'Ingen resultater.',
  getSearchableValues,
}: InvestorPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;

    return items.filter((item) => {
      const values = getSearchableValues
        ? getSearchableValues(item)
        : [item.label, item.secondaryLabel ?? ''];
      return values.some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, items, getSearchableValues]);

  // Close on outside click and restore display value
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedItem) {
          setQuery(selectedItem.label);
        }
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [selectedItem]);

  function handleSelect(id: string) {
    const item = items.find((i) => i.id === id);
    onSelect(id);
    setQuery(item?.label ?? '');
    setIsOpen(false);
  }

  return (
    <div className="trade-picker" ref={containerRef}>
      <input
        type="search"
        value={isOpen ? query : selectedItem?.label ?? query}
        onFocus={() => {
          setIsOpen(true);
          setQuery(selectedItem?.label ?? '');
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          onSelect('');
          setIsOpen(true);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      <span className="trade-picker__arrow" aria-hidden="true">
        ▾
      </span>

      {isOpen && (
        <div className="trade-picker__menu" role="listbox" aria-label={ariaLabel}>
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="trade-picker__option"
              onClick={() => handleSelect(item.id)}
            >
              <span>{item.label}</span>
              {item.secondaryLabel && <span>{item.secondaryLabel}</span>}
            </button>
          ))}

          {filteredItems.length === 0 && (
            <div className="trade-picker__empty">{emptyText}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default InvestorPicker;
