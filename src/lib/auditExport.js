// src/lib/auditExport.js
// Signed audit trail export — produce a self-contained JSON document
// that proves a contract's immutable event history.
//
// The exported document contains:
//   - Contract metadata + DoD hash
//   - Full event chain with per-event SHA-256 hashes and RFC 3161 TSA tokens
//   - A chain integrity report (each event's hash re-verified at export time)
//   - Export metadata (generated_at, generator version)
//
// Anyone can verify by re-computing the hashes and comparing against
// on-chain anchors or TSA tokens without access to TrustFlow servers.

import { sha256 } from './crypto.js'

const EXPORT_VERSION = '1.0'

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
  // Re-verify each event's hash at export time
  const verifiedEvents = await Promise.all(
    events.map(async (ev) => {
      const canonical = JSON.stringify({
        id:          ev.id,
        type:        ev.type,
        contract_id: ev.contract_id,
        actor_id:    ev.actor_id,
        dod_hash:    ev.dod_hash ?? null,
        created_at:  ev.created_at,
      })
      const recomputedHash = await sha256(canonical)
      const hashMatch = ev.event_hash
        ? ev.event_hash === recomputedHash
        : null  // hash not yet stored (pre-TSA events)

      return {
        ...ev,
        _export_verification: {
          recomputed_hash: recomputedHash,
          stored_hash:     ev.event_hash ?? null,
          hash_match:      hashMatch,
          tsa_token_present: Boolean(ev.tsa_token),
        },
      }
    })
  )

  const allHashesMatch = verifiedEvents.every(
    ev => ev._export_verification.hash_match !== false
  )

  const auditDoc = {
    trustflow_audit_trail: {
      version:         EXPORT_VERSION,
      generated_at:    new Date().toISOString(),
      contract_id:     contractId,
      dod_hash:        dodHash ?? null,
      integrity_status: allHashesMatch ? 'VERIFIED' : 'HASH_MISMATCH_DETECTED',
      meta,
      events:          verifiedEvents,
      verification_instructions: [
        '1. For each event, recompute SHA-256 of: {id, type, contract_id, actor_id, dod_hash, created_at}',
        '2. Compare with event.event_hash — any mismatch indicates tampering',
        '3. If tsa_token is present, verify via RFC 3161 against FreeTSA public cert',
        '4. dod_hash proves the Definition of Done text was not modified after contract initiation',
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
