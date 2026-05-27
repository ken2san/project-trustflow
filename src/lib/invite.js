/**
 * Invite token utilities.
 *
 * Prototype implementation: HMAC-SHA256 signed, base64url-encoded token with
 * 72-hour expiry. The HMAC key is embedded in the client bundle — acceptable for
 * prototype use only. When Supabase is deployed, replace with the
 * `validate-invite-token` Edge Function (server-side one-time token).
 *
 * Token format:  BASE64URL(JSON payload) . BASE64URL(HMAC-SHA256 signature)
 * URL format:    ?token=<token>
 *
 * Backward compat: ?invite=1 legacy URLs still parsed by App.jsx.
 */

const INVITE_SECRET = 'tf-dev-secret-v1';
export const INVITE_EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours

// ---------- internal helpers ----------

function b64urlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
    + '=='.slice(0, (4 - str.length % 4) % 4);
  return atob(padded);
}

async function signPayload(b64Payload) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(INVITE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(b64Payload));
  return b64urlEncode(String.fromCharCode(...new Uint8Array(sig)));
}

async function verifyPayload(b64Payload, sig) {
  const expected = await signPayload(b64Payload);
  return expected === sig;
}

// ---------- public API ----------

/**
 * Generate a signed invite token.
 * @returns {Promise<string>} opaque token string (base64url.sig)
 */
export async function generateInviteToken({ cid, inviter, project, amount, dod }) {
  const payload = { cid, inviter, project, amount, dod, exp: Date.now() + INVITE_EXPIRY_MS };
  const b64 = b64urlEncode(JSON.stringify(payload));
  const sig = await signPayload(b64);
  return `${b64}.${sig}`;
}

/**
 * Decode token payload WITHOUT verifying signature.
 * Use for synchronous initial render only.
 * @returns {object|null} payload or null if malformed
 */
export function decodeInviteTokenUnsafe(token) {
  try {
    const [b64] = token.split('.');
    if (!b64) return null;
    return JSON.parse(b64urlDecode(b64));
  } catch {
    return null;
  }
}

/**
 * Validate token signature and expiry.
 * @returns {Promise<{valid: boolean, data?: object, reason?: string}>}
 */
export async function validateInviteToken(token) {
  try {
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return { valid: false, reason: 'malformed' };

    const ok = await verifyPayload(b64, sig);
    if (!ok) return { valid: false, reason: 'tampered' };

    const data = JSON.parse(b64urlDecode(b64));
    if (!data.exp || data.exp < Date.now()) return { valid: false, reason: 'expired' };

    return { valid: true, data };
  } catch {
    return { valid: false, reason: 'invalid' };
  }
}
