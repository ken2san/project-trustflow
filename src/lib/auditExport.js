// src/lib/auditExport.js
// Signed audit trail export — produce a self-contained JSON document
// that proves a contract's immutable event history.
//
// The exported document contains:
//   - Contract metadata + DoD hash
//   - Full event chain with per-event SHA-256 hashes and RFC 3161 TSA tokens
//   - A chain integrity report: each event's hash is re-verified AND its
//     prev_event_hash is checked against its chronological predecessor's
//     actual hash. The prev_hash link (not just each event's own hash) is
//     what lets a deleted, reordered, or forged-and-inserted event be
//     detected — a lone self-consistent hash on an isolated row proves
//     nothing about whether the row belongs where it claims to be in the
//     sequence. See eventLog.js's logEvent() for how the chain is built.
//   - Export metadata (generated_at, generator version)
//
// Anyone can verify by re-computing the hashes (including each event's
// prev_hash) and comparing against on-chain anchors or TSA tokens without
// access to TrustFlow servers.

import { sha256 } from './crypto.js'
import { GENESIS_HASH } from './eventLog.js'

const EXPORT_VERSION = '1.1'

/**
 * Build and download a signed JSON audit trail for a contract.
 *
 * @param {object} params
 * @param {string}   params.contractId   - contract identifier
 * @param {string}   params.dodHash      - SHA-256 of the original DoD
 * @param {object[]} params.events       - array of event objects from eventLog
 * @param {object}   [params.meta]       - optional extra metadata (title, parties, etc.)
 */
export async function downloadAuditTrail({ contractId, dodHash, events, meta = {} }) {
  // Chain verification depends on chronological order — the events array as
  // received isn't guaranteed to be in that order (fetchContractEvents
  // returns newest-first; realtime-appended events may be mixed in).
  const chronological = [...events].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )

  // Re-verify each event's own hash AND its link to its chronological
  // predecessor at export time.
  let prevHash = GENESIS_HASH
  const verifiedEvents = []
  for (const ev of chronological) {
    const canonical = JSON.stringify({
      id:          ev.id,
      type:        ev.type,
      contract_id: ev.contract_id,
      actor_id:    ev.actor_id,
      dod_hash:    ev.dod_hash ?? null,
      created_at:  ev.created_at,
      prev_hash:   ev.prev_event_hash ?? GENESIS_HASH,
    })
    const recomputedHash = await sha256(canonical)
    const hashMatch = ev.event_hash
      ? ev.event_hash === recomputedHash
      : null  // hash not yet stored (pre-chain events, before this field existed)
    const chainLinkMatch = ev.prev_event_hash
      ? ev.prev_event_hash === prevHash
      : null  // pre-chain event — no prev_event_hash was ever recorded for it

    verifiedEvents.push({
      ...ev,
      _export_verification: {
        recomputed_hash:   recomputedHash,
        stored_hash:       ev.event_hash ?? null,
        hash_match:        hashMatch,
        expected_prev_hash: prevHash,
        chain_link_match:  chainLinkMatch,
        tsa_token_present: Boolean(ev.tsa_token),
      },
    })

    // Advance the expected tip regardless of match — a break should surface
    // as a mismatch on the NEXT event too if the gap wasn't the last one,
    // not silently reset the chain.
    prevHash = ev.event_hash ?? prevHash
  }

  const allHashesMatch = verifiedEvents.every(
    ev => ev._export_verification.hash_match !== false
  )
  const chainIntact = verifiedEvents.every(
    ev => ev._export_verification.chain_link_match !== false
  )

  // Extract consent record from events — surfaces prominently for legal review
  const consentEvent = verifiedEvents.find(ev => ev.type === 'dod.consent_recorded')
  const counterpartyConsent = consentEvent
    ? {
        counterparty_name:  consentEvent.payload?.counterparty_name ?? null,
        counterparty_email: consentEvent.payload?.counterparty_email ?? consentEvent.actor_id,
        dod_items_agreed:   consentEvent.payload?.dod_items ?? [],
        consented_at:       consentEvent.created_at,
        event_id:           consentEvent.id,
        // A TSA token being present is NOT the same as it having been
        // cryptographically verified — nothing in this codebase validates a
        // TSA token's RFC 3161 signature. Named honestly; see instruction 3
        // below for what a reader still has to do themselves.
        tsa_token_present:  Boolean(consentEvent.tsa_token),
      }
    : null

  const auditDoc = {
    trustflow_audit_trail: {
      version:              EXPORT_VERSION,
      generated_at:         new Date().toISOString(),
      contract_id:          contractId,
      dod_hash:             dodHash ?? null,
      // VERIFIED means: every event's own hash matches its recomputation,
      // AND every event's prev_event_hash matches its chronological
      // predecessor's actual hash. The second check is what catches
      // deletion/reordering/insertion — a lone tampered or removed row
      // breaks the link to its neighbor even if its own hash is internally
      // consistent. It does NOT mean any TSA token was cryptographically
      // verified (see tsa_token_present) and it does NOT mean writes are
      // guaranteed atomic against concurrent inserts (see eventLog.js).
      integrity_status:
        allHashesMatch && chainIntact ? 'VERIFIED'
        : !allHashesMatch ? 'HASH_MISMATCH_DETECTED'
        : 'CHAIN_LINK_BROKEN',
      counterparty_consent: counterpartyConsent,
      meta,
      events:               verifiedEvents,
      verification_instructions: [
        '1. Sort events by created_at ascending.',
        '2. For each event, recompute SHA-256 of: {id, type, contract_id, actor_id, dod_hash, created_at, prev_hash}, where prev_hash is that event\'s own prev_event_hash field (or the literal string "GENESIS" for the first event). Compare with event.event_hash — any mismatch indicates that event was altered.',
        '3. Separately, confirm each event\'s prev_event_hash equals the PRECEDING event\'s event_hash. A break here — even if every individual event\'s own hash still matches itself — indicates an event was deleted, reordered, or a forged event was inserted.',
        '4. tsa_token_present only means a token was returned at logging time — it has not been cryptographically verified here. To actually verify one, check its RFC 3161 signature against FreeTSA\'s public certificate.',
        '5. dod_hash proves the Definition of Done text was not modified after contract initiation',
      ],
    },
  }

  // Trigger browser download
  const blob = new Blob([JSON.stringify(auditDoc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = `trustflow-audit-${contractId}-${Date.now()}.json`
  window.document.body.appendChild(a)
  a.click()
  window.document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
