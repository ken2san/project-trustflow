// ⚠️ NOT DEPLOYED, ON PURPOSE. Deleted from the Supabase project 2026-09-26.
//
// Kept in source control so the work is not lost, not because it is live. Do not
// run `supabase functions deploy` on it without reading why it was removed.
//
// UNREACHABLE. Its only caller is src/lib/tsa.js, which is imported by nothing at
// all. auditExport.js states outright that no event in this system carries a TSA
// token.
//
// AND STILL ABUSABLE WHILE DEPLOYED. An Edge Function is a public HTTPS endpoint
// whether or not src/ calls it, and the anon key that authorizes it ships inside
// the frontend bundle. This is an RFC 3161 signing proxy, so while live it was
// free timestamping for any caller. The version that was live also only
// length-checked hashHex, so invalid hex became zero bytes and still came back
// with a real signed token.
//
// The source below is the CORRECTED version; what was live was the pre-fix
// source. That is what made deletion the right answer rather than a deploy. If
// this is ever brought back, deploy THIS file, then confirm the deployed source
// by downloading it back and diffing it — an `updated_at` change can be a
// secrets re-bundle rather than a deploy.

// supabase/functions/timestamp-event/index.ts
// Supabase Edge Function — RFC 3161 TSA proxy for production use.
// Runs on Deno runtime — Node.js TypeScript errors here are expected and harmless.
// @ts-nocheck
//
// Browser → TSA direct calls are CORS-blocked.
// This Edge Function acts as a server-side proxy: receives a hashHex,
// calls FreeTSA, and returns the base64-encoded timestamp token.
//
// Deploy:
//   npx supabase functions deploy timestamp-event
//
// Invoke from client (replaces direct requestTimestamp() call):
//   const { data } = await supabase.functions.invoke('timestamp-event', {
//     body: { hashHex: '<64-char hex>' }
//   })
//   const tsaToken = data?.token ?? null

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const TSA_URL = 'https://freetsa.org/tsr'
const HASH_HEX_RE = /^[0-9a-f]{64}$/i

// ── DER encoding (Deno — same logic as src/lib/tsa.js) ──────────────────────

function derLenBytes(len: number): Uint8Array {
  if (len < 128) return new Uint8Array([len])
  if (len < 256) return new Uint8Array([0x81, len])
  return new Uint8Array([0x82, (len >> 8) & 0xff, len & 0xff])
}

function derTLV(tag: number, content: Uint8Array): Uint8Array {
  const lb = derLenBytes(content.length)
  const out = new Uint8Array(1 + lb.length + content.length)
  out[0] = tag; out.set(lb, 1); out.set(content, 1 + lb.length)
  return out
}

function derSeq(c: Uint8Array) { return derTLV(0x30, c) }

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0; for (const p of parts) { out.set(p, off); off += p.length }
  return out
}

function hexToBytes(hex: string): Uint8Array {
  const b = new Uint8Array(hex.length / 2)
  for (let i = 0; i < b.length; i++) b[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return b
}

function buildTimeStampReq(hashHex: string): Uint8Array {
  const version = new Uint8Array([0x02, 0x01, 0x01])
  const oidBytes = new Uint8Array([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01])
  const algId = derSeq(concat(derTLV(0x06, oidBytes), new Uint8Array([0x05, 0x00])))
  const messageImprint = derSeq(concat(algId, derTLV(0x04, hexToBytes(hashHex))))
  const certReq = new Uint8Array([0x01, 0x01, 0xff])
  return derSeq(concat(version, messageImprint, certReq))
}

// ── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } })
  }

  try {
    const { hashHex } = await req.json()
    if (!hashHex || !HASH_HEX_RE.test(hashHex)) {
      return new Response(JSON.stringify({ error: 'hashHex must be a 64-char hex-encoded SHA-256 digest' }), { status: 400 })
    }

    const tsaResp = await fetch(TSA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/timestamp-query' },
      body: buildTimeStampReq(hashHex),
    })

    if (!tsaResp.ok) {
      return new Response(JSON.stringify({ error: `TSA responded ${tsaResp.status}` }), { status: 502 })
    }

    const buf = await tsaResp.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let bin = ''; for (const b of bytes) bin += String.fromCharCode(b)
    const token = btoa(bin)

    return new Response(JSON.stringify({ token }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
