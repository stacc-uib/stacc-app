/**
 * Formats an ISO date string (YYYY-MM-DD) to Norwegian display format (DD.MM.YYYY).
 */
export function formatDateLabel(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
}
