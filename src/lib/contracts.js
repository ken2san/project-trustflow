// src/lib/contracts.js
// DB-backed contract creation and invite lookup.
//
// The contract row is the canonical record; localStorage keeps only the
// in-progress form. Note what is deliberately NOT sent on insert: state,
// invite_token, invite_token_expires_at, guest_access_token, hirer_email and
// every stripe_* / settlement column are server-owned — the client no longer
// holds the INSERT privilege on them (20260923000000), so including any of
// them makes the whole insert fail with 403. The server fills them: state
// defaults to AWAITING_ACCEPTANCE, invite_token to a random UUID, and
// invite_token_expires_at to now() + 72h.

import { supabase } from './supabase.js'
import { getGuestAccessToken } from './guestSession.js'

const NOT_CONFIGURED = new Error('Supabase is not configured')

/**
 * Persist a contract and return it, including the server-issued invite_token.
 * Requires a verified (non-anonymous) Earner session — otherwise the
 * verified_earner_only_insert policy rejects the row.
 *
 * @param {object} p
 * @param {string}   p.earnerDisplayName
 * @param {string}   p.projectName
 * @param {string[]} p.dod                 completion criteria, one per entry
 * @param {string}   [p.dodHash]
 * @param {number}   p.amountJpy
 * @param {string}   [p.deadline]          ISO date (YYYY-MM-DD)
 * @param {string}   p.invitedHirerEmail   address the invite is addressed to
 * @returns {Promise<{ contract: object|null, error: Error|null }>}
 */
export async function createContract({
  earnerDisplayName,
  projectName,
  dod,
  dodHash,
  amountJpy,
  deadline,
  invitedHirerEmail,
}) {
  if (!supabase) return { contract: null, error: NOT_CONFIGURED }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { contract: null, error: userError ?? new Error('Not signed in') }
  }

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      earner_user_id: userData.user.id,
      earner_display_name: earnerDisplayName,
      project_name: projectName,
      dod,
      dod_hash: dodHash ?? null,
      amount_jpy: amountJpy,
      currency: 'JPY',
      deadline: deadline || null,
      invited_hirer_email: invitedHirerEmail,
    })
    .select()
    .single()

  return { contract: data ?? null, error: error ?? null }
}

/**
 * Every contract the signed-in user is a party to, newest first.
 *
 * No filter is applied here: `parties_read_own_contracts` already restricts
 * rows to `auth.uid() = earner_user_id OR auth.uid() = hirer_user_id`, so the
 * database decides what is visible. Adding a client-side `.eq('earner_user_id',
 * …)` would look like the security control and quietly become the thing people
 * trust — the policy is the control.
 *
 * invite_token is included because the Earner needs it to re-share a pending
 * invite; it is their own contract's token and RLS already permits reading it.
 *
 * Returns an empty list rather than throwing when Supabase is unconfigured, so
 * the home screen renders its empty state instead of failing.
 *
 * @returns {Promise<{ contracts: object[], error: Error|null }>}
 */
export async function listContracts() {
  if (!supabase) return { contracts: [], error: NOT_CONFIGURED }

  const { data, error } = await supabase
    .from('contracts')
    .select(
      'id, project_name, dod, amount_jpy, currency, deadline, state, '
      + 'earner_display_name, invited_hirer_email, hirer_email, '
      + 'invite_token, invite_token_expires_at, invite_token_used_at, created_at',
    )
    .order('created_at', { ascending: false })

  return { contracts: data ?? [], error: error ?? null }
}

/** Build the invite URL for a server-issued token. */
export function inviteUrlFor(inviteToken) {
  return `${window.location.origin}${window.location.pathname}?token=${encodeURIComponent(inviteToken)}`
}

/**
 * Read the contract behind an invite token, without consuming it.
 * Values come from the contract row via the Edge Function — the URL only
 * identifies the contract, it never carries the terms.
 *
 * @returns {Promise<{ invite: object|null, reason: string|null }>}
 *          reason is 'not_found' | 'expired' | 'already_used' | 'error'
 */
export async function fetchInvite(inviteToken) {
  if (!supabase) return { invite: null, reason: 'error' }

  const { data, error } = await supabase.functions.invoke('validate-invite-token', {
    body: { invite_token: inviteToken },
  })

  if (error || data?.error) {
    return { invite: null, reason: data?.error ?? 'error' }
  }
  return { invite: data, reason: null }
}

/**
 * Read the evidence trail for the contract this browser holds a guest
 * credential for.
 *
 * The contract is not named in the request: the server resolves it from the
 * guest_access_token alone, so there is no contract id for a caller to swap.
 * The contractId argument only selects which stored credential to send.
 *
 * The response is a shaped view, not raw rows — payloads are allowlisted per
 * event type and hash-chain verification is reported per event. See
 * supabase/functions/guest-contract-events.
 *
 * @returns {Promise<{ evidence: object|null, reason: string|null }>}
 *          reason is 'no_credential' | 'invalid_guest_token'
 *                  | 'guest_token_expired' | 'error'
 */
export async function fetchGuestEvidence(contractId) {
  if (!supabase) return { evidence: null, reason: 'error' }

  const guestToken = getGuestAccessToken(contractId)
  if (!guestToken) return { evidence: null, reason: 'no_credential' }

  const { data, error } = await supabase.functions.invoke('guest-contract-events', {
    headers: { 'x-guest-access-token': guestToken },
  })

  if (error || data?.error) {
    return { evidence: null, reason: data?.error ?? 'error' }
  }
  return { evidence: data, reason: null }
}

/**
 * Accept the invite: consumes the one-time token, records the accepting
 * email, moves the contract to TERMS_ACCEPTED and returns the guest access
 * token for this Hirer's later actions on this contract.
 */
export async function acceptInvite(inviteToken, hirerEmail) {
  if (!supabase) return { accepted: null, reason: 'error' }

  const { data, error } = await supabase.functions.invoke('validate-invite-token', {
    body: { invite_token: inviteToken, accept: true, hirer_email: hirerEmail },
  })

  if (error || data?.error) {
    return { accepted: null, reason: data?.error ?? 'error' }
  }
  return { accepted: data, reason: null }
}
