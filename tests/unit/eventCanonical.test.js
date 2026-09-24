import { describe, it, expect } from 'vitest'
import {
  GENESIS_HASH, HASH_VERSION, stableStringify, payloadHash, deriveDodHash,
  eventCanonical, canonicalVersionOf, recomputeEventHash, canonicalTimestamp, sha256Hex,
} from '../../supabase/functions/_shared/eventCanonical.ts'

// This module is the one definition of what an attested event's hash covers,
// shared by the Edge Function that writes events and both verifiers that read
// them. The single production bug this chain has had came from two copies of
// that definition drifting apart, so these tests guard the definition itself.

const base = {
  id: '11111111-1111-4111-8111-111111111111',
  type: 'performance.asserted',
  contract_id: '22222222-2222-4222-8222-222222222222',
  actor_id: 'earner-uuid',
  dod_hash: 'terms-hash',
  created_at: '2026-09-25T10:00:00.000Z',
}

describe('stableStringify', () => {
  it('is independent of key order', () => {
    // jsonb gives no key-order guarantee, so a payload read back from Postgres
    // can be ordered differently from the one hashed at write time.
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }))
  })

  it('sorts nested keys too', () => {
    expect(stableStringify({ outer: { z: 1, a: 2 } }))
      .toBe('{"outer":{"a":2,"z":1}}')
  })

  it('preserves array order — position is meaning, unlike key order', () => {
    expect(stableStringify([3, 1, 2])).toBe('[3,1,2]')
    expect(stableStringify([1, 2, 3])).not.toBe(stableStringify([3, 2, 1]))
  })

  it('treats a dropped key and an explicit undefined identically', () => {
    expect(stableStringify({ a: 1, b: undefined })).toBe(stableStringify({ a: 1 }))
  })

  it('distinguishes null from absent', () => {
    expect(stableStringify({ a: 1, b: null })).not.toBe(stableStringify({ a: 1 }))
  })
})

describe('payloadHash', () => {
  it('is stable across key reordering', async () => {
    expect(await payloadHash({ reason: 'x', step: 1 }))
      .toBe(await payloadHash({ step: 1, reason: 'x' }))
  })

  it('changes when the substance changes', async () => {
    // The point of binding the payload: a rejection reason cannot be edited
    // after the fact without the event failing verification.
    const original = await payloadHash({ reason: 'incomplete' })
    expect(await payloadHash({ reason: 'perfectly fine' })).not.toBe(original)
  })

  it('treats a missing payload as an empty object', async () => {
    expect(await payloadHash(undefined)).toBe(await payloadHash({}))
  })
})

describe('deriveDodHash', () => {
  it('changes when the terms change — this is how a scope change becomes visible', async () => {
    const agreed = await deriveDodHash(['three logo concepts'])
    const widened = await deriveDodHash(['three logo concepts', 'and a website'])
    expect(widened).not.toBe(agreed)
  })

  it('is stable for the same terms', async () => {
    expect(await deriveDodHash(['a', 'b'])).toBe(await deriveDodHash(['a', 'b']))
  })
})

describe('canonical versions', () => {
  it('v1 omits the chain link', () => {
    const canonical = eventCanonical(base, 1)
    expect(canonical).not.toContain('prev_hash')
    expect(canonical).not.toContain('payload_hash')
  })

  it('v2 adds the chain link but not the payload', () => {
    const canonical = eventCanonical({ ...base, prev_event_hash: 'abc' }, 2)
    expect(JSON.parse(canonical)).toHaveProperty('prev_hash', 'abc')
    expect(canonical).not.toContain('payload_hash')
  })

  it('v3 binds the payload as well', () => {
    const canonical = eventCanonical({ ...base, prev_event_hash: 'abc', payload_hash: 'def' }, 3)
    const parsed = JSON.parse(canonical)
    expect(parsed).toHaveProperty('prev_hash', 'abc')
    expect(parsed).toHaveProperty('payload_hash', 'def')
  })

  it('defaults a missing chain link to the genesis sentinel', () => {
    expect(JSON.parse(eventCanonical(base, 2))).toHaveProperty('prev_hash', GENESIS_HASH)
  })

  it('writes the current version', () => {
    expect(HASH_VERSION).toBe(3)
  })

  // Regression: the canonical gained fields twice without the verifier being
  // told which rows were written under which rules, and each time every
  // untouched historical row was reported as tampered with.
  it('verifies each version under its own rules and not another', async () => {
    const v1Hash = await sha256Hex(eventCanonical(base, 1))
    const v2Hash = await sha256Hex(eventCanonical({ ...base, prev_event_hash: 'abc' }, 2))
    const v3Hash = await sha256Hex(eventCanonical({ ...base, prev_event_hash: 'abc', payload_hash: 'def' }, 3))

    expect(new Set([v1Hash, v2Hash, v3Hash]).size).toBe(3)

    expect(await recomputeEventHash({ ...base, hash_version: 1 })).toBe(v1Hash)
    expect(await recomputeEventHash({ ...base, prev_event_hash: 'abc', hash_version: 2 })).toBe(v2Hash)
    expect(await recomputeEventHash({ ...base, prev_event_hash: 'abc', payload_hash: 'def', hash_version: 3 })).toBe(v3Hash)
  })

  it('infers the version of rows written before the column existed', () => {
    expect(canonicalVersionOf({ prev_event_hash: null })).toBe(1)
    expect(canonicalVersionOf({ prev_event_hash: 'abc' })).toBe(2)
    expect(canonicalVersionOf({ hash_version: 3, prev_event_hash: 'abc' })).toBe(3)
  })
})

describe('canonicalTimestamp', () => {
  // Regression: events are hashed over toISOString() but PostgREST returns the
  // same instant with a +00:00 offset, which made every stored event verify as
  // tampered with.
  it('normalises a PostgREST offset back to the written form', () => {
    expect(canonicalTimestamp('2026-09-25T10:00:00+00:00')).toBe('2026-09-25T10:00:00.000Z')
  })

  it('leaves an unparseable value alone rather than inventing one', () => {
    expect(canonicalTimestamp('not-a-date')).toBe('not-a-date')
  })

  it('is applied inside the canonical, not just available beside it', () => {
    expect(eventCanonical({ ...base, created_at: '2026-09-25T10:00:00+00:00' }, 1))
      .toBe(eventCanonical(base, 1))
  })
})
