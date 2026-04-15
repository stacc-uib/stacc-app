import { useCallback, useRef } from 'react';
import type { DateRange, Preset } from '../lib/getIncomeDateRange';

const presets: { id: Preset; label: string }[] = [
    { id: 'ytd', label: 'YTD' },
    { id: '1y',  label: '1 år' },
    { id: '5y',  label: '5 år' },
    { id: '10y', label: '10 år' },
];

type Props = {
  range: DateRange;
  minDate: string;
  maxDate: string;
  activePreset: Preset | null;
  onRangeChange: (range: DateRange) => void;
  onPresetSelect: (preset: Preset) => void;
  onReset: () => void;
};

function dateToMs(iso: string) { return new Date(iso).getTime(); }
function msToIso(ms: number) { return new Date(ms).toISOString().slice(0, 10); }
function formatLabel(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function IncomePeriodFilter({ range, minDate, maxDate, activePreset, onRangeChange, onPresetSelect, onReset }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'from' | 'to' | null>(null);

  const minMs = dateToMs(minDate);
  const maxMs = dateToMs(maxDate);
  const fromMs = dateToMs(range.from);
  const toMs = dateToMs(range.to);
  const span = maxMs - minMs || 1;

  const fromPct = ((fromMs - minMs) / span) * 100;
  const toPct = ((toMs - minMs) / span) * 100;
  const isFullRange = range.from === minDate && range.to === maxDate && activePreset === null;

  const pctToMs = useCallback((pct: number) => {
    return Math.round(minMs + (pct / 100) * span);
  }, [minMs, span]);

  const getPointerPct = useCallback((e: MouseEvent | React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pct = getPointerPct(e);
    const distFrom = Math.abs(pct - fromPct);
    const distTo = Math.abs(pct - toPct);
    dragging.current = distFrom <= distTo ? 'from' : 'to';

    const onMove = (ev: MouseEvent) => {
      const p = getPointerPct(ev);
      const ms = pctToMs(p);
      if (dragging.current === 'from') {
        onRangeChange({ from: msToIso(Math.min(ms, toMs - 86400000)), to: range.to });
      } else {
        onRangeChange({ from: range.from, to: msToIso(Math.max(ms, fromMs + 86400000)) });
      }
    };

    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [fromPct, toPct, fromMs, toMs, range, onRangeChange, getPointerPct, pctToMs]);

  return (
    <div className="feature-section__surface" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>

        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600 }}>{formatLabel(range.from)}</span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Periode</span>
            <span style={{ fontSize: '0.8rem', color: '#374151', fontWeight: 600 }}>{formatLabel(range.to)}</span>
          </div>

          <div
            ref={trackRef}
            onMouseDown={handleMouseDown}
            style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: 'rgba(17,24,39,0.1)', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', left: `${fromPct}%`, width: `${toPct - fromPct}%`, height: '4px', background: '#da1e24', borderRadius: '2px' }} />
            <div style={{ position: 'absolute', left: `${fromPct}%`, transform: 'translateX(-50%)', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', border: '2px solid #da1e24', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            <div style={{ position: 'absolute', left: `${toPct}%`, transform: 'translateX(-50%)', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', border: '2px solid #da1e24', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
          </div>
        </div>

        <div className="queue-filter-row" style={{ margin: 0 }}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`queue-filter${activePreset === preset.id ? ' queue-filter--active' : ''}`}
              onClick={() => onPresetSelect(preset.id)}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className="queue-filter"
            onClick={onReset}
            style={{ visibility: isFullRange ? 'hidden' : 'visible' }}
          >
            Nullstill
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomePeriodFilter;
