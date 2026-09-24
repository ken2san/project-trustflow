// supabase/functions/log-event/index.ts
//
// The only writer to the `events` table.
//
// WHAT THE CLIENT MAY SAY, AND WHAT IT MAY NOT
// A caller supplies only: type, contract_id, payload, dod_hash, idempotency_key.
// Everything that determines whether the record is evidence is derived here:
//
//   actor_id        — from the verified session, never from the body. An Earner
//                     is identified by their JWT's sub; a guest Hirer by the
//                     guest_access_token issued at invite acceptance.
//   created_at      — the server's clock.
//   event_hash      — computed here, over the server's own field values.
//   prev_event_hash — read from the contract's current chain tip here.
//   type            — checked against ALLOWED_TYPES; anything else is rejected.
//
// The actor must also be a party to the referenced contract, and the contract
// must be a real row in `contracts`. Events referencing marketplace fixtures
// (contract_id '1', 'mock', …) are rejected by design: a server-authoritative
// record of a contract that does not exist is not evidence, and carving out an
// exception for them would put a permanent bypass in this validator.
//
// CHAIN SERIALIZATION
// No advisory locks. `events_chain_no_fork_idx` makes (contract_id,
// prev_event_hash) unique, so two concurrent writers that read the same tip
// cannot both commit — the loser gets 23505 and retries against the new tip.
// Forking is structurally impossible rather than merely unlikely.
//
// Deploy:
//   npx supabase functions deploy log-event

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  GENESIS_HASH, HASH_VERSION, eventCanonical, payloadHash, deriveDodHash, sha256Hex,
  buildAgreementSnapshot, deriveAgreementHash,
} from '../_shared/eventCanonical.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  // x-guest-access-token must be listed: a browser preflights any request
  // carrying a non-standard header, and a header missing from this list fails
  // that preflight — so the guest Hirer's writes never leave the browser at
  // all. Server-side callers do not preflight, which is why an API-level test
  // cannot see this and the browser-level one can.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-access-token',
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

// Types a party may record about their own contract. Deliberately excludes
// runtime.snapshot (application state, now in runtime_snapshots) and every
// type whose truth is decided by the payment processor rather than by a
// party's assertion — payment.*, trustpoints.* and the dispute verdicts are
// written by capture-payment / cancel-payment with the service role, or by a
// future arbitration path, and must not be assertable from a browser.
const ALLOWED_TYPES = new Set([
  'contract.initiated',
  'contract.accepted',
  // What a party SAYS about performance. These names are deliberate: the
  // Earner asserting they performed is not the same fact as the work having
  // been delivered, and TrustFlow can only attest the first. The projection in
  // derive_contract_state() is built on exactly this distinction.
  'performance.asserted',
  'performance.accepted',
  'performance.rejected',
  'contract.cancelled',
  'contract.completed',
  'dod.consent_recorded',
  'dispute.opened',
  'rating.submitted',
])

// Written before the vocabulary above. Still readable and still verifiable
// under the canonical they were written with — the log is append-only, so
// their names are permanent — but no longer accepted for new events, and they
// do not drive the projection. 'work.submitted' in particular could be read as
// "the work arrived", which is precisely the claim TrustFlow cannot make.
const RETIRED_TYPES = new Set(['work.submitted', 'work.approved', 'work.rejected'])

// Which FUNCTIONAL role an event type may come from.
//
// Being a party to the contract is not enough. Confirming an assertion is the
// other side's act by definition — a performer who could emit
// performance.accepted would be confirming their own claim and walking the
// agreement to the edge of an irreversible transfer alone. Party authorisation
// answers "may you write here"; this answers "is this yours to say".
//
// These are roles in the deal, not sides of the account/guest divide. Which
// party holds which role comes from contracts.performed_by, so the guarantee
// holds in both directions: whoever performs may assert, whoever receives may
// answer, and neither can do the other's part.
//
// Types absent from this map may come from either party.
const ROLE_REQUIRED: Record<string, 'performer' | 'receiver'> = {
  'performance.asserted': 'performer',
  'performance.accepted': 'receiver',
  'performance.rejected': 'receiver',
}

/**
 * Which role a party holds in this particular agreement.
 *
 * `party` is which side of the account/guest divide the caller is on — the
 * account that owns the agreement, or the invited counterparty. `performed_by`
 * says which of those two does the work. The role is the combination.
 *
 * Note on naming: resolveActor still reports 'earner' for the owning account
 * and 'guest_hirer' for the guest, and contracts.earner_user_id still holds the
 * owner. Those names predate this column and are now misleading when the owner
 * is not the performer. Recorded as debt; renaming them is schema and data
 * surgery that this change does not need.
 */
function roleInAgreement(
  party: 'earner' | 'guest_hirer',
  performedBy: string | null,
): 'performer' | 'receiver' {
  const performingParty = performedBy === 'counterparty' ? 'guest_hirer' : 'earner'
  return party === performingParty ? 'performer' : 'receiver'
}

const MAX_PAYLOAD_BYTES = 16 * 1024
const MAX_CHAIN_RETRIES = 5

/**
 * Resolve who is making this request, from credentials only.
 *
 * An Earner presents their Supabase JWT as the bearer token. A guest Hirer has
 * no auth.users row, so they present the contract's guest_access_token in
 * x-guest-access-token — the credential validate-invite-token issued when they
 * accepted the invite.
 */
async function resolveActor(
  req: Request,
  admin: ReturnType<typeof createClient>,
  contract: Record<string, unknown>,
): Promise<{ actorId: string; role: 'earner' | 'guest_hirer' } | null> {
  const guestToken = req.headers.get('x-guest-access-token')
  if (guestToken) {
    if (
      contract.guest_access_token !== guestToken ||
      !contract.guest_access_token_expires_at ||
      new Date(contract.guest_access_token_expires_at as string) < new Date()
    ) {
      return null
    }
    // The accepting email is the guest's established identity on this
    // contract — recorded by validate-invite-token, not chosen by the client.
    const hirerEmail = contract.hirer_email as string | null
    if (!hirerEmail) return null
    return { actorId: `guest:${hirerEmail}`, role: 'guest_hirer' }
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const jwt = authHeader.slice('Bearer '.length)

  const { data, error } = await admin.auth.getUser(jwt)
  if (error || !data?.user) return null
  // An anonymous session is a browser, not a party. Contracts can only be
  // created by a verified Earner (verified_earner_only_insert), so an
  // anonymous caller can never legitimately be a party to one.
  if (data.user.is_anonymous) return null
  if (data.user.id !== contract.earner_user_id) return null
  return { actorId: data.user.id, role: 'earner' }
}

/**
 * What an acceptance permanently records, beyond the assertion itself.
 *
 * The snapshot is embedded, not merely hashed. A hash proves that content
 * matches; it cannot reproduce content that has since changed. Storing the deal
 * as it stood lets the historical record SHOW what was accepted without
 * consulting the contract row, which may have moved on.
 *
 * The two email fields are kept apart on purpose. They may legitimately differ —
 * an invitation can be forwarded — and that divergence is itself evidence.
 * Neither is verified, and nothing here says otherwise.
 */
function acceptanceFacts(contract: Record<string, unknown>) {
  return {
    _agreement: buildAgreementSnapshot(contract),
    _invited_recipient: (contract.invited_hirer_email as string | null) ?? null,
    _claimed_identity: (contract.hirer_email as string | null) ?? null,
    _claimed_identity_verified: false,
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json({ error: 'invalid_body' }, 400)
    }

    const { type, contract_id, payload, dod_hash, idempotency_key } = body as Record<string, unknown>

    if (typeof type !== 'string' || !ALLOWED_TYPES.has(type)) {
      const retired = typeof type === 'string' && RETIRED_TYPES.has(type)
      return json({ error: retired ? 'type_retired' : 'type_not_allowed' }, 400)
    }
    if (typeof contract_id !== 'string' || !contract_id) {
      return json({ error: 'missing_contract_id' }, 400)
    }
    if (payload !== undefined && payload !== null && typeof payload !== 'object') {
      return json({ error: 'invalid_payload' }, 400)
    }
    if (JSON.stringify(payload ?? {}).length > MAX_PAYLOAD_BYTES) {
      return json({ error: 'payload_too_large' }, 413)
    }
    // Rejected, not ignored. The terms an assertion refers to are derived from
    // the agreement itself further down; a caller offering its own value is
    // either confused or trying to pin its assertion to terms that were never
    // agreed. Silently dropping it would hide both.
    if (dod_hash !== undefined && dod_hash !== null) {
      return json({ error: 'dod_hash_is_server_derived' }, 400)
    }
    if (idempotency_key !== undefined && idempotency_key !== null && typeof idempotency_key !== 'string') {
      return json({ error: 'invalid_idempotency_key' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // The contract must exist. A UUID shape is required up front so that
    // marketplace fixture ids ('1', 'mock') fail here rather than as a
    // Postgres cast error.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contract_id)) {
      return json({ error: 'contract_not_found' }, 404)
    }

    const { data: contract, error: contractError } = await admin
      .from('contracts')
      .select('id, project_name, dod, amount_jpy, currency, deadline, performed_by, '
        + 'earner_display_name, earner_user_id, invited_hirer_email, hirer_email, '
        + 'guest_access_token, guest_access_token_expires_at')
      .eq('id', contract_id)
      .maybeSingle()

    if (contractError) return json({ error: 'lookup_failed' }, 500)
    if (!contract) return json({ error: 'contract_not_found' }, 404)

    const actor = await resolveActor(req, admin, contract)
    if (!actor) return json({ error: 'not_a_party' }, 403)

    const roleHere = roleInAgreement(actor.role, contract.performed_by as string | null)
    const requiredRole = ROLE_REQUIRED[type]
    if (requiredRole && roleHere !== requiredRole) {
      return json({ error: 'wrong_party_for_event_type' }, 403)
    }

    // Idempotency: a retry returns what was already written.
    if (idempotency_key) {
      const { data: existing } = await admin
        .from('events')
        .select('*')
        .eq('contract_id', contract_id)
        .eq('idempotency_key', idempotency_key)
        .maybeSingle()
      if (existing) return json({ event: existing, deduplicated: true }, 200)
    }

    for (let attempt = 0; attempt < MAX_CHAIN_RETRIES; attempt++) {
      const { data: tip } = await admin
        .from('events')
        .select('event_hash')
        .eq('contract_id', contract_id)
        .not('event_hash', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const prevHash = tip?.event_hash ?? GENESIS_HASH

      // The terms this assertion refers to, derived from the agreement rather
      // than taken from the caller. Two assertions made either side of a scope
      // change carry different values, which is what makes an unannounced
      // change to the terms visible in the log instead of silent.
      const termsHash = await deriveDodHash(contract.dod)

      // The whole deal, not just its completion criteria. dod_hash alone left
      // price and date unbound, so an accepted agreement could have its amount
      // changed afterwards with nothing detecting it.
      const agreementHash = await deriveAgreementHash(contract)

      // The substance of the assertion, bound into the hash from v3 on.
      //
      // Underscore-prefixed keys are the server's namespace: everything under
      // one is a fact TrustFlow derived, not one a party asserted. A caller
      // that sent `_agreement` could not forge the hash — that is derived from
      // the contract row — but it could leave a reader looking at terms nobody
      // agreed to, so those keys are dropped before anything is merged in.
      const recordedPayload = {
        ...Object.fromEntries(
          Object.entries((payload as Record<string, unknown>) ?? {})
            .filter(([key]) => !key.startsWith('_'))),
        // Recorded, not accepted: how the writer was authenticated, and which
        // role they held in this agreement at the time.
        _actor_role: actor.role,
        _role_in_agreement: roleHere,
        // How this party obtained the authority to act. A guest's credential
        // exists only because a single-use invitation was consumed, so that is
        // what their authority traces back to. This claims nothing about email
        // verification, account identity, or who the person is.
        _auth_method: actor.role === 'guest_hirer' ? 'invite_capability' : 'account_session',
        ...(type === 'dod.consent_recorded' ? acceptanceFacts(contract) : {}),
      }
      const substanceHash = await payloadHash(recordedPayload)

      const event = {
        id: crypto.randomUUID(),
        type,
        contract_id,
        actor_id: actor.actorId,
        dod_hash: termsHash,
        created_at: new Date().toISOString(),
      }

      // One definition of the canonical, shared with the verifiers — see
      // _shared/eventCanonical.ts for why that matters.
      const eventHash = await sha256Hex(eventCanonical({
        ...event,
        prev_event_hash: prevHash,
        payload_hash: substanceHash,
        agreement_hash: agreementHash,
      }, HASH_VERSION))

      const { data: inserted, error: insertError } = await admin
        .from('events')
        .insert({
          ...event,
          payload: recordedPayload,
          payload_hash: substanceHash,
          agreement_hash: agreementHash,
          event_hash: eventHash,
          prev_event_hash: prevHash,
          hash_version: HASH_VERSION,
          idempotency_key: (idempotency_key as string | null) ?? null,
          server_recorded_at: new Date().toISOString(),
          tsa_token: null,
        })
        .select()
        .single()

      if (!insertError) return json({ event: inserted, deduplicated: false }, 201)

      // 23505 on the fork index means another event claimed this tip first.
      // Re-read the tip and try again.
      if (insertError.code === '23505') {
        if (insertError.message?.includes('events_idempotency_idx')) {
          const { data: existing } = await admin
            .from('events')
            .select('*')
            .eq('contract_id', contract_id)
            .eq('idempotency_key', idempotency_key as string)
            .maybeSingle()
          if (existing) return json({ event: existing, deduplicated: true }, 200)
        }
        continue
      }

      return json({ error: 'insert_failed', detail: insertError.message }, 500)
    }

    return json({ error: 'chain_contention' }, 409)

  } catch (err) {
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
