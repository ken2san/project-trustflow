import { describe, it, expect } from 'vitest'
import {
  CONTRACT_STATES, EXPIRY_WARNING_HOURS,
  statusLabel, isTerminal, nextActionFor, groupContracts, stepForState,
  formatAmount, formatDeadline,
} from '../../src/lib/contractStatus.js'

const NOW = new Date('2026-09-24T12:00:00.000Z')
const hoursFromNow = h => new Date(NOW.getTime() + h * 3_600_000).toISOString()

function contract(overrides = {}) {
  return {
    id: 'c1',
    project_name: 'Probe',
    amount_jpy: 1000,
    deadline: null,
    state: CONTRACT_STATES.AWAITING_ACCEPTANCE,
    invite_token_expires_at: hoursFromNow(72),
    invite_token_used_at: null,
    created_at: NOW.toISOString(),
    ...overrides,
  }
}

// ── Whose move is it ────────────────────────────────────────────────────────
// Guard: this decides what the home screen puts in front of you. Getting it
// wrong means silently hiding work that needs doing, or nagging about work
// that is legitimately someone else's.

describe('nextActionFor', () => {
  it('an accepted contract is the Earner’s move', () => {
    const action = nextActionFor(contract({ state: CONTRACT_STATES.TERMS_ACCEPTED }), NOW)
    expect(action.owner).toBe('you')
    expect(action.label).toBe('Ready for you to deliver')
  })

  it('a healthy unaccepted invite is the client’s move, not a nag', () => {
    const action = nextActionFor(contract({ invite_token_expires_at: hoursFromNow(48) }), NOW)
    expect(action.owner).toBe('client')
  })

  it('an invite close to expiry becomes the Earner’s move', () => {
    const action = nextActionFor(
      contract({ invite_token_expires_at: hoursFromNow(EXPIRY_WARNING_HOURS - 1) }), NOW)
    expect(action.owner).toBe('you')
    expect(action.label).toBe('Invite expires soon')
  })

  it('an expired invite is the Earner’s move — only they can reissue it', () => {
    const action = nextActionFor(contract({ invite_token_expires_at: hoursFromNow(-1) }), NOW)
    expect(action.owner).toBe('you')
    expect(action.label).toBe('Send a new invite')
  })

  it('a delivered contract waits on the client', () => {
    expect(nextActionFor(contract({ state: CONTRACT_STATES.DELIVERED }), NOW).owner).toBe('client')
  })

  it('terminal states belong to nobody', () => {
    expect(nextActionFor(contract({ state: CONTRACT_STATES.SETTLED }), NOW).owner).toBe('none')
    expect(nextActionFor(contract({ state: CONTRACT_STATES.CANCELLED }), NOW).owner).toBe('none')
  })

  it('an unrecognised state surfaces rather than disappearing', () => {
    const action = nextActionFor(contract({ state: 'SOMETHING_NEW' }), NOW)
    expect(action.owner).toBe('you')
    expect(action.detail).toContain('SOMETHING_NEW')
  })
})

// ── Grouping ────────────────────────────────────────────────────────────────

describe('groupContracts', () => {
  it('splits by whose move it is, not by state name', () => {
    const rows = [
      contract({ id: 'accepted', state: CONTRACT_STATES.TERMS_ACCEPTED }),
      contract({ id: 'waiting', invite_token_expires_at: hoursFromNow(48) }),
      contract({ id: 'expired', invite_token_expires_at: hoursFromNow(-2) }),
      contract({ id: 'done', state: CONTRACT_STATES.SETTLED }),
      contract({ id: 'dead', state: CONTRACT_STATES.CANCELLED }),
    ]
    const { needsYou, inProgress, completed } = groupContracts(rows, NOW)

    expect(needsYou.map(c => c.id).sort()).toEqual(['accepted', 'expired'])
    expect(inProgress.map(c => c.id)).toEqual(['waiting'])
    expect(completed.map(c => c.id).sort()).toEqual(['dead', 'done'])
  })

  it('two contracts in the same state can land in different groups', () => {
    // Both AWAITING_ACCEPTANCE — the expiry is what moves one of them.
    const rows = [
      contract({ id: 'fresh', invite_token_expires_at: hoursFromNow(70) }),
      contract({ id: 'stale', invite_token_expires_at: hoursFromNow(2) }),
    ]
    const { needsYou, inProgress } = groupContracts(rows, NOW)
    expect(needsYou.map(c => c.id)).toEqual(['stale'])
    expect(inProgress.map(c => c.id)).toEqual(['fresh'])
  })

  it('orders by soonest deadline, with undated contracts last', () => {
    const rows = [
      contract({ id: 'none', state: CONTRACT_STATES.TERMS_ACCEPTED, deadline: null }),
      contract({ id: 'late', state: CONTRACT_STATES.TERMS_ACCEPTED, deadline: '2026-12-01' }),
      contract({ id: 'soon', state: CONTRACT_STATES.TERMS_ACCEPTED, deadline: '2026-10-01' }),
    ]
    expect(groupContracts(rows, NOW).needsYou.map(c => c.id)).toEqual(['soon', 'late', 'none'])
  })

  it('handles no contracts and a missing list without throwing', () => {
    expect(groupContracts([], NOW)).toEqual({ needsYou: [], inProgress: [], completed: [] })
    expect(groupContracts(undefined, NOW)).toEqual({ needsYou: [], inProgress: [], completed: [] })
  })
})

// ── Display ─────────────────────────────────────────────────────────────────

describe('presentation helpers', () => {
  it('labels every state the system writes', () => {
    for (const state of Object.values(CONTRACT_STATES)) {
      expect(statusLabel(state)).not.toBe(state) // a real label, not the raw enum
    }
  })

  it('shows an unknown state as itself rather than blank', () => {
    expect(statusLabel('WEIRD')).toBe('WEIRD')
    expect(statusLabel(undefined)).toBe('Unknown')
  })

  it('knows which states are terminal', () => {
    expect(isTerminal(CONTRACT_STATES.SETTLED)).toBe(true)
    expect(isTerminal(CONTRACT_STATES.CANCELLED)).toBe(true)
    expect(isTerminal(CONTRACT_STATES.TERMS_ACCEPTED)).toBe(false)
  })

  it('formats amounts and deadlines, tolerating missing values', () => {
    expect(formatAmount({ amount_jpy: 63500 })).toBe('¥63,500')
    expect(formatAmount({})).toBe('¥0')
    expect(formatDeadline({ deadline: null })).toBeNull()
    expect(formatDeadline({ deadline: 'not-a-date' })).toBeNull()
    expect(formatDeadline({ deadline: '2026-11-30' })).toBeTruthy()
  })
})

// ── Opening the existing flow screen ────────────────────────────────────────

describe('stepForState', () => {
  it('opens an accepted contract past the commitment step', () => {
    expect(stepForState(CONTRACT_STATES.TERMS_ACCEPTED)).toBe(2)
    expect(stepForState(CONTRACT_STATES.IN_PROGRESS)).toBe(2)
  })

  it('opens a delivered contract at review and a settled one at the end', () => {
    expect(stepForState(CONTRACT_STATES.DELIVERED)).toBe(3)
    expect(stepForState(CONTRACT_STATES.SETTLED)).toBe(5)
  })

  it('falls back to the first step for states with no position in the flow', () => {
    expect(stepForState(CONTRACT_STATES.AWAITING_ACCEPTANCE)).toBe(1)
    expect(stepForState(CONTRACT_STATES.CANCELLED)).toBe(1)
    expect(stepForState('SOMETHING_NEW')).toBe(1)
  })
})

// ── Direction and correction ────────────────────────────────────────────────
// The same state means opposite things to the two sides, and TERMS_ACCEPTED
// means two different things depending on whether a correction was asked for.

describe('status follows the functional role', () => {
  const accepted = extra => contract({ state: CONTRACT_STATES.TERMS_ACCEPTED, ...extra })
  const asserted = extra => contract({ state: CONTRACT_STATES.AWAITING_CONFIRMATION, ...extra })

  it('tells the performer to deliver and the receiver to wait', () => {
    expect(nextActionFor(accepted({ performed_by: 'creator' }), NOW))
      .toMatchObject({ owner: 'you', label: 'Ready for you to deliver' })
    expect(nextActionFor(accepted({ performed_by: 'counterparty' }), NOW))
      .toMatchObject({ owner: 'client', label: 'Waiting on them to deliver' })
  })

  it('tells the receiver to review and the performer to wait', () => {
    expect(nextActionFor(asserted({ performed_by: 'counterparty' }), NOW))
      .toMatchObject({ owner: 'you', label: 'Review the delivery' })
    expect(nextActionFor(asserted({ performed_by: 'creator' }), NOW))
      .toMatchObject({ owner: 'client', label: 'Waiting on them to review' })
  })

  it('defaults to the creator performing, for rows written before performed_by', () => {
    expect(nextActionFor(accepted({}), NOW)).toMatchObject({ owner: 'you' })
  })
})

describe('a requested correction is visible', () => {
  // A rejection returns the agreement to TERMS_ACCEPTED, so the state alone
  // cannot distinguish "they asked me to fix something" from "I have not
  // started". Only the last performance statement knows.
  const afterCorrection = performed_by => contract({
    state: CONTRACT_STATES.TERMS_ACCEPTED,
    performed_by,
    last_performance_type: 'performance.rejected',
  })

  it('reads as a correction for the performer, and as waiting for the receiver', () => {
    expect(nextActionFor(afterCorrection('creator'), NOW))
      .toMatchObject({ owner: 'you', label: 'Correction requested' })
    expect(nextActionFor(afterCorrection('counterparty'), NOW))
      .toMatchObject({ owner: 'client', label: 'Correction requested' })
  })

  it('labels the state from the contract, not from the bare enum', () => {
    expect(statusLabel(afterCorrection('creator'))).toBe('Correction requested')
    // Without that context the same state is just "Accepted" — which is why
    // the call sites pass the contract.
    expect(statusLabel(CONTRACT_STATES.TERMS_ACCEPTED)).toBe('Accepted')
  })

  it('goes back to ready once the performer has asserted again', () => {
    const reasserted = contract({
      state: CONTRACT_STATES.AWAITING_CONFIRMATION,
      performed_by: 'creator',
      last_performance_type: 'performance.asserted',
    })
    expect(nextActionFor(reasserted, NOW).label).toBe('Waiting on them to review')
  })
})

describe('completed agreements', () => {
  it('are finished for both sides and belong in the completed group', () => {
    const done = contract({ state: CONTRACT_STATES.PERFORMANCE_ACCEPTED })
    expect(nextActionFor(done, NOW).owner).toBe('none')
    expect(isTerminal(CONTRACT_STATES.PERFORMANCE_ACCEPTED)).toBe(true)
    expect(groupContracts([done], NOW).completed).toHaveLength(1)
  })

  it('read as completed rather than as a protocol state name', () => {
    expect(statusLabel(CONTRACT_STATES.PERFORMANCE_ACCEPTED)).toBe('Completed')
  })
})
