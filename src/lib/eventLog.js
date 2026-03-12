// src/lib/eventLog.js
// Append-only contract event log.
// Provides event creation and persistence (Supabase when connected, in-memory fallback).
// All writes are INSERT-only — no UPDATE or DELETE ever happens here.

import { supabase } from './supabase.js'

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
 * Convenience: create + persist in one call.
 *
 * @param {object} params - same as createEvent()
 * @returns {Promise<object>} persisted event
 */
export async function logEvent(params) {
  const event = createEvent(params)
  return persistEvent(event)
}
