export type StatusBadgeTone = 'critical' | 'warning' | 'ok' | 'neutral';

export function statusBadgeClass(tone: StatusBadgeTone): string {
  return `status-badge status-badge--${tone}`;
}
