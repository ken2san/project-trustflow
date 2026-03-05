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
 * 配列のユニーク化
 * @param {Array} arr
 * @returns {Array}
 */
export function uniqueArray(arr) {
  return Array.from(new Set(arr));
}
