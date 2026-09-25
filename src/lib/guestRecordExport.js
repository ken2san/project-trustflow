// src/lib/guestRecordExport.js
// The counterparty's copy of the record — a server-verified document.
//
// This is NOT the same artefact as auditExport.js produces, and the difference
// is the whole reason this file exists.
//
// The owning account can read the raw `events` rows, so its export carries
// every payload and invites the reader to recompute each hash and re-verify the
// chain without TrustFlow. A guest has no auth.users row: RLS returns them
// nothing from `events`, and their trail arrives from guest-contract-events
// already allowlist-filtered, with each payload reduced to the fields that
// party may see. Handing them the same document would tell a reader to
// recompute a hash over a payload that is deliberately incomplete, and every
// untouched event would come back as tampered with. An evidence export that
// falsely cries tampering is worse than no export at all.
//
// So this document reports what the SERVER checked, at the moment it read the
// unfiltered rows, and says plainly that the reader cannot repeat those checks
// from this file. The verdicts are the server's; nothing here re-derives them.
// What this module adds is a readable reason for the verdict, the accepted
// terms alongside the current ones, and the limits stated rather than left for
// the reader to discover.

const DOCUMENT_VERSION = '1.0'

/**
 * Why the chain carries the verdict it does.
 *
 * The server's own boolean stays authoritative and is reported verbatim; this
 * only names the reason, from the same per-event verdicts the server returned.
 * A record with nothing server-attested in it is not "unverified" — there was
 * never an attestation to check, which is a different statement.
 */
function chainStatusOf(events, chain) {
  if (!chain?.server_attested) return 'NOT_SERVER_ATTESTED'
  const verdicts = events.map(ev => ev.integrity ?? {})
  if (verdicts.some(v => v.hash_valid === false)) return 'HASH_MISMATCH_DETECTED'
  if (verdicts.some(v => v.substance_valid === false)) return 'PAYLOAD_MISMATCH_DETECTED'
  if (verdicts.some(v => v.chain_linked === false)) return 'CHAIN_LINK_BROKEN'
  return chain.verified ? 'VERIFIED' : 'NOT_VERIFIED'
}

/**
 * Build the counterparty's record document from a guest-contract-events
 * response. Pure, so it is testable without a DOM or a network.
 *
 * @param {object} evidence - the response body from guest-contract-events
 * @returns {object} the document, ready to serialize
 * @throws {Error} when there is nothing to record
 */
export function buildGuestRecordDocument(evidence) {
  const events = evidence?.events ?? []
  const contract = evidence?.contract ?? null

  // A record with nothing in it still looks like a signed record. The owner's
  // export refuses in the same situation and for the same reason.
  if (!contract?.id) throw new Error('no agreement in this evidence response')
  if (events.length === 0) throw new Error('no readable events for this agreement')

  const chain = evidence.chain ?? {}
  const status = chainStatusOf(events, chain)

  return {
    trustflow_counterparty_record: {
      version:       DOCUMENT_VERSION,
      // Named so it can never be mistaken for the owner's re-verifiable export.
      document_type: 'server_verified_record',
      generated_at:  new Date().toISOString(),
      agreement_id:  contract.id,

      // Stated up front, because a reader who assumes the wrong kind of
      // document draws the wrong conclusion from it.
      what_this_document_is: [
        'A copy of the record TrustFlow holds for this agreement, as released to the counterparty.',
        'The integrity results below were computed by the TrustFlow server against the complete stored rows at the time this document was generated.',
        'They CANNOT be reproduced from this file. The detail of each event is filtered to what this party may see, so recomputing a hash from the text here would not match, on an untampered record as much as on a tampered one.',
        'TrustFlow records what each party stated. It does not establish that a statement is true.',
        'The party who owns this agreement can produce a fuller export that a third party can re-verify independently.',
      ],

      verification: {
        performed_by: 'TrustFlow server (guest-contract-events)',
        // The server's own verdict, carried through untouched.
        server_verdict: chain.verified ?? null,
        status,
        event_count:      chain.event_count ?? events.length,
        server_attested:  chain.server_attested ?? null,
        // Rows from before the server assigned actor, timestamp and hash. One
        // that verifies proves only that it has not changed since it was
        // stored, not that it says anything true.
        client_asserted:  chain.client_asserted ?? null,
        // Whether the detail fields are covered by the hashes at all, rather
        // than merely recorded next to fields that are.
        payload_covered_by_hash: chain.payload_covered_by_hash ?? null,
        // If the record was cut short, the absence of an event below means
        // nothing. Surfaced here rather than buried.
        truncated: chain.truncated ?? false,
      },

      // What was AGREED, taken from the acceptance event rather than from the
      // agreement row, which may legitimately have moved on since. Null for
      // agreements accepted before the snapshot existed — absent, not
      // reconstructed.
      accepted_agreement: evidence.accepted_agreement ?? null,

      // Terms on which the current row and the accepted snapshot disagree.
      // Empty when they still match; null when there is no snapshot to compare
      // against. A non-empty list is not proof of wrongdoing, but it is the
      // thing a reader most needs to see.
      terms_changed_since_acceptance: evidence.terms_changed_since_acceptance ?? null,

      // Who accepted, with what authority, and what they claimed. The invited
      // address and the claimed address are kept apart: an invitation can be
      // forwarded, and the divergence is itself evidence. Neither is verified.
      acceptance_identity: evidence.acceptance_identity ?? null,

      // The agreement as it stands NOW. May differ from accepted_agreement.
      current_terms: {
        project_name:        contract.project_name ?? null,
        dod:                 contract.dod ?? null,
        amount_jpy:          contract.amount_jpy ?? null,
        currency:            contract.currency ?? null,
        deadline:            contract.deadline ?? null,
        state:               contract.state ?? null,
        performed_by:        contract.performed_by ?? null,
        offered_by:          contract.earner_display_name ?? null,
        counterparty:        contract.hirer_email ?? null,
      },

      events: events.map(ev => ({
        id:         ev.id,
        type:       ev.type,
        created_at: ev.created_at,
        actor:      ev.actor ?? null,
        // Filtered to what this party may see — which is exactly why the
        // hashes below cannot be recomputed from it.
        payload:    ev.payload ?? null,
        dod_hash:   ev.dod_hash ?? null,
        server_verification: ev.integrity ?? null,
      })),
    },
  }
}

/**
 * Build the document and hand it to the browser as a download.
 *
 * @param {object} evidence - the response body from guest-contract-events
 */
export async function downloadGuestRecord(evidence) {
  const doc = buildGuestRecordDocument(evidence)
  const agreementId = doc.trustflow_counterparty_record.agreement_id

  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = `trustflow-record-${agreementId}-${Date.now()}.json`
  window.document.body.appendChild(a)
  a.click()
  window.document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
