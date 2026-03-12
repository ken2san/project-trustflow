// src/lib/utils.js
// Shared utility functions

/**
 * Format a number with comma separators
 * @param {number|string} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '';
  return Number(num).toLocaleString();
}

/**
 * Format a date as YYYY.MM.DD
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Truncate a string to maxLength characters
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(str, maxLength = 20) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}

/**
 * Returns a new array with duplicate values removed.
 * @param {Array} arr
 * @returns {Array}
 */
export function uniqueArray(arr) {
  return Array.from(new Set(arr));
}

/**
 * Parse a YYYY-MM-DD date string as end-of-day LOCAL time.
 * Avoids the UTC-midnight trap where new Date("2026-03-15") is UTC and
 * can read as "yesterday" in timezones ahead of UTC (e.g. JST).
 * @param {string} dateStr  - format: "YYYY-MM-DD"
 * @returns {Date|null}
 */
export function parseDeadlineLocal(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59);
}
