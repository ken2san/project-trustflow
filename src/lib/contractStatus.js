// src/lib/contractStatus.js
//
// How a contract's server-owned `state` becomes something to read and act on.
//
// This is the only place that interprets contracts.state for the UI. It is
// deliberately pure and free of React and Supabase so the grouping rules can be
// tested directly — they decide what the home screen puts in front of you, and
// getting them wrong means quietly hiding work that needs doing.
//
// NOTE ON THE NUMERIC STEP: the contract flow screen tracks a local 1–5 `step`
// that has no relationship to this column. Nothing here reads it. Migrating
// that screen onto the state machine is a later boundary; until then the home
// screen and the flow screen can legitimately disagree, and the home screen is
// the one telling the truth.

/** States the system actually writes. */
export const CONTRACT_STATES = {
  DRAFTING:            'DRAFTING',            // created before invites existed
  AWAITING_ACCEPTANCE: 'AWAITING_ACCEPTANCE', // invite issued, not yet accepted
  TERMS_ACCEPTED:      'TERMS_ACCEPTED',      // the Hirer agreed
  IN_PROGRESS:         'IN_PROGRESS',         // payment authorised (Stripe; not in use yet)
  DELIVERED:           'DELIVERED',           // work submitted, awaiting review
  SETTLED:             'SETTLED',             // funds released
  CANCELLED:           'CANCELLED',
}

const LABELS = {
  [CONTRACT_STATES.DRAFTING]:            'Draft',
  [CONTRACT_STATES.AWAITING_ACCEPTANCE]: 'Awaiting acceptance',
  [CONTRACT_STATES.TERMS_ACCEPTED]:      'Accepted',
  [CONTRACT_STATES.IN_PROGRESS]:         'In progress',
  [CONTRACT_STATES.DELIVERED]:           'Awaiting review',
  [CONTRACT_STATES.SETTLED]:             'Completed',
  [CONTRACT_STATES.CANCELLED]:           'Cancelled',
}

const TERMINAL = new Set([CONTRACT_STATES.SETTLED, CONTRACT_STATES.CANCELLED])

/** How close to expiry an unaccepted invite has to be before clearing it
 *  becomes the Earner's problem rather than the client's. */
export const EXPIRY_WARNING_HOURS = 24

/** Human label for a state. Unknown states render as themselves rather than
 *  as a blank or a guess — a state this file has not been taught about is
 *  something to notice, not to smooth over. */
export function statusLabel(state) {
  return LABELS[state] ?? state ?? 'Unknown'
}

export function isTerminal(state) {
  return TERMINAL.has(state)
}

function inviteExpiry(contract) {
  if (!contract.invite_token_expires_at) return null
  const at = new Date(contract.invite_token_expires_at)
  return Number.isNaN(at.getTime()) ? null : at
}

/**
 * What happens next on this contract, and whose move it is.
 *
 * `owner` is 'you' when the Earner has to do something, 'client' when the
 * contract is legitimately waiting on the other party, and 'none' when it is
 * over. Only 'you' pulls a contract into the Needs you group.
 *
 * @param {object} contract  a row from listContracts()
 * @param {Date}   [now]
 * @returns {{ owner: 'you'|'client'|'none', label: string, detail: string|null }}
 */
export function nextActionFor(contract, now = new Date()) {
  const state = contract?.state

  if (state === CONTRACT_STATES.SETTLED) {
    return { owner: 'none', label: 'Completed', detail: null }
  }
  if (state === CONTRACT_STATES.CANCELLED) {
    return { owner: 'none', label: 'Cancelled', detail: null }
  }

  if (state === CONTRACT_STATES.DRAFTING) {
    return { owner: 'you', label: 'Send the invite', detail: 'This agreement has never been sent.' }
  }

  if (state === CONTRACT_STATES.AWAITING_ACCEPTANCE) {
    // Waiting on the client is normal and not something to nag about — but an
    // invite link that has expired, or is about to, is dead weight only the
    // Earner can clear. That is the Earner's move, not the client's.
    const expiresAt = inviteExpiry(contract)
    if (contract.invite_token_used_at) {
      return { owner: 'client', label: 'Waiting on your client', detail: 'The invite was opened.' }
    }
    if (!expiresAt) {
      return { owner: 'client', label: 'Waiting on your client', detail: 'Invite sent.' }
    }
    const hoursLeft = (expiresAt - now) / 3_600_000
    if (hoursLeft <= 0) {
      return { owner: 'you', label: 'Send a new invite', detail: 'The invite link has expired.' }
    }
    if (hoursLeft <= EXPIRY_WARNING_HOURS) {
      return {
        owner: 'you',
        label: 'Invite expires soon',
        detail: `The link expires in ${Math.max(1, Math.round(hoursLeft))} hour${Math.round(hoursLeft) === 1 ? '' : 's'}.`,
      }
    }
    return { owner: 'client', label: 'Waiting on your client', detail: 'They have not accepted yet.' }
  }

  if (state === CONTRACT_STATES.TERMS_ACCEPTED) {
    return { owner: 'you', label: 'Deliver the work', detail: 'Your client accepted the terms.' }
  }
  if (state === CONTRACT_STATES.IN_PROGRESS) {
    return { owner: 'you', label: 'Deliver the work', detail: 'Work is underway.' }
  }
  if (state === CONTRACT_STATES.DELIVERED) {
    return { owner: 'client', label: 'Waiting on your client', detail: 'They are reviewing your delivery.' }
  }

  // An unrecognised state is surfaced, not hidden: a contract in a state this
  // file does not know about still belongs somewhere visible.
  return { owner: 'you', label: 'Check this agreement', detail: `Unrecognised status: ${state}` }
}

/**
 * Split contracts into the three groups the home screen shows.
 *
 * Sorted so the most urgent sits at the top of each group: soonest deadline
 * first, and a contract with no deadline after ones that have one.
 *
 * @param {object[]} contracts
 * @param {Date}     [now]
 * @returns {{ needsYou: object[], inProgress: object[], completed: object[] }}
 */
export function groupContracts(contracts, now = new Date()) {
  const needsYou = []
  const inProgress = []
  const completed = []

  for (const contract of contracts ?? []) {
    if (isTerminal(contract.state)) {
      completed.push(contract)
      continue
    }
    const { owner } = nextActionFor(contract, now)
    if (owner === 'you') needsYou.push(contract)
    else inProgress.push(contract)
  }

  return {
    needsYou: needsYou.sort(byUrgency),
    inProgress: inProgress.sort(byUrgency),
    completed: completed.sort(byRecency),
  }
}

function byUrgency(a, b) {
  const da = a.deadline ? Date.parse(a.deadline) : Infinity
  const db = b.deadline ? Date.parse(b.deadline) : Infinity
  if (da !== db) return da - db
  return Date.parse(b.created_at ?? 0) - Date.parse(a.created_at ?? 0)
}

function byRecency(a, b) {
  return Date.parse(b.created_at ?? 0) - Date.parse(a.created_at ?? 0)
}

/**
 * Which step the existing contract flow screen should open at for a contract
 * in this state.
 *
 * The flow screen tracks its own local 1–5 counter and has not been migrated
 * onto the state machine — that is a later boundary. This mapping exists only
 * so that opening a real contract does not drop you at step 1 as though
 * nothing had happened yet. It is approximate by construction: CANCELLED has
 * no position in a five-step forward flow and lands at the start, where the
 * screen's own controls are least likely to imply progress that isn't real.
 *
 * Treat contracts.state as the authority on status; this is a starting
 * position for a screen that does not yet read it.
 */
export function stepForState(state) {
  switch (state) {
    case CONTRACT_STATES.TERMS_ACCEPTED:
    case CONTRACT_STATES.IN_PROGRESS:
      return 2
    case CONTRACT_STATES.DELIVERED:
      return 3
    case CONTRACT_STATES.SETTLED:
      return 5
    case CONTRACT_STATES.DRAFTING:
    case CONTRACT_STATES.AWAITING_ACCEPTANCE:
    case CONTRACT_STATES.CANCELLED:
    default:
      return 1
  }
}

/** Format an amount the way the contract records it. */
export function formatAmount(contract) {
  const amount = Number(contract?.amount_jpy ?? 0)
  if (!Number.isFinite(amount)) return '—'
  return `¥${amount.toLocaleString()}`
}

/** Deadline as a short, readable date. Null when there isn't one. */
export function formatDeadline(contract) {
  if (!contract?.deadline) return null
  const date = new Date(`${contract.deadline}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
