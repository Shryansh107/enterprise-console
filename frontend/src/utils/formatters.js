/**
 * Format a number as currency ($XX.XX)
 */
export function formatCurrency(value) {
  const num = Number(value);
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
}

/**
 * Format a date string or timestamp into a local date-time string
 */
export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString();
}

/**
 * Format a date string or timestamp into a local date string
 */
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString();
}

/**
 * Pad a numerical order ID with leading zeros (e.g. 5 -> "0005")
 */
export function padOrderId(id) {
  return String(id).padStart(4, '0');
}
