// supabase/functions/send-acceptance-email/index.ts
//
// Sends the Hirer a DoD acceptance confirmation email after a contract is SETTLED.
// The email captures: project name, DoD items, DoD hash, amount, timestamp, and
// contract ID — serving as chargeback/dispute evidence in Stripe.
//
// Gracefully skips (logs warning, returns 200) if RESEND_API_KEY is not set.
//
// Environment variables required:
//   RESEND_API_KEY        — Resend API key (https://resend.com)
//   EMAIL_FROM            — optional sender override (default: TrustFlow <noreply@trustflow.app>)
//
// Deploy:
//   npx supabase functions deploy send-acceptance-email

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
  hirer_email: string
  project_name: string
  dod: string[]
  dod_hash: string
  amount_jpy: number
  contract_id: string
  settled_at: string // ISO 8601
}

function buildHtml(p: EmailPayload): string {
  const dodRows = p.dod
    .map((item, i) => `<li style="margin:6px 0">${i + 1}. ${escHtml(item)}</li>`)
    .join('')

  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(p.amount_jpy)

  const formattedDate = new Date(p.settled_at).toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'long',
    timeStyle: 'short',
  }) + ' UTC'

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>DoD Confirmation</title></head>
<body style="font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7">

    <div style="background:#09090b;padding:24px 32px">
      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px">TrustFlow</span>
      <span style="color:#71717a;font-size:13px;margin-left:12px">Agreement Confirmation</span>
    </div>

    <div style="padding:32px">
      <h1 style="font-size:18px;font-weight:600;color:#09090b;margin:0 0 4px">
        ${escHtml(p.project_name)}
      </h1>
      <p style="font-size:13px;color:#71717a;margin:0 0 24px">
        Settlement confirmed on ${formattedDate}
      </p>

      <div style="background:#f4f4f5;border-radius:6px;padding:16px 20px;margin-bottom:24px">
        <div style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Contract Value</div>
        <div style="font-size:28px;font-weight:700;color:#09090b">${escHtml(formattedAmount)}</div>
      </div>

      <h2 style="font-size:14px;font-weight:600;color:#09090b;margin:0 0 12px">
        Definition of Done
      </h2>
      <ul style="margin:0 0 24px;padding-left:20px;color:#3f3f46;font-size:14px;line-height:1.6">
        ${dodRows}
      </ul>

      <div style="border-top:1px solid #e4e4e7;padding-top:20px;margin-top:4px">
        <div style="font-size:12px;color:#71717a;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">
          Verification Fingerprints
        </div>
        <table style="width:100%;font-size:12px;color:#52525b;border-collapse:collapse">
          <tr>
            <td style="padding:4px 0;width:110px;font-weight:500;color:#3f3f46">Contract ID</td>
            <td style="padding:4px 0;font-family:monospace;word-break:break-all">${escHtml(p.contract_id)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-weight:500;color:#3f3f46">DoD Hash</td>
            <td style="padding:4px 0;font-family:monospace;word-break:break-all">${escHtml(p.dod_hash)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div style="background:#f4f4f5;padding:16px 32px;font-size:12px;color:#71717a;line-height:1.5">
      This email confirms the Definition of Done agreed by both parties before payment was released.
      The DoD hash above can be used to independently verify the contents of this agreement have not been altered.
      Keep this email as evidence in the event of a payment dispute.
    </div>

  </div>
</body>
</html>`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    console.warn('[send-acceptance-email] RESEND_API_KEY not set — skipping email')
    return new Response(JSON.stringify({ skipped: true, reason: 'no_api_key' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload: EmailPayload = await req.json()
    const { hirer_email, project_name, dod, dod_hash, amount_jpy, contract_id, settled_at } = payload

    if (!hirer_email || !project_name || !dod_hash || !contract_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const from = Deno.env.get('EMAIL_FROM') ?? 'TrustFlow <noreply@trustflow.app>'
    const subject = `Agreement Confirmed: ${project_name}`
    const html = buildHtml(payload)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [hirer_email], subject, html }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[send-acceptance-email] Resend error', res.status, body)
      return new Response(JSON.stringify({ error: 'Email delivery failed', detail: body }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { id: emailId } = await res.json()
    console.log('[send-acceptance-email] sent', emailId, 'to', hirer_email)

    return new Response(JSON.stringify({ sent: true, emailId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[send-acceptance-email]', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
