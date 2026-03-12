// src/lib/tsa.js
// RFC 3161 Trusted Timestamping — https://www.rfc-editor.org/rfc/rfc3161
//
// Sends a SHA-256 hash to a public TSA (FreeTSA.org) and returns a
// base64-encoded DER timestamp response token.
//
// IMPORTANT: Direct browser → TSA calls are blocked by CORS in most environments.
// The token will be null in that case — non-fatal, event is still recorded.
// For production, use the Supabase Edge Function:
//   supabase/functions/timestamp-event/index.ts

// ── DER encoding helpers ────────────────────────────────────────────────────

function derLenBytes(len) {
  if (len < 128) return new Uint8Array([len])
  if (len < 256) return new Uint8Array([0x81, len])
  return new Uint8Array([0x82, (len >> 8) & 0xff, len & 0xff])
}

function derTLV(tag, content) {
  const lenBytes = derLenBytes(content.length)
  const out = new Uint8Array(1 + lenBytes.length + content.length)
  out[0] = tag
  out.set(lenBytes, 1)
  out.set(content, 1 + lenBytes.length)
  return out
}

function derSeq(content) { return derTLV(0x30, content) }

function concat(...parts) {
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) { out.set(p, off); off += p.length }
  return out
}

function hexToBytes(hex) {
  const b = new Uint8Array(hex.length / 2)
  for (let i = 0; i < b.length; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return b
}

// ── RFC 3161 TimeStampReq builder ───────────────────────────────────────────

/**
 * Build a minimal DER-encoded RFC 3161 TimeStampReq for a SHA-256 hash.
 *
 * TimeStampReq ::= SEQUENCE {
 *   version         INTEGER(1),
 *   messageImprint  MessageImprint,
 *   certReq         BOOLEAN DEFAULT TRUE
 * }
 * MessageImprint ::= SEQUENCE {
 *   hashAlgorithm   AlgorithmIdentifier,   -- SHA-256 OID 2.16.840.1.101.3.4.2.1
 *   hashedMessage   OCTET STRING
 * }
 *
 * @param {string} hashHex - 64-char SHA-256 hex digest
 * @returns {Uint8Array} DER-encoded TimeStampReq
 */
function buildTimeStampReq(hashHex) {
  const version = new Uint8Array([0x02, 0x01, 0x01])

  // SHA-256 OID: 2.16.840.1.101.3.4.2.1
  const oidBytes = new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01])
  const algId = derSeq(concat(derTLV(0x06, oidBytes), new Uint8Array([0x05, 0x00])))
  const messageImprint = derSeq(concat(algId, derTLV(0x04, hexToBytes(hashHex))))

  // certReq BOOLEAN TRUE — include TSA signing cert in response for offline verification
  const certReq = new Uint8Array([0x01, 0x01, 0xff])

  return derSeq(concat(version, messageImprint, certReq))
}

// ── TSA request ──────────────────────────────────────────────────────────────

const TSA_URL = 'https://freetsa.org/tsr'
const TSA_TIMEOUT_MS = 6000

/**
 * Request a RFC 3161 timestamp token from FreeTSA for a SHA-256 hash.
 * Returns a base64-encoded DER timestamp response, or null on failure.
 *
 * Failure modes (all non-fatal — event is still recorded without a token):
 *   - CORS block (expected in browser — use Edge Function for production)
 *   - Network timeout
 *   - TSA service unavailable
 *
 * @param {string} hashHex - 64-char SHA-256 hex digest
 * @returns {Promise<string|null>} base64-encoded DER token, or null
 */
export async function requestTimestamp(hashHex) {
  try {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), TSA_TIMEOUT_MS)

    const resp = await fetch(TSA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/timestamp-query' },
      body: buildTimeStampReq(hashHex),
      signal: controller.signal,
    })
    clearTimeout(tid)

    if (!resp.ok) return null

    const buf = await resp.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let bin = ''
    for (const b of bytes) bin += String.fromCharCode(b)
    return btoa(bin)
  } catch {
    // CORS, network error, timeout — silently return null
    return null
  }
}
