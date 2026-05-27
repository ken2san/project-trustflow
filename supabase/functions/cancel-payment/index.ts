// supabase/functions/cancel-payment/index.ts
//
// Refunds the Hirer if a contract is cancelled before the Earner is paid.
// Called when both parties mutually cancel, or when a dispute is resolved in the Hirer's favor.
//
// Deploy:
//   npx supabase functions deploy cancel-payment

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'npm:stripe@^14'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// TrustPoints penalty for cancellation
const TP_CANCELLATION_PENALTY = -30

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { contractId, reason = 'mutual_cancellation' } = await req.json()

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

    // Must be a party to the contract
    if (contract.created_by !== user.id && contract.counterparty_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const cancellableStates = ['LOCKED', 'IN_PROGRESS', 'DELIVERED']
    if (!cancellableStates.includes(contract.state)) {
      return new Response(JSON.stringify({ error: `Cannot cancel in state: ${contract.state}` }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let refundId: string | null = null

    // Refund if payment was already collected
    if (contract.stripe_payment_intent_id) {
      const refund = await stripe.refunds.create({
        payment_intent: contract.stripe_payment_intent_id,
        metadata: { contract_id: contractId, reason },
      })
      refundId = refund.id
    }

    // Update contract
    await supabase
      .from('contracts')
      .update({ state: 'CANCELLED', stripe_refund_id: refundId })
      .eq('id', contractId)

    // TrustPoints penalty to both parties for cancellation (mutual deterrent)
    const penaltyTargets = [contract.created_by, contract.counterparty_id].filter(Boolean)
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
