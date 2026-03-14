// src/lib/eventLog.js
// Append-only contract event log.
// Provides event creation and persistence (Supabase when connected, in-memory fallback).
// All writes are INSERT-only — no UPDATE or DELETE ever happens here.
//
// Phase 4 integrity chain per event:
//   1. createEvent() — assigns UUID + ISO timestamp
//   2. sha256(canonical event string) → event_hash
//   3. requestTimestamp(event_hash) → RFC 3161 TSA token (null if CORS blocks — non-fatal)
//   4. persistEvent() — single INSERT with hash + token already set

import { supabase } from './supabase.js'
import { sha256 } from './crypto.js'
import { requestTimestamp } from './tsa.js'

// ── Event type constants ────────────────────────────────────────────────────

export const EVENT_TYPES = {
  CONTRACT_INITIATED:   'contract.initiated',    // DoD agreed, hash created
  CONTRACT_ACCEPTED:    'contract.accepted',     // both parties confirmed
  WORK_SUBMITTED:       'work.submitted',        // earner submitted deliverable
  WORK_APPROVED:        'work.approved',         // hirer approved submission
  WORK_REJECTED:        'work.rejected',         // hirer rejected submission
  MILESTONE_APPROVED:   'milestone.approved',    // milestone payment released
  PAYMENT_RELEASED:     'payment.released',      // full payment released
  DISPUTE_OPENED:       'dispute.opened',        // dispute raised by either party
  DISPUTE_RESOLVED:     'dispute.resolved',      // arbiter or system resolved dispute
  CONTRACT_PAUSED:      'contract.paused',
  CONTRACT_RESUMED:     'contract.resumed',
  CONTRACT_CANCELLED:   'contract.cancelled',
  CONTRACT_COMPLETED:   'contract.completed',    // step 5 reached
  RATING_SUBMITTED:     'rating.submitted',      // blind rating submitted
  // Bad-actor events — permanently attached to an actor's reputation record
  DISPUTE_LOST:          'dispute.lost',           // arbiter / resolution ruled against this actor
  FORCED_CANCELLATION:   'contract.forced_cancellation', // contract cancelled by the other party's action
  GHOSTING_FLAG:         'actor.ghosting_flag',    // unresponsive; auto-release timer triggered
}

// ── Event builder ────────────────────────────────────────────────────────────

/**
 * Build an event object (does NOT persist — call persistEvent to save).
 *
 * @param {object} params
 * @param {string} params.type       - one of EVENT_TYPES
 * @param {string} params.contractId - contract identifier (UUID or mock ID)
 * @param {string} params.actorId    - who triggered this event
 * @param {object} [params.payload]  - arbitrary structured data
 * @param {string} [params.dodHash]  - SHA-256 of DoD (required for contract.initiated)
 * @returns {object} event object
 */
export function createEvent({ type, contractId, actorId, payload = {}, dodHash }) {
  return {
    id: crypto.randomUUID(),
    type,
    contract_id: contractId,
    actor_id: actorId,
    payload,
    dod_hash: dodHash ?? null,
    created_at: new Date().toISOString(),
  }
}

// ── Persistence ──────────────────────────────────────────────────────────────

/**
 * Persist an event.
 * - If Supabase is connected: inserts into the `events` table.
 * - If not connected (mock mode): no-op, returns the event as-is.
 *
 * The caller is responsible for adding the returned event to local React state.
 *
 * @param {object} event - result of createEvent()
 * @returns {Promise<object>} the event (with server timestamps if Supabase responds)
 */
export async function persistEvent(event) {
  if (!supabase) {
    // Mock mode — just return the event; caller stores it in React state
    return event
  }

  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) {
    // Non-fatal: log warning but don't crash the app.
    // The local event still gets returned so UI stays consistent.
    console.warn('[TrustFlow] event persist failed:', error.message)
    return event
  }

  return data
}

/**
 * Convenience: create → hash → TSA stamp → persist in one call.
 * The TSA token is obtained BEFORE insert so the record is complete and immutable on write.
 * TSA failure is non-fatal: token will be null, event is still recorded.
 *
 * @param {object} params - same as createEvent()
 * @returns {Promise<object>} persisted event
 */
export async function logEvent(params) {
  const event = createEvent(params)

  // Build a canonical string of the event's identifying fields for hashing
  const canonical = JSON.stringify({
    id:          event.id,
    type:        event.type,
    contract_id: event.contract_id,
    actor_id:    event.actor_id,
    dod_hash:    event.dod_hash,
    created_at:  event.created_at,
  })
  const eventHash = await sha256(canonical)

  // Request RFC 3161 timestamp — best-effort, null if CORS/network blocks
  const tsaToken = await requestTimestamp(eventHash)

  return persistEvent({ ...event, event_hash: eventHash, tsa_token: tsaToken })
}

/**
 * Read latest events for a contract.
 * Returns [] in local/mock mode or on query failure.
 *
 * @param {string} contractId
 * @returns {Promise<Array<object>>}
 */
export async function fetchContractEvents(contractId) {
  if (!supabase || !contractId) return []

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.warn('[TrustFlow] contract events fetch failed:', error.message)
    return []
  }

  return data || []
}

/**
 * Subscribe to realtime inserts for one contract.
 * Returns an unsubscribe function.
 *
 * @param {string} contractId
 * @param {(event: object) => void} onInsert
 * @returns {() => void}
 */
export function subscribeToContractEvents(contractId, onInsert) {
  if (!supabase || !contractId) return () => {}

  const channel = supabase
    .channel(`events:${contractId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'events',
        filter: `contract_id=eq.${contractId}`,
      },
      payload => {
        if (payload?.new) onInsert(payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
