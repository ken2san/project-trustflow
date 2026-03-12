// src/lib/crypto.js
// Cryptographic utilities using the browser's native Web Crypto API.
// No external dependencies — runs in any modern browser and in Node 18+.

/**
 * Compute a SHA-256 hex digest of an arbitrary string.
 * Used to create an immutable fingerprint of contract DoD text at initiation.
 *
 * @param {string} text
 * @returns {Promise<string>} lowercase hex string, e.g. "a3f2..."
 */
export async function sha256(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Build the canonical DoD string that gets hashed.
 * Deterministic: same inputs always produce the same string.
 * Stored alongside the hash so anyone can re-verify.
 *
 * @param {object} params
 * @param {string} params.dodText        - Definition of Done free text
 * @param {string} params.hirerId        - hirer identifier
 * @param {string} params.earnerId       - earner identifier
 * @param {string} params.budgetPoints   - agreed budget in points
 * @param {string} params.deadline       - deadline date string YYYY-MM-DD
 * @returns {string} canonical plaintext
 */
export function buildDodCanonical({ dodText, hirerId, earnerId, budgetPoints, deadline }) {
  return [
    `dod:${dodText.trim()}`,
    `hirer:${hirerId}`,
    `earner:${earnerId}`,
    `budget:${budgetPoints}`,
    `deadline:${deadline}`,
  ].join('\n')
}
