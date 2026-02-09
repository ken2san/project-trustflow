// src/lib/utils.js
// 共通ユーティリティ関数集

/**
 * 数値をカンマ区切りでフォーマット
 * @param {number|string} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '';
  return Number(num).toLocaleString();
}

/**
 * 日付をYYYY.MM.DD形式でフォーマット
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 文字列を省略（maxLength超過時）
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
