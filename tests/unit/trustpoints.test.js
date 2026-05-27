import { describe, it, expect } from 'vitest'
import {
  computeBalance,
  getUnlockedBadges,
  getNextBadge,
  BADGES,
} from '../../src/lib/trustpoints.js'

// ── computeBalance ───────────────────────────────────────────────────────────

describe('computeBalance', () => {
  it('returns zero for empty ledger', () => {
    expect(computeBalance([])).toEqual({ balance: 0, lifetimeEarned: 0 })
  })

  it('sums positive deltas into balance and lifetimeEarned', () => {
    const ledger = [{ delta: 50 }, { delta: 100 }]
    expect(computeBalance(ledger)).toEqual({ balance: 150, lifetimeEarned: 150 })
  })

  it('subtracts negative deltas from balance only (not lifetimeEarned)', () => {
    const ledger = [{ delta: 100 }, { delta: -30 }]
    expect(computeBalance(ledger)).toEqual({ balance: 70, lifetimeEarned: 100 })
  })

  it('balance can go negative if penalties exceed earnings', () => {
    const ledger = [{ delta: 50 }, { delta: -80 }]
    const { balance, lifetimeEarned } = computeBalance(ledger)
    expect(balance).toBe(-30)
    expect(lifetimeEarned).toBe(50)
  })

  it('ignores entries with delta === 0', () => {
    const ledger = [{ delta: 0 }, { delta: 50 }, { delta: 0 }]
    expect(computeBalance(ledger)).toEqual({ balance: 50, lifetimeEarned: 50 })
  })
})

// ── getUnlockedBadges ─────────────────────────────────────────────────────────

describe('getUnlockedBadges', () => {
  it('returns empty array when no badges unlocked', () => {
    expect(getUnlockedBadges(0)).toEqual([])
    expect(getUnlockedBadges(49)).toEqual([])
  })

  it('unlocks first_contract badge at threshold 50', () => {
    const badges = getUnlockedBadges(50)
    expect(badges.map(b => b.id)).toContain('first_contract')
  })

  it('unlocks all badges at max threshold', () => {
    const maxThreshold = Math.max(...BADGES.map(b => b.threshold))
    const badges = getUnlockedBadges(maxThreshold)
    expect(badges.length).toBe(BADGES.length)
  })

  it('does not unlock a badge one point below its threshold', () => {
    const secondBadge = BADGES[1]
    const badges = getUnlockedBadges(secondBadge.threshold - 1)
    expect(badges.map(b => b.id)).not.toContain(secondBadge.id)
  })

  it('unlocks badge exactly at threshold', () => {
    const secondBadge = BADGES[1]
    const badges = getUnlockedBadges(secondBadge.threshold)
    expect(badges.map(b => b.id)).toContain(secondBadge.id)
  })
})

// ── getNextBadge ──────────────────────────────────────────────────────────────

describe('getNextBadge', () => {
  it('returns first badge as next when at 0 points', () => {
    const result = getNextBadge(0)
    expect(result).not.toBeNull()
    expect(result.badge.id).toBe(BADGES[0].id)
    expect(result.remaining).toBe(BADGES[0].threshold)
  })

  it('returns null when all badges unlocked', () => {
    const maxThreshold = Math.max(...BADGES.map(b => b.threshold))
    expect(getNextBadge(maxThreshold)).toBeNull()
  })

  it('returns correct remaining points', () => {
    const target = BADGES[0] // threshold: 50
    const result = getNextBadge(20)
    expect(result.badge.id).toBe(target.id)
    expect(result.remaining).toBe(30)
  })

  it('advances to next badge after previous is unlocked', () => {
    const first = BADGES[0]
    const second = BADGES[1]
    const result = getNextBadge(first.threshold)
    expect(result.badge.id).toBe(second.id)
  })
})
