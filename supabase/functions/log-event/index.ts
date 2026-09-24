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

// Sentinel prev_hash for a contract's first event. Must match
// GENESIS_HASH in src/lib/eventLog.js.
const GENESIS_HASH = 'GENESIS'

// The canonical format this function writes. v1 (no prev_hash field) is the
// pre-20260921000004 format and is never produced here, only verified.
const HASH_VERSION = 2

// Types a party may record about their own contract. Deliberately excludes
// runtime.snapshot (application state, now in runtime_snapshots) and every
// type whose truth is decided by the payment processor rather than by a
// party's assertion — payment.*, trustpoints.* and the dispute verdicts are
// written by capture-payment / cancel-payment with the service role, or by a
// future arbitration path, and must not be assertable from a browser.
const ALLOWED_TYPES = new Set([
  'contract.initiated',
  'contract.accepted',
  'work.submitted',
  'work.approved',
  'work.rejected',
  'contract.cancelled',
  'contract.completed',
  'dod.consent_recorded',
  'dispute.opened',
  'rating.submitted',
])

const MAX_PAYLOAD_BYTES = 16 * 1024
const MAX_CHAIN_RETRIES = 5

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return json({ error: 'invalid_body' }, 400)
    }

    const { type, contract_id, payload, dod_hash, idempotency_key } = body as Record<string, unknown>

    if (typeof type !== 'string' || !ALLOWED_TYPES.has(type)) {
      return json({ error: 'type_not_allowed' }, 400)
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
    if (dod_hash !== undefined && dod_hash !== null && typeof dod_hash !== 'string') {
      return json({ error: 'invalid_dod_hash' }, 400)
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
      .select('id, earner_user_id, hirer_email, guest_access_token, guest_access_token_expires_at')
      .eq('id', contract_id)
      .maybeSingle()

    if (contractError) return json({ error: 'lookup_failed' }, 500)
    if (!contract) return json({ error: 'contract_not_found' }, 404)

    const actor = await resolveActor(req, admin, contract)
    if (!actor) return json({ error: 'not_a_party' }, 403)

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

      const event = {
        id: crypto.randomUUID(),
        type,
        contract_id,
        actor_id: actor.actorId,
        dod_hash: (dod_hash as string | null) ?? null,
        created_at: new Date().toISOString(),
      }

      // Byte-identical to the canonical in src/lib/eventLog.js — key order
      // included. The chain format is unchanged by moving computation here.
      const canonical = JSON.stringify({
        id:          event.id,
        type:        event.type,
        contract_id: event.contract_id,
        actor_id:    event.actor_id,
        dod_hash:    event.dod_hash,
        created_at:  event.created_at,
        prev_hash:   prevHash,
      })
      const eventHash = await sha256(canonical)

      const { data: inserted, error: insertError } = await admin
        .from('events')
        .insert({
          ...event,
          payload: {
            ...(payload as Record<string, unknown> ?? {}),
            // Recorded, not accepted: how the writer was authenticated.
            _actor_role: actor.role,
          },
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
