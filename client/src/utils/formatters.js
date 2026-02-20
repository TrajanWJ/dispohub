/* ============================================================
   FORMATTERS
   Pure utility functions for formatting values.
   ============================================================ */

/**
 * Format a number as US currency string.
 * @param {number} amount
 * @returns {string} e.g. "$123,456"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$0';
  const num = Number(amount);
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return num < 0 ? `-$${formatted}` : `$${formatted}`;
}

/**
 * Format an ISO date string into a readable date.
 * @param {string} dateString
 * @returns {string} e.g. "Jan 15, 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date string as a relative time-ago string.
 * @param {string} dateString
 * @returns {string} e.g. "2 hours ago", "3 days ago"
 */
export function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = Date.now();
  const diff = now - date.getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Format a decimal value as a percentage string.
 * @param {number} value - e.g. 12.5 or 0.125
 * @returns {string} e.g. "12.5%"
 */
export function formatPercentage(value) {
  if (value == null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(1)}%`;
}

/**
 * Format a number with comma separators.
 * @param {number} num
 * @returns {string} e.g. "1,234"
 */
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US');
}
