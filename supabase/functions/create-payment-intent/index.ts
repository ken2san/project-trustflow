// supabase/functions/create-payment-intent/index.ts
//
// Creates a Stripe PaymentIntent for a TrustFlow contract.
// Funds are captured immediately and held in the platform's Stripe Connect
// balance until `capture-payment` releases them to the Earner.
//
// Called by the frontend when both parties have confirmed the contract (LOCKED state).
//
// Environment variables required (set in Supabase dashboard → Edge Functions):
//   STRIPE_SECRET_KEY      — Stripe secret key (sk_live_... or sk_test_...)
//   STRIPE_WEBHOOK_SECRET  — for webhook signature verification (not used here)
//
// Deploy:
//   npx supabase functions deploy create-payment-intent

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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify caller is authenticated
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

    const { contractId, amountJpy, description, earnerEmail } = await req.json()

    if (!contractId || !amountJpy || amountJpy < 50 || amountJpy > 10_000_000) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the calling user owns this contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, created_by, state')
      .eq('id', contractId)
      .single()

    if (contractError || !contract) {
      return new Response(JSON.stringify({ error: 'Contract not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (contract.created_by !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (contract.state !== 'LOCKED') {
      return new Response(JSON.stringify({ error: `Cannot charge in state: ${contract.state}` }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Stripe PaymentIntent
    // capture_method: 'automatic' — charges immediately, funds held in platform balance
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountJpy,        // Stripe uses smallest currency unit (JPY is already integer)
      currency: 'jpy',
      description: description ?? `TrustFlow contract ${contractId}`,
      metadata: {
        contract_id: contractId,
        hirer_id: user.id,
        earner_email: earnerEmail ?? '',
      },
      // Platform holds funds until explicit transfer to earner
      transfer_group: contractId,
    })

    // Store the PaymentIntent ID on the contract
    await supabase
      .from('contracts')
      .update({ stripe_payment_intent_id: paymentIntent.id, state: 'IN_PROGRESS' })
      .eq('id', contractId)

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[create-payment-intent]', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
