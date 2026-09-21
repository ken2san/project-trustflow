import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEvent, logEvent, GENESIS_HASH, EVENT_TYPES } from '../../src/lib/eventLog.js'

// Mock supabase so eventLog.js can be imported without a live client.
// persistEvent's Supabase-connected path is NOT tested here — that belongs
// in integration tests that run against a real (or local) Supabase instance.
// With supabase === null, getChainTip() always falls back to GENESIS_HASH,
// so the chain-linkage tests below only exercise the "first event" case.
vi.mock('../../src/lib/supabase.js', () => ({ supabase: null }))
vi.mock('../../src/lib/tsa.js', () => ({ requestTimestamp: vi.fn().mockResolvedValue(null) }))
vi.mock('../../src/lib/crypto.js', () => ({
  sha256: vi.fn().mockResolvedValue('mock-hash-abc123'),
  buildDodCanonical: vi.fn().mockReturnValue('mock-canonical'),
}))

// ── EVENT_TYPES ───────────────────────────────────────────────────────────────
// Guard: constant names must never be renamed without updating all callers.

describe('EVENT_TYPES', () => {
  it('contains all required contract lifecycle events', () => {
    const required = [
      'CONTRACT_INITIATED', 'CONTRACT_ACCEPTED',
      'WORK_SUBMITTED', 'WORK_APPROVED', 'WORK_REJECTED',
      'PAYMENT_RELEASED', 'CONTRACT_COMPLETED', 'CONTRACT_CANCELLED',
    ]
    for (const key of required) {
      expect(EVENT_TYPES).toHaveProperty(key)
    }
  })

  it('contains dispute events', () => {
    expect(EVENT_TYPES).toHaveProperty('DISPUTE_OPENED')
    expect(EVENT_TYPES).toHaveProperty('DISPUTE_RESOLVED')
    expect(EVENT_TYPES).toHaveProperty('DISPUTE_WON')
    expect(EVENT_TYPES).toHaveProperty('DISPUTE_LOST')
  })

  it('values are dot-separated strings (protocol format)', () => {
    for (const [, value] of Object.entries(EVENT_TYPES)) {
      expect(value).toMatch(/^[a-z]+\.[a-z_]+$/)
    }
  })
})

// ── createEvent ───────────────────────────────────────────────────────────────
// Guard: event object shape is part of the DB schema contract.
// If the shape changes, existing Supabase rows become unreadable by new code.

describe('createEvent', () => {
  const baseParams = {
    type: EVENT_TYPES.CONTRACT_INITIATED,
    contractId: 'contract-uuid-001',
    actorId: 'actor-uuid-999',
  }

  it('returns an object with all required fields', () => {
    const event = createEvent(baseParams)
    expect(event).toHaveProperty('id')
    expect(event).toHaveProperty('type')
    expect(event).toHaveProperty('contract_id')
    expect(event).toHaveProperty('actor_id')
    expect(event).toHaveProperty('payload')
    expect(event).toHaveProperty('dod_hash')
    expect(event).toHaveProperty('created_at')
  })

  it('id is a valid UUID v4', () => {
    const event = createEvent(baseParams)
    expect(event.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('maps contractId → contract_id (snake_case for DB)', () => {
    const event = createEvent(baseParams)
    expect(event.contract_id).toBe('contract-uuid-001')
    expect(event).not.toHaveProperty('contractId') // camelCase must not leak to DB
  })

  it('maps actorId → actor_id', () => {
    const event = createEvent(baseParams)
    expect(event.actor_id).toBe('actor-uuid-999')
  })

  it('created_at is an ISO 8601 timestamp', () => {
    const event = createEvent(baseParams)
    expect(() => new Date(event.created_at).toISOString()).not.toThrow()
  })

  it('payload defaults to empty object when not provided', () => {
    const event = createEvent(baseParams)
    expect(event.payload).toEqual({})
  })

  it('payload is preserved when provided', () => {
    const event = createEvent({ ...baseParams, payload: { step: 2, reason: 'test' } })
    expect(event.payload).toEqual({ step: 2, reason: 'test' })
  })

  it('dod_hash defaults to null when not provided', () => {
    const event = createEvent(baseParams)
    expect(event.dod_hash).toBeNull()
  })

  it('dod_hash is set when provided', () => {
    const event = createEvent({ ...baseParams, dodHash: 'sha256-abc' })
    expect(event.dod_hash).toBe('sha256-abc')
  })

  it('two events have different ids (no UUID collision)', () => {
    const a = createEvent(baseParams)
    const b = createEvent(baseParams)
    expect(a.id).not.toBe(b.id)
  })
})

// ── logEvent chain linkage ──────────────────────────────────────────────────
// Guard: prev_event_hash is what turns independently-hashed rows into an
// actual verifiable chain (see auditExport.js). Regressing this silently
// reintroduces the "deletion/reorder/forged-insert goes undetected" bug.

describe('logEvent chain linkage', () => {
  const baseParams = {
    type: EVENT_TYPES.CONTRACT_INITIATED,
    contractId: 'contract-uuid-001',
    actorId: 'actor-uuid-999',
  }

  it('sets prev_event_hash to GENESIS_HASH when there is no persisted history (mock mode)', async () => {
    const persisted = await logEvent(baseParams)
    expect(persisted.prev_event_hash).toBe(GENESIS_HASH)
  })

  it('includes prev_hash in the hashed canonical payload, not just the stored row', async () => {
    const { sha256 } = await import('../../src/lib/crypto.js')
    sha256.mockClear()
    await logEvent(baseParams)
    const canonicalArg = sha256.mock.calls[0][0]
    expect(JSON.parse(canonicalArg)).toHaveProperty('prev_hash', GENESIS_HASH)
  })

  it('sets event_hash on the persisted event', async () => {
    const persisted = await logEvent(baseParams)
    expect(persisted.event_hash).toBe('mock-hash-abc123')
  })

  it('GENESIS_HASH is a stable, non-empty sentinel distinguishable from a real hash', () => {
    expect(GENESIS_HASH).toBe('GENESIS')
  })
})
