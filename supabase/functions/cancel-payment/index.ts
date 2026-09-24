// supabase/functions/cancel-payment/index.ts
//
// Refunds the Hirer if a contract is cancelled before the Earner is paid.
// Called when both parties mutually cancel, or when a dispute is resolved in
// the Hirer's favor. Either party may call this — guest Hirer via
// X-Guest-Access-Token, or Earner/registered Hirer via Supabase Auth.
// See _shared/partyAuth.ts.
//
// NOTE: cancellation penalty is still a flat, unconditional TrustPoints
// deduction to both parties (fault-based attribution is a separate later
// phase — see Roadmap.md). This function only fixes the role-field
// references, adds guest auth, and adds idempotency against double-refund.
//
// Deploy:
//   npx supabase functions deploy cancel-payment

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@^14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authorizeParty } from '../_shared/partyAuth.ts'
import { TP_CANCELLATION_PENALTY } from '../_shared/trustpointsRules.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-guest-access-token',
}

// 'DELIVERED' is retained because historical rows could in principle hold it,
// though nothing ever wrote it. The two projected states replace it: a contract
// awaiting confirmation, or one already confirmed but not yet settled, must
// still be cancellable — otherwise asserting performance would trap the
// agreement with no way out for either party.
const CANCELLABLE_STATES = [
  'TERMS_ACCEPTED', 'IN_PROGRESS', 'DELIVERED',
  'AWAITING_CONFIRMATION', 'PERFORMANCE_ACCEPTED',
]

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { contractId, reason = 'mutual_cancellation' } = await req.json()

    if (!contractId) {
      return new Response(JSON.stringify({ error: 'contractId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single()

    if (contractError || !contract) {
      return new Response(JSON.stringify({ error: 'Contract not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Must be a party to the contract — Earner or Hirer (guest included).
    const party = await authorizeParty(req, supabase, contract)
    if (!party) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!CANCELLABLE_STATES.includes(contract.state)) {
      return new Response(JSON.stringify({ error: `Cannot cancel in state: ${contract.state}` }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Idempotency: claim the cancellation before touching Stripe, so a
    // concurrent duplicate call can't double-refund.
    const { data: claimed, error: claimError } = await supabase
      .from('contracts')
      .update({ state: 'CANCELLED' })
      .eq('id', contractId)
      .in('state', CANCELLABLE_STATES)
      .select('id')

    if (claimError || !claimed || claimed.length === 0) {
      return new Response(JSON.stringify({ error: 'Cancellation already in progress or completed' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let refundId: string | null = null

    // Refund if payment was already collected
    if (contract.stripe_payment_intent_id) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: contract.stripe_payment_intent_id,
          metadata: { contract_id: contractId, reason },
        })
        refundId = refund.id
      } catch (refundErr) {
        // Roll back the claim so a retry is possible.
        await supabase.from('contracts').update({ state: contract.state }).eq('id', contractId)
        throw refundErr
      }
    }

    await supabase
      .from('contracts')
      .update({ stripe_refund_id: refundId })
      .eq('id', contractId)

    // TrustPoints penalty to both parties for cancellation (mutual deterrent —
    // fault attribution not yet implemented, see note above).
    const penaltyTargets = [contract.earner_user_id, contract.hirer_user_id].filter(Boolean)
    for (const uid of penaltyTargets) {
      await supabase.from('trustpoints_ledger').insert({
        user_id: uid,
        delta: TP_CANCELLATION_PENALTY,
        reason: `Contract cancelled (${reason})`,
        reason_code: 'CONTRACT_CANCELLED',
        contract_id: contractId,
      })
    }

    return new Response(
      JSON.stringify({ success: true, refundId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[cancel-payment]', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
