// supabase/functions/validate-invite-token/index.ts
//
// Two-step guest invite flow:
//   1. preview (default): read-only. Validates the token (not used, not expired)
//      and returns the contract summary for InviteView's read-only review stage.
//      Does NOT consume the token and does NOT require an email yet.
//   2. accept (accept: true): the Hirer's explicit "I Agree" step. Requires a
//      valid hirer_email, re-validates the token, marks invite_token_used_at
//      (one-time use, per spec — the token becomes invalid right after this),
//      transitions the contract to TERMS_ACCEPTED, and issues a
//      guest_access_token that authorizes the guest Hirer's later actions
//      (pay, confirm delivery, cancel) since the invite_token itself is now spent.
//
// Deploy:
//   npx supabase functions deploy validate-invite-token

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Guest access token validity — generous, covers a typical contract's lifetime.
const GUEST_ACCESS_TOKEN_TTL_DAYS = 90

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { invite_token, accept, hirer_email } = await req.json()
    if (!invite_token || typeof invite_token !== 'string') {
      return new Response(JSON.stringify({ error: 'missing invite_token' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (accept) {
      if (typeof hirer_email !== 'string' || !EMAIL_RE.test(hirer_email.trim())) {
        return new Response(JSON.stringify({ error: 'valid hirer_email required' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }
    }

    // Use service role to bypass RLS for token lookup — guests have no auth.users row.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: contract, error } = await supabase
      .from('contracts')
      .select('id, project_name, dod, amount_jpy, currency, deadline, performed_by, earner_display_name, invited_hirer_email, earner_user_id, invite_token_expires_at, invite_token_used_at')
      .eq('invite_token', invite_token)
      .single()

    if (error || !contract) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (contract.invite_token_used_at) {
      return new Response(JSON.stringify({ error: 'already_used' }), {
        status: 410, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (contract.invite_token_expires_at && new Date(contract.invite_token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'expired' }), {
        status: 410, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (!accept) {
      // Read-only preview — token stays valid/unused.
      // Everything here comes from the contract row. The URL carries only the
      // token, never the terms, so a tampered URL cannot change what the
      // Hirer is shown.
      return new Response(JSON.stringify({
        contract_id: contract.id,
        project_name: contract.project_name,
        dod: contract.dod,
        amount_jpy: contract.amount_jpy,
        currency: contract.currency,
        deadline: contract.deadline,
        earner_display_name: contract.earner_display_name,
        invited_hirer_email: contract.invited_hirer_email,
        // Which side does the work. It is bound into the agreement snapshot at
        // acceptance, so it has to be on screen before anyone agrees —
        // attesting consent to a term nobody was shown would be dishonest.
        performed_by: contract.performed_by,
      }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Accept: consume the token, capture identity, issue the guest session credential.
    const guestAccessToken = crypto.randomUUID()
    const guestAccessTokenExpiresAt = new Date(
      Date.now() + GUEST_ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { data: updated, error: updateError } = await supabase
      .from('contracts')
      .update({
        invite_token_used_at: new Date().toISOString(),
        hirer_email: hirer_email.trim().slice(0, 254),
        guest_access_token: guestAccessToken,
        guest_access_token_expires_at: guestAccessTokenExpiresAt,
        state: 'TERMS_ACCEPTED',
      })
      .eq('id', contract.id)
      .is('invite_token_used_at', null) // re-check: guards against a concurrent double-accept
      .select('id')

    if (updateError) {
      return new Response(JSON.stringify({ error: 'update_failed' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    if (!updated || updated.length === 0) {
      // Lost the race — another request consumed the token between our read and this write.
      return new Response(JSON.stringify({ error: 'already_used' }), {
        status: 410, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      contract_id: contract.id,
      project_name: contract.project_name,
      dod: contract.dod,
      amount_jpy: contract.amount_jpy,
      deadline: contract.deadline,
      earner_display_name: contract.earner_display_name,
      guest_access_token: guestAccessToken,
    }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'internal_error', detail: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
