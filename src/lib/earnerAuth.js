// src/lib/earnerAuth.js
// Turns the anonymous Earner into a recoverable permanent user by linking an
// email identity to the SAME auth.users id, so contracts they created do not
// become unreachable when this browser's storage is cleared.
//
// A 6-digit OTP is used rather than a confirmation link: the link form would
// send the Earner out to their mail client and back in a new tab, mid-send,
// and the pending contract would have to survive that round trip. The OTP
// keeps them on the page.
//
// Measured against this project on 2026-09-23:
//   signInAnonymously()      -> is_anonymous = true, email = ''
//   updateUser({ email })    -> is_anonymous STAYS true (verified after a
//                               token refresh too); only email_change is set,
//                               email_change_confirm_status = 0, and only the
//                               new-address token exists — an anonymous user
//                               has no current email, so despite the project's
//                               Secure Email Change setting there is just one
//                               OTP to confirm
//   after verifyOtp()        -> is_anonymous = false
// The database's verified_earner_only_insert policy keys off exactly that
// is_anonymous claim, so it stays closed for the whole pending window.

import { supabase } from './supabase.js'

const NOT_CONFIGURED = new Error('Supabase is not configured')

/**
 * Ask Supabase to send a 6-digit code to `email`. Does not change the session.
 * @returns {Promise<{ error: Error|null }>}
 */
export async function requestEarnerVerification(email) {
  if (!supabase) return { error: NOT_CONFIGURED }
  const { error } = await supabase.auth.updateUser({ email })
  return { error: error ?? null }
}

/**
 * Confirm the code. On success the anonymous user becomes permanent, keeping
 * the same id, and the refreshed session carries is_anonymous = false.
 * @returns {Promise<{ user: object|null, error: Error|null }>}
 */
export async function verifyEarnerOtp(email, token) {
  if (!supabase) return { user: null, error: NOT_CONFIGURED }
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: String(token).trim(),
    type: 'email_change',
  })
  return { user: data?.user ?? null, error: error ?? null }
}

/**
 * Whether the current session belongs to a verified (permanent) Earner.
 * Anything else — anonymous, signed out, unconfigured — is false.
 */
export async function isEarnerVerified() {
  if (!supabase) return false
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return false
  return data.user.is_anonymous === false
}
