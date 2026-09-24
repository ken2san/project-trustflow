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
    expect(action.label).toBe('Deliver the work')
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
