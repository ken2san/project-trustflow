import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { invite_token, hirer_email } = await req.json()
    if (!invite_token || typeof invite_token !== 'string') {
      return new Response(JSON.stringify({ error: 'missing invite_token' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    // Use service role to bypass RLS for token lookup
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: contract, error } = await supabase
      .from('contracts')
      .select('id, project_name, dod, amount_jpy, created_by, invite_token_expires_at, invite_token_used_at')
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

    // Mark token as used and optionally capture hirer email
    const update: Record<string, unknown> = { invite_token_used_at: new Date().toISOString() }
    if (hirer_email && typeof hirer_email === 'string') {
      update.hirer_email = hirer_email.trim().slice(0, 254)
    }

    const { error: updateError } = await supabase
      .from('contracts')
      .update(update)
      .eq('id', contract.id)

    if (updateError) {
      return new Response(JSON.stringify({ error: 'update_failed' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      contract_id: contract.id,
      project_name: contract.project_name,
      dod: contract.dod,
      amount_jpy: contract.amount_jpy,
    }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'internal_error', detail: String(err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
