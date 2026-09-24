// src/lib/guestSession.js
// The guest Hirer's credential for one contract.
//
// A guest Hirer has no auth.users row, so they cannot present a JWT. When they
// accept an invite, validate-invite-token issues a guest_access_token (90-day
// TTL) bound to that contract. That token is how the log-event function knows a
// request is genuinely from the party who accepted — it is the guest half of
// server-side identity derivation.
//
// Kept per contract rather than globally: the token authorizes actions on one
// contract only, and a browser may hold invites to several.

const KEY_PREFIX = 'tf_guest_access_token:'

export function storeGuestAccessToken(contractId, token) {
  if (!contractId || !token) return
  try {
    localStorage.setItem(KEY_PREFIX + contractId, token)
  } catch {
    // Private mode / quota — the guest simply loses the ability to record
    // further events on this contract. Non-fatal.
  }
}

export function getGuestAccessToken(contractId) {
  if (!contractId) return null
  try {
    return localStorage.getItem(KEY_PREFIX + contractId)
  } catch {
    return null
  }
}
