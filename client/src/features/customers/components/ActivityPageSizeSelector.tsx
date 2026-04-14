import React from 'react';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export type PageSize = typeof PAGE_SIZE_OPTIONS[number] | 'all';

type Props = {
  value: PageSize;
  onChange: (value: PageSize) => void;
  totalCount: number;
};

function ActivityPageSizeSelector({ value, onChange, totalCount }: Props) {
  return (
    <div className="cd-page-size-selector">
      <span className="cd-page-size-label">Vis</span>
      {PAGE_SIZE_OPTIONS.map(size => (
        <button
          key={size}
          className={`cd-page-size-btn${value === size ? ' cd-page-size-btn--active' : ''}`}
          onClick={() => onChange(size)}
        >
          {size}
        </button>
      ))}
      <button
        className={`cd-page-size-btn${value === 'all' ? ' cd-page-size-btn--active' : ''}`}
        onClick={() => onChange('all')}
      >
        Alle ({totalCount})
      </button>
    </div>
  );
}

export default ActivityPageSizeSelector;
