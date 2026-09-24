// supabase/functions/guest-contract-events/index.ts
//
// Read-side counterpart to log-event: lets a guest Hirer retrieve the evidence
// trail for the one contract they accepted.
//
// WHY A FUNCTION AND NOT A POLICY
// A guest has no auth.users row, so RLS cannot recognise them by uid. It is
// technically possible to write a policy that reads the token out of
// current_setting('request.headers'), but that returns whole rows, and whole
// rows are the problem: events carry hash internals, an idempotency key, a
// server timestamp, and payloads holding internal fields. Postgres column
// visibility is granted per role, not per request, so no policy can project a
// per-guest subset. Shaping the response is the requirement, so the shaping has
// to happen somewhere that runs per request. A SECURITY DEFINER rpc could also
// do it, but it would put the token in a request body Postgres logs, and would
// mean granting anon EXECUTE on a definer function — the exact pattern just
// cleaned up elsewhere in this schema.
//
// THE REQUEST CARRIES NOTHING
// There is no contract id in the body, because there is nothing to spoof if the
// server never reads one. The guest_access_token is looked up directly against
// contracts.guest_access_token (unique index), and the contract it resolves to
// IS the contract. Body-based spoofing is not defended against; it is
// structurally impossible.
//
// Deploy:
//   npx supabase functions deploy guest-contract-events

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-access-token',
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

const GENESIS_HASH = 'GENESIS'
const MAX_EVENTS = 500

// Payload keys a guest may see, per event type. Everything else is dropped.
//
// An allowlist rather than a denylist: payloads are free-form jsonb written
// over two trust models, so the set of keys that could appear is open-ended and
// a denylist would silently leak whatever gets added next. Notable exclusions:
//   _actor_role — internal; surfaced as actor.role instead
//   user_agent  — the accepting browser's UA, recorded by legacy consent rows
const PAYLOAD_ALLOWLIST: Record<string, string[]> = {
  'contract.initiated':    ['step', 'title', 'budgetPoints'],
  'contract.accepted':     ['step'],
  'work.submitted':        ['step'],
  'work.approved':         ['step'],
  'work.rejected':         ['step', 'reason'],
  'contract.cancelled':    ['reason'],
  'contract.completed':    [],
  'dod.consent_recorded':  ['counterparty_name', 'counterparty_email', 'dod_items'],
  'dispute.opened':        ['reason'],
  'rating.submitted':      ['rating'],
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * The timestamp exactly as it was hashed at write time.
 *
 * Events are hashed over `new Date().toISOString()`, which renders as
 * 2026-09-24T12:52:40.016Z. PostgREST returns the same instant as
 * 2026-09-24T12:52:40.016+00:00. Hashing the value as read therefore produces
 * a different digest from the one stored, and every row looks tampered with.
 * Re-normalising through Date restores the written form.
 */
function canonicalTimestamp(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}

function filterPayload(type: string, payload: unknown): Record<string, unknown> {
  const allowed = PAYLOAD_ALLOWLIST[type]
  // An unknown type gets an empty payload rather than a pass-through: a type
  // this function has not been taught about is one whose payload shape nobody
  // has reviewed.
  if (!allowed || typeof payload !== 'object' || payload === null) return {}
  const source = payload as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in source) out[key] = source[key]
  }
  return out
}

/**
 * Describe who acted, without making the reader look up an opaque id.
 *
 * actor_id is kept: it is part of the hashed canonical, so removing it would
 * make the chain impossible for the guest to re-verify independently, and
 * independent verifiability is the point of the trail. It is an opaque random
 * uuid for the Earner — not an email, a name or a credential — so exposing it
 * to their counterparty costs little next to what redacting it would break.
 */
function describeActor(
  actorId: string | null,
  contract: Record<string, unknown>,
  actorRole: string | null,
) {
  if (!actorId) return { id: null, role: 'unknown', label: 'Unknown' }

  if (actorId === contract.earner_user_id) {
    return {
      id: actorId,
      role: 'earner',
      label: (contract.earner_display_name as string | null) ?? 'The other party',
    }
  }
  if (actorId.startsWith('guest:')) {
    return { id: actorId, role: 'guest_hirer', label: actorId.slice('guest:'.length) }
  }
  // Legacy rows: actor_id was whatever the browser supplied ('user', an email,
  // a display name). It identifies nobody reliably.
  return { id: actorId, role: actorRole ?? 'unknown', label: 'Unverified actor' }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const guestToken = req.headers.get('x-guest-access-token')
    if (!guestToken) return json({ error: 'missing_guest_token' }, 401)

    // A malformed token is rejected before it reaches the database, so a
    // non-uuid string cannot produce a cast error that distinguishes itself
    // from a miss.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guestToken)) {
      return json({ error: 'invalid_guest_token' }, 403)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // The token IS the contract identity. Nothing in the request selects it.
    const { data: contract, error: contractError } = await admin
      .from('contracts')
      .select('id, project_name, dod, amount_jpy, currency, deadline, state, '
        + 'earner_user_id, earner_display_name, hirer_email, guest_access_token_expires_at')
      .eq('guest_access_token', guestToken)
      .maybeSingle()

    if (contractError) return json({ error: 'lookup_failed' }, 500)
    // Same response for "no such token" and "malformed token": a caller learns
    // nothing about which tokens exist.
    if (!contract) return json({ error: 'invalid_guest_token' }, 403)

    if (!contract.guest_access_token_expires_at
      || new Date(contract.guest_access_token_expires_at) < new Date()) {
      return json({ error: 'guest_token_expired' }, 403)
    }

    // Scoped to this contract by its id. runtime.snapshot rows carry
    // contract_id 'runtime' and legacy demo rows carry marketplace fixture ids
    // ('1', 'mock'), so neither can match a real contract's uuid — but the
    // snapshot type is excluded explicitly as well, because "it cannot happen"
    // is a weaker guarantee than "it is not selected".
    const { data: rows, error: eventsError } = await admin
      .from('events')
      .select('id, type, actor_id, payload, dod_hash, created_at, event_hash, prev_event_hash, hash_version')
      .eq('contract_id', contract.id)
      .neq('type', 'runtime.snapshot')
      .order('created_at', { ascending: true })
      .limit(MAX_EVENTS)

    if (eventsError) return json({ error: 'events_lookup_failed' }, 500)

    let expectedPrev = GENESIS_HASH
    const events = []

    for (const row of rows ?? []) {
      // Two canonical formats exist; a row must be verified under the one it
      // was written with. Rows with no hash_version predate the column and are
      // v1, which hashed the event's own fields with no prev_hash.
      const hashVersion = row.hash_version ?? (row.prev_event_hash ? 2 : 1)
      const base = {
        id:          row.id,
        type:        row.type,
        contract_id: contract.id,
        actor_id:    row.actor_id,
        dod_hash:    row.dod_hash ?? null,
        created_at:  canonicalTimestamp(row.created_at),
      }
      const canonical = hashVersion >= 2
        ? JSON.stringify({ ...base, prev_hash: row.prev_event_hash ?? GENESIS_HASH })
        : JSON.stringify(base)
      const recomputed = await sha256(canonical)

      const actorRole = (row.payload as Record<string, unknown> | null)?._actor_role as string | null

      events.push({
        id:         row.id,
        type:       row.type,
        created_at: row.created_at,
        actor:      describeActor(row.actor_id, contract, actorRole ?? null),
        dod_hash:   row.dod_hash ?? null,
        payload:    filterPayload(row.type, row.payload),
        integrity: {
          // v1 rows were written by a browser that chose its own actor_id,
          // type and hash. They are preserved as history, not as attestation.
          trust_model:     hashVersion >= 2 ? 'server_attested' : 'client_asserted',
          event_hash:      row.event_hash ?? null,
          prev_event_hash: row.prev_event_hash ?? null,
          hash_valid:      row.event_hash ? row.event_hash === recomputed : null,
          chain_linked:    row.prev_event_hash ? row.prev_event_hash === expectedPrev : null,
        },
      })

      // Advance regardless of match, so a break also surfaces on the next
      // event rather than silently resetting the expected chain.
      expectedPrev = row.event_hash ?? expectedPrev
    }

    const attested = events.filter(e => e.integrity.trust_model === 'server_attested')

    return json({
      contract: {
        id:                  contract.id,
        project_name:        contract.project_name,
        dod:                 contract.dod,
        amount_jpy:          contract.amount_jpy,
        currency:            contract.currency,
        deadline:            contract.deadline,
        state:               contract.state,
        earner_display_name: contract.earner_display_name,
        // The address that accepted — this guest's own, echoed back so the
        // trail is self-describing in an export.
        hirer_email:         contract.hirer_email,
      },
      events,
      chain: {
        event_count:          events.length,
        server_attested:      attested.length,
        client_asserted:      events.length - attested.length,
        // True only if every row that carries the material to be checked
        // checks out. Rows with nothing to verify do not count as verified.
        verified: attested.length > 0
          && attested.every(e => e.integrity.hash_valid !== false && e.integrity.chain_linked !== false),
        truncated: (rows?.length ?? 0) >= MAX_EVENTS,
        // Stated in the response rather than left for a reader to discover:
        // the canonical that produces event_hash covers id, type, contract_id,
        // actor_id, dod_hash, created_at and prev_hash. It does NOT cover
        // payload, so payload contents are not tamper-evident.
        payload_covered_by_hash: false,
      },
    }, 200)

  } catch (err) {
    return json({ error: 'internal_error', detail: String(err) }, 500)
  }
})
