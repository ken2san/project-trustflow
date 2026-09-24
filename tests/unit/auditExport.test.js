import { describe, it, expect, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { buildAuditDocument } from '../../src/lib/auditExport.js'

// The real sha256 is used here, not a mock: what these tests guard is whether
// a stored hash still recomputes, which a stubbed digest cannot tell us.
// auditExport reaches eventLog for GENESIS_HASH, which imports the client.
vi.mock('../../src/lib/supabase.js', () => ({ supabase: null }))

const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex')

const CONTRACT = 'd666cf92-af89-4017-aec2-a905a2d07057'

/** An event hashed the way log-event hashes one (canonical v2). */
function attestedEvent({ id, type, actorId, createdAt, dodHash = null, prevHash }) {
  const event_hash = sha(JSON.stringify({
    id, type, contract_id: CONTRACT, actor_id: actorId,
    dod_hash: dodHash, created_at: createdAt, prev_hash: prevHash,
  }))
  return {
    id, type, contract_id: CONTRACT, actor_id: actorId, dod_hash: dodHash,
    created_at: createdAt, prev_event_hash: prevHash, hash_version: 2,
    payload: {}, event_hash, tsa_token: null,
  }
}

/** An event hashed the way the pre-chain client hashed one (canonical v1). */
function legacyEvent({ id, type, actorId, createdAt, dodHash = null }) {
  const event_hash = sha(JSON.stringify({
    id, type, contract_id: CONTRACT, actor_id: actorId,
    dod_hash: dodHash, created_at: createdAt,
  }))
  return {
    id, type, contract_id: CONTRACT, actor_id: actorId, dod_hash: dodHash,
    created_at: createdAt, prev_event_hash: null, hash_version: null,
    payload: {}, event_hash, tsa_token: null,
  }
}

const build = (events) => buildAuditDocument({ contractId: CONTRACT, dodHash: 'dod', events })

describe('audit document verification', () => {
  it('verifies a server-attested chain', async () => {
    const a = attestedEvent({
      id: '11111111-1111-4111-8111-111111111111', type: 'contract.initiated',
      actorId: 'earner-uuid', createdAt: '2026-09-24T12:00:00.000Z', prevHash: 'GENESIS',
    })
    const b = attestedEvent({
      id: '22222222-2222-4222-8222-222222222222', type: 'work.submitted',
      actorId: 'earner-uuid', createdAt: '2026-09-24T12:05:00.000Z', prevHash: a.event_hash,
    })

    const doc = (await build([a, b])).trustflow_audit_trail
    expect(doc.integrity_status).toBe('VERIFIED')
    expect(doc.events.every(e => e._export_verification.hash_match)).toBe(true)
    expect(doc.events.every(e => e._export_verification.trust_model === 'server_attested')).toBe(true)
  })

  // Regression: created_at is hashed as 2026-09-24T12:00:00.000Z, but PostgREST
  // returns the same instant as 2026-09-24T12:00:00+00:00. Hashing the value as
  // read reported every stored event as tampered with.
  it('verifies events whose timestamps come back in PostgREST offset form', async () => {
    const a = attestedEvent({
      id: '33333333-3333-4333-8333-333333333333', type: 'contract.initiated',
      actorId: 'earner-uuid', createdAt: '2026-09-24T12:00:00.000Z', prevHash: 'GENESIS',
    })
    // Same instant, as the database renders it.
    const asStored = { ...a, created_at: '2026-09-24T12:00:00+00:00' }

    const doc = (await build([asStored])).trustflow_audit_trail
    expect(doc.events[0]._export_verification.hash_match).toBe(true)
    expect(doc.integrity_status).toBe('VERIFIED')
  })

  // Regression: the canonical gained a prev_hash field without being versioned,
  // so legacy rows were verified with the wrong format and reported as altered.
  it('verifies legacy rows under the canonical they were written with', async () => {
    const legacy = legacyEvent({
      id: '44444444-4444-4444-8444-444444444444', type: 'contract.accepted',
      actorId: 'user', createdAt: '2026-03-12T12:33:16.434Z',
    })

    const doc = (await build([legacy])).trustflow_audit_trail
    expect(doc.events[0]._export_verification.canonical_version).toBe(1)
    expect(doc.events[0]._export_verification.hash_match).toBe(true)
    expect(doc.integrity_status).toBe('VERIFIED')
  })

  it('does not present a legacy row as server-attested', async () => {
    const legacy = legacyEvent({
      id: '55555555-5555-4555-8555-555555555555', type: 'contract.accepted',
      actorId: 'user', createdAt: '2026-03-12T12:33:16.434Z',
    })

    const doc = (await build([legacy])).trustflow_audit_trail
    expect(doc.events[0]._export_verification.trust_model).toBe('client_asserted')
  })

  it('detects an altered event', async () => {
    const a = attestedEvent({
      id: '66666666-6666-4666-8666-666666666666', type: 'work.approved',
      actorId: 'earner-uuid', createdAt: '2026-09-24T12:00:00.000Z', prevHash: 'GENESIS',
    })
    const tampered = { ...a, actor_id: 'somebody-else' }

    const doc = (await build([tampered])).trustflow_audit_trail
    expect(doc.events[0]._export_verification.hash_match).toBe(false)
    expect(doc.integrity_status).toBe('HASH_MISMATCH_DETECTED')
  })

  it('detects a broken chain link when an event is removed', async () => {
    const a = attestedEvent({
      id: '77777777-7777-4777-8777-777777777777', type: 'contract.initiated',
      actorId: 'earner-uuid', createdAt: '2026-09-24T12:00:00.000Z', prevHash: 'GENESIS',
    })
    const b = attestedEvent({
      id: '88888888-8888-4888-8888-888888888888', type: 'work.submitted',
      actorId: 'earner-uuid', createdAt: '2026-09-24T12:05:00.000Z', prevHash: a.event_hash,
    })
    const c = attestedEvent({
      id: '99999999-9999-4999-8999-999999999999', type: 'work.approved',
      actorId: 'earner-uuid', createdAt: '2026-09-24T12:10:00.000Z', prevHash: b.event_hash,
    })

    // b is deleted; a and c both still self-verify.
    const doc = (await build([a, c])).trustflow_audit_trail
    expect(doc.events.every(e => e._export_verification.hash_match)).toBe(true)
    expect(doc.integrity_status).toBe('CHAIN_LINK_BROKEN')
  })

  it('sorts chronologically before verifying, whatever order it is handed', async () => {
    const a = attestedEvent({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', type: 'contract.initiated',
      actorId: 'earner-uuid', createdAt: '2026-09-24T12:00:00.000Z', prevHash: 'GENESIS',
    })
    const b = attestedEvent({
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', type: 'work.submitted',
      actorId: 'earner-uuid', createdAt: '2026-09-24T12:05:00.000Z', prevHash: a.event_hash,
    })

    // fetchContractEvents returns newest-first.
    const doc = (await build([b, a])).trustflow_audit_trail
    expect(doc.integrity_status).toBe('VERIFIED')
  })

  it('tells a verifier how to reproduce the hashes it reports', async () => {
    const doc = (await build([])).trustflow_audit_trail
    const instructions = doc.verification_instructions.join(' ')
    // The two things a third party cannot guess and will otherwise get wrong.
    expect(instructions).toMatch(/trailing Z|\.016Z/)
    expect(instructions).toMatch(/canonical_version/)
    // And the limit of what the hash actually covers.
    expect(instructions).toMatch(/does NOT cover payload/i)
  })
})
