import { describe, it, expect } from 'vitest'
import {
  ACCEPTANCE_TYPE, buildEventRecord, acceptanceFacts, roleInAgreement,
} from '../../supabase/functions/_shared/eventRecord.ts'
import {
  eventCanonical, canonicalVersionOf, payloadHash, sha256Hex, deriveAgreementHash,
} from '../../supabase/functions/_shared/eventCanonical.ts'

// Two Edge Functions write events now — log-event for assertions, and
// validate-invite-token for the acceptance, which had to move there so that
// accepting and recording what was accepted commit together. Both go through
// buildEventRecord, and these tests are what stop the two producing different
// kinds of object.

const CONTRACT = {
  id: '22222222-2222-4222-8222-222222222222',
  project_name: 'Certified translation of a birth certificate',
  dod: ['translate the document', 'return a stamped PDF'],
  amount_jpy: 20000,
  currency: 'JPY',
  deadline: '2026-11-30',
  performed_by: 'creator',
  earner_display_name: 'Acme Translations',
  invited_hirer_email: 'invited@example.test',
  hirer_email: 'invited@example.test',
}

const acceptance = (overrides = {}) => buildEventRecord({
  type: ACCEPTANCE_TYPE,
  contract: CONTRACT,
  actorId: `guest:${CONTRACT.hirer_email}`,
  party: 'guest_hirer',
  payload: { counterparty_name: 'Guest', counterparty_email: CONTRACT.hirer_email },
  prevEventHash: 'GENESIS',
  ...overrides,
})

describe('roleInAgreement', () => {
  it('puts the work on whichever side performed_by names', () => {
    expect(roleInAgreement('earner', 'creator')).toBe('performer')
    expect(roleInAgreement('guest_hirer', 'creator')).toBe('receiver')
    expect(roleInAgreement('earner', 'counterparty')).toBe('receiver')
    expect(roleInAgreement('guest_hirer', 'counterparty')).toBe('performer')
  })

  it('treats an agreement predating the column as creator-performed', () => {
    expect(roleInAgreement('earner', null)).toBe('performer')
  })
})

describe('the record an event stores', () => {
  it('verifies under the version it was written with', async () => {
    const record = await acceptance()

    expect(record.hash_version).toBe(4)
    expect(canonicalVersionOf(record)).toBe(4)
    expect(await sha256Hex(eventCanonical(record, 4))).toBe(record.event_hash)
    expect(await payloadHash(record.payload)).toBe(record.payload_hash)
  })

  it('binds the agreement the contract actually holds', async () => {
    const record = await acceptance()
    expect(record.agreement_hash).toBe(await deriveAgreementHash(CONTRACT))
  })

  it('drops the server namespace from anything the caller sent', async () => {
    const record = await acceptance({
      payload: {
        counterparty_name: 'Guest',
        _agreement: { snapshot_version: 1, amount: 1, dod: ['whatever I like'] },
        _auth_method: 'government_id_verified',
        _actor_role: 'earner',
      },
    })

    // What the party legitimately said survives; what they tried to assert on
    // the server's behalf does not.
    expect(record.payload.counterparty_name).toBe('Guest')
    expect(record.payload._agreement.amount).toBe(CONTRACT.amount_jpy)
    expect(record.payload._auth_method).toBe('invite_capability')
    expect(record.payload._actor_role).toBe('guest_hirer')
    expect(JSON.stringify(record.payload)).not.toContain('whatever I like')
    expect(JSON.stringify(record.payload)).not.toContain('government_id_verified')
  })

  it('carries an idempotency key through unchanged', async () => {
    const record = await acceptance({ idempotencyKey: `acceptance:${CONTRACT.id}` })
    expect(record.idempotency_key).toBe(`acceptance:${CONTRACT.id}`)
  })
})

describe('what an acceptance records', () => {
  it('embeds the deal, not only its digest', async () => {
    const record = await acceptance()

    expect(record.payload._agreement).toEqual({
      snapshot_version: 1,
      project_name: CONTRACT.project_name,
      dod: CONTRACT.dod,
      amount: CONTRACT.amount_jpy,
      currency: CONTRACT.currency,
      deadline: CONTRACT.deadline,
      performed_by: 'creator',
      offered_by: CONTRACT.earner_display_name,
    })
  })

  it('keeps the invited address and the claimed one apart, and calls neither verified', async () => {
    // A forwarded invitation is legitimate, and the divergence is evidence.
    const forwarded = { ...CONTRACT, hirer_email: 'someone.else@example.test' }
    const record = await buildEventRecord({
      type: ACCEPTANCE_TYPE, contract: forwarded,
      actorId: 'guest:someone.else@example.test', party: 'guest_hirer',
      payload: {}, prevEventHash: 'GENESIS',
    })

    expect(record.payload._invited_recipient).toBe('invited@example.test')
    expect(record.payload._claimed_identity).toBe('someone.else@example.test')
    expect(record.payload._claimed_identity_verified).toBe(false)
    expect(record.payload._auth_method).toBe('invite_capability')
  })

  it('records the identity it is written with, so the two cannot disagree', async () => {
    // The acceptance writes hirer_email and hashes the snapshot in one
    // operation. A record claiming an identity the row does not carry would be
    // the same class of defect as an unbound price.
    const claimed = 'accepted.just.now@example.test'
    const record = await buildEventRecord({
      type: ACCEPTANCE_TYPE,
      contract: { ...CONTRACT, hirer_email: claimed },
      actorId: `guest:${claimed}`, party: 'guest_hirer',
      payload: {}, prevEventHash: 'GENESIS',
    })

    expect(record.actor_id).toBe(`guest:${claimed}`)
    expect(record.payload._claimed_identity).toBe(claimed)
  })

  it('states the accepting party is the performer when they do the work', async () => {
    const record = await buildEventRecord({
      type: ACCEPTANCE_TYPE,
      contract: { ...CONTRACT, performed_by: 'counterparty' },
      actorId: 'guest:x@example.test', party: 'guest_hirer',
      payload: {}, prevEventHash: 'GENESIS',
    })

    expect(record.payload._role_in_agreement).toBe('performer')
    expect(record.payload._agreement.performed_by).toBe('counterparty')
  })

  it('does not attach the agreement to an ordinary assertion', async () => {
    // Only the acceptance carries the snapshot. Every event carries the hash.
    const asserted = await buildEventRecord({
      type: 'performance.asserted', contract: CONTRACT,
      actorId: 'earner-uuid', party: 'earner',
      payload: { note: 'delivered' }, prevEventHash: 'abc',
    })

    expect(asserted.payload._agreement).toBeUndefined()
    expect(asserted.payload._invited_recipient).toBeUndefined()
    expect(asserted.agreement_hash).toBe(await deriveAgreementHash(CONTRACT))
    expect(asserted.payload._auth_method).toBe('account_session')
  })

  it('is assembled the same way wherever it is built', async () => {
    // Same inputs, same record apart from the id and the timestamp — which are
    // the only two fields that are meant to differ per write.
    const a = await acceptance()
    const b = await acceptance()
    const strip = r => ({ ...r, id: null, created_at: null, event_hash: null })

    expect(strip(a)).toEqual(strip(b))
    expect(a.payload_hash).toBe(b.payload_hash)
    expect(a.agreement_hash).toBe(b.agreement_hash)
  })
})

describe('acceptanceFacts', () => {
  it('says nothing was verified, because nothing was', async () => {
    expect(acceptanceFacts(CONTRACT)._claimed_identity_verified).toBe(false)
  })

  it('reports an absent invited address as absent rather than guessing', () => {
    const { invited_hirer_email: _none, ...noInvite } = CONTRACT
    expect(acceptanceFacts(noInvite)._invited_recipient).toBeNull()
  })
})
