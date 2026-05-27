import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  generateInviteToken,
  decodeInviteTokenUnsafe,
  validateInviteToken,
  INVITE_EXPIRY_MS,
} from '../../src/lib/invite.js'

const SAMPLE = {
  cid: 'contract-abc-123',
  inviter: 'Alice',
  project: 'UI Redesign',
  amount: 150000,
  dod: ['Deliver Figma file', 'Include dark mode'],
}

afterEach(() => {
  vi.useRealTimers()
})

// ── INVITE_EXPIRY_MS ──────────────────────────────────────────────────────────

describe('INVITE_EXPIRY_MS', () => {
  it('is exactly 72 hours in milliseconds', () => {
    expect(INVITE_EXPIRY_MS).toBe(72 * 60 * 60 * 1000)
  })
})

// ── generateInviteToken ───────────────────────────────────────────────────────

describe('generateInviteToken', () => {
  it('returns a string with exactly one dot separator', async () => {
    const token = await generateInviteToken(SAMPLE)
    const parts = token.split('.')
    expect(parts).toHaveLength(2)
    expect(parts[0].length).toBeGreaterThan(0)
    expect(parts[1].length).toBeGreaterThan(0)
  })

  it('contains all payload fields', async () => {
    const token = await generateInviteToken(SAMPLE)
    const payload = decodeInviteTokenUnsafe(token)
    expect(payload.cid).toBe(SAMPLE.cid)
    expect(payload.inviter).toBe(SAMPLE.inviter)
    expect(payload.project).toBe(SAMPLE.project)
    expect(payload.amount).toBe(SAMPLE.amount)
    expect(payload.dod).toEqual(SAMPLE.dod)
  })

  it('embeds an exp claim approximately 72 hours in the future', async () => {
    const before = Date.now()
    const token = await generateInviteToken(SAMPLE)
    const after = Date.now()
    const { exp } = decodeInviteTokenUnsafe(token)
    expect(exp).toBeGreaterThanOrEqual(before + INVITE_EXPIRY_MS)
    expect(exp).toBeLessThanOrEqual(after + INVITE_EXPIRY_MS)
  })

  it('produces different signatures for different inputs', async () => {
    const t1 = await generateInviteToken({ ...SAMPLE, cid: 'cid-A' })
    const t2 = await generateInviteToken({ ...SAMPLE, cid: 'cid-B' })
    expect(t1).not.toBe(t2)
  })
})

// ── decodeInviteTokenUnsafe ───────────────────────────────────────────────────

describe('decodeInviteTokenUnsafe', () => {
  it('decodes a valid token without verifying signature', async () => {
    const token = await generateInviteToken(SAMPLE)
    const payload = decodeInviteTokenUnsafe(token)
    expect(payload).not.toBeNull()
    expect(payload.cid).toBe(SAMPLE.cid)
  })

  it('decodes a tampered token (no signature check)', async () => {
    const token = await generateInviteToken(SAMPLE)
    const [b64] = token.split('.')
    const tamperedToken = `${b64}.fakesignature`
    const payload = decodeInviteTokenUnsafe(tamperedToken)
    // still decodes because no verification
    expect(payload).not.toBeNull()
    expect(payload.cid).toBe(SAMPLE.cid)
  })

  it('returns null for a completely garbled string', () => {
    expect(decodeInviteTokenUnsafe('not-a-token')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(decodeInviteTokenUnsafe('')).toBeNull()
  })

  it('returns null for a dot-only string with invalid base64', () => {
    expect(decodeInviteTokenUnsafe('!!!.!!!')).toBeNull()
  })
})

// ── validateInviteToken ───────────────────────────────────────────────────────

describe('validateInviteToken', () => {
  it('returns valid=true and data for a fresh token', async () => {
    const token = await generateInviteToken(SAMPLE)
    const result = await validateInviteToken(token)
    expect(result.valid).toBe(true)
    expect(result.data.cid).toBe(SAMPLE.cid)
    expect(result.data.project).toBe(SAMPLE.project)
    expect(result.reason).toBeUndefined()
  })

  it('returns valid=false reason=expired for a past-expiry token', async () => {
    // Generate token at T=0, then jump time past expiry
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const token = await generateInviteToken(SAMPLE)
    // advance 73 hours (beyond 72h expiry)
    vi.setSystemTime(new Date('2026-01-04T01:00:00Z'))
    const result = await validateInviteToken(token)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('expired')
  })

  it('returns valid=false reason=tampered when signature is corrupted', async () => {
    const token = await generateInviteToken(SAMPLE)
    const [b64] = token.split('.')
    const tampered = `${b64}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`
    const result = await validateInviteToken(tampered)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('tampered')
  })

  it('returns valid=false reason=tampered when payload is modified', async () => {
    const token = await generateInviteToken(SAMPLE)
    const [, sig] = token.split('.')
    // encode a modified payload and reuse the original signature
    const fakePayload = btoa(JSON.stringify({ ...SAMPLE, amount: 999999999, exp: Date.now() + INVITE_EXPIRY_MS }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const tampered = `${fakePayload}.${sig}`
    const result = await validateInviteToken(tampered)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('tampered')
  })

  it('returns valid=false reason=malformed for a token without a dot', async () => {
    const result = await validateInviteToken('nodothere')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('malformed')
  })

  it('returns valid=false reason=malformed for an empty string', async () => {
    const result = await validateInviteToken('')
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('malformed')
  })

  it('returns valid=false reason=invalid for unparseable base64', async () => {
    const result = await validateInviteToken('!!!notvalid!!!.!!!')
    expect(result.valid).toBe(false)
    // reason is either 'invalid' or 'tampered' depending on where it throws
    expect(['invalid', 'tampered']).toContain(result.reason)
  })

  it('token is still valid 1 minute before expiry', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const token = await generateInviteToken(SAMPLE)
    // advance to 1 minute before expiry (71h 59min)
    vi.setSystemTime(new Date('2026-01-03T23:59:00Z'))
    const result = await validateInviteToken(token)
    expect(result.valid).toBe(true)
  })
})
