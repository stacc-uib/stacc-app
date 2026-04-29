const currencyFormatter = new Intl.NumberFormat('nb-NO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerCurrencyFormatter = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  maximumFractionDigits: 0,
});

/**
 * Formats a number as Norwegian currency with 2 decimal places.
 * Example: 1234567.89 → "1 234 567,89"
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/**
 * Formats a number as NOK currency with no decimals.
 * Example: 1234567 → "1 234 567 kr"
 */
export function formatCurrencyInteger(value: number): string {
  return integerCurrencyFormatter.format(value);
}

/**
 * Formats a number with Norwegian locale.
 */
export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('nb-NO', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) to Norwegian display format (DD.MM.YYYY).
 */
export function formatDateLabel(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
}

/**
 * Formats a Date object to Norwegian short date (DD.MM.YYYY).
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nb-NO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
