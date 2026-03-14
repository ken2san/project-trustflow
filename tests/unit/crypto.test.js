import { describe, it, expect } from 'vitest'
import { sha256, buildDodCanonical } from '../../src/lib/crypto.js'

// ── sha256 ────────────────────────────────────────────────────────────────────
// Guard: contract DoD integrity depends on sha256 being deterministic.
// If the hash changes for the same input, all stored event_hash values
// become unverifiable — silent data corruption.

describe('sha256', () => {
  it('is deterministic — same input always produces same hash', async () => {
    const a = await sha256('hello world')
    const b = await sha256('hello world')
    expect(a).toBe(b)
  })

  it('produces a 64-character hex string', async () => {
    const hash = await sha256('test')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('known hash: empty string', async () => {
    // SHA-256('') = e3b0c44298fc1c149afb...
    const hash = await sha256('')
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('different inputs produce different hashes', async () => {
    const a = await sha256('contract A — DoD text')
    const b = await sha256('contract B — DoD text')
    expect(a).not.toBe(b)
  })

  it('single character change produces completely different hash (avalanche effect)', async () => {
    const a = await sha256('deliver by 2026-03-15')
    const b = await sha256('deliver by 2026-03-16')
    expect(a).not.toBe(b)
  })
})

// ── buildDodCanonical ─────────────────────────────────────────────────────────
// Guard: the canonical string format must never change once contracts are stored.
// Any format change makes all existing event_hash values unverifiable.

describe('buildDodCanonical', () => {
  const params = {
    dodText: 'Deliver Figma library with dark mode tokens',
    hirerId: 'hirer-uuid-123',
    earnerId: 'earner-uuid-456',
    budgetPoints: '300000',
    deadline: '2026-03-15',
  }

  it('produces a deterministic multi-line string', () => {
    const a = buildDodCanonical(params)
    const b = buildDodCanonical(params)
    expect(a).toBe(b)
  })

  it('includes all required fields prefixed with their key', () => {
    const canonical = buildDodCanonical(params)
    expect(canonical).toContain('dod:Deliver Figma library with dark mode tokens')
    expect(canonical).toContain('hirer:hirer-uuid-123')
    expect(canonical).toContain('earner:earner-uuid-456')
    expect(canonical).toContain('budget:300000')
    expect(canonical).toContain('deadline:2026-03-15')
  })

  it('trims leading/trailing whitespace from dodText', () => {
    const canonical = buildDodCanonical({ ...params, dodText: '  trimmed  ' })
    expect(canonical).toContain('dod:trimmed')
  })

  it('changing any field changes the canonical string', () => {
    const base = buildDodCanonical(params)
    expect(buildDodCanonical({ ...params, deadline: '2026-04-01' })).not.toBe(base)
    expect(buildDodCanonical({ ...params, budgetPoints: '400000' })).not.toBe(base)
    expect(buildDodCanonical({ ...params, hirerId: 'different-hirer' })).not.toBe(base)
  })
})
