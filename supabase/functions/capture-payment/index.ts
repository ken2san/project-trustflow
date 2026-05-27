// supabase/functions/capture-payment/index.ts
//
// Releases escrowed funds to the Earner's Stripe Connected Account.
// Called when TrustFlow confirms the contract is SETTLED (DoD verified / both parties confirmed).
//
// Flow:
//   1. Verify contract is in DELIVERED or SETTLED state
//   2. Retrieve the Stripe PaymentIntent
//   3. Create a Stripe Transfer to the Earner's Connected Account
//   4. Update contract state → SETTLED, store transfer ID
//   5. Award TrustPoints to both parties (server-side)
//
// Environment variables required:
//   STRIPE_SECRET_KEY
//
// Deploy:
//   npx supabase functions deploy capture-payment

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

// TrustPoints awarded on successful completion
const TP_CONTRACT_COMPLETED = 50
const TP_ON_TIME_BONUS = 20

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

    const { contractId, earnerStripeAccountId } = await req.json()

    if (!contractId) {
      return new Response(JSON.stringify({ error: 'contractId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load contract
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

    // Only the Hirer (created_by) or platform admin can trigger capture
    if (contract.created_by !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!['IN_PROGRESS', 'DELIVERED'].includes(contract.state)) {
      return new Response(JSON.stringify({ error: `Cannot capture in state: ${contract.state}` }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paymentIntentId = contract.stripe_payment_intent_id
    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: 'No PaymentIntent on this contract' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Retrieve PaymentIntent to get the charge ID
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    const chargeId = pi.latest_charge as string

    // Transfer to Earner's Connected Account (if provided)
    let transferId: string | null = null
    if (earnerStripeAccountId) {
      const transfer = await stripe.transfers.create({
        amount: contract.amount_jpy,
        currency: 'jpy',
        destination: earnerStripeAccountId,
        source_transaction: chargeId,
        transfer_group: contractId,
        metadata: { contract_id: contractId },
      })
      transferId = transfer.id
    }

    // Update contract state
    await supabase
      .from('contracts')
      .update({
        state: 'SETTLED',
        stripe_transfer_id: transferId,
      })
      .eq('id', contractId)

    // Award TrustPoints to both parties
    const isOnTime = contract.deadline
      ? new Date() <= new Date(contract.deadline)
      : false

    const earnedPoints = TP_CONTRACT_COMPLETED + (isOnTime ? TP_ON_TIME_BONUS : 0)

    // Earner points
    if (contract.counterparty_id) {
      await supabase.from('trustpoints_ledger').insert({
        user_id: contract.counterparty_id,
        delta: earnedPoints,
        reason: `Contract completed${isOnTime ? ' on time' : ''}`,
        reason_code: isOnTime ? 'CONTRACT_COMPLETED_ON_TIME' : 'CONTRACT_COMPLETED',
        contract_id: contractId,
      })
    }

    // Hirer points (smaller reward for fair completion)
    await supabase.from('trustpoints_ledger').insert({
      user_id: contract.created_by,
      delta: Math.round(TP_CONTRACT_COMPLETED * 0.4),
      reason: 'Contract completed as Hirer',
      reason_code: 'CONTRACT_COMPLETED_HIRER',
      contract_id: contractId,
    })

    return new Response(
      JSON.stringify({ success: true, transferId, earnedPoints }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[capture-payment]', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
