import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  formatDate,
  truncate,
  uniqueArray,
  parseDeadlineLocal,
  deriveLevel,
} from '../../src/lib/utils.js'

// ── formatNumber ─────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('adds comma separators', () => {
    expect(formatNumber(300000)).toBe('300,000')
  })
  it('handles string input', () => {
    expect(formatNumber('150000')).toBe('150,000')
  })
  it('returns empty string for null', () => {
    expect(formatNumber(null)).toBe('')
  })
  it('returns empty string for undefined', () => {
    expect(formatNumber(undefined)).toBe('')
  })
})

// ── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats ISO string as YYYY.MM.DD', () => {
    expect(formatDate('2026-03-15')).toBe('2026.03.15')
  })
  it('pads month and day with zeros', () => {
    expect(formatDate('2026-01-05')).toBe('2026.01.05')
  })
  it('returns empty string for falsy input', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
  })
})

// ── truncate ─────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('does not truncate strings within limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })
  it('truncates and appends ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello…')
  })
  it('uses default maxLength of 20', () => {
    const s = 'a'.repeat(21)
    expect(truncate(s)).toBe('a'.repeat(20) + '…')
  })
  it('returns empty string for falsy input', () => {
    expect(truncate('')).toBe('')
    expect(truncate(null)).toBe('')
  })
})

// ── uniqueArray ───────────────────────────────────────────────────────────────

describe('uniqueArray', () => {
  it('removes duplicates', () => {
    expect(uniqueArray([1, 2, 2, 3])).toEqual([1, 2, 3])
  })
  it('preserves order of first occurrence', () => {
    expect(uniqueArray(['b', 'a', 'b'])).toEqual(['b', 'a'])
  })
  it('returns original array when no duplicates', () => {
    expect(uniqueArray([1, 2, 3])).toEqual([1, 2, 3])
  })
})

// ── parseDeadlineLocal ────────────────────────────────────────────────────────
// Critical: prevents UTC-midnight bug where JST users see "yesterday" for today's deadlines.

describe('parseDeadlineLocal', () => {
  it('returns null for empty string', () => {
    expect(parseDeadlineLocal('')).toBeNull()
    expect(parseDeadlineLocal(null)).toBeNull()
  })
  it('parses YYYY-MM-DD as end-of-day local time', () => {
    const d = parseDeadlineLocal('2026-03-15')
    expect(d).toBeInstanceOf(Date)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(2) // 0-indexed
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(23)
    expect(d.getMinutes()).toBe(59)
  })
  it('is after noon on the same day (UTC-midnight trap check)', () => {
    const d = parseDeadlineLocal('2026-03-15')
    const noon = new Date(2026, 2, 15, 12, 0, 0)
    expect(d.getTime()).toBeGreaterThan(noon.getTime())
  })
})

// ── deriveLevel ───────────────────────────────────────────────────────────────
// This logic lived inline in App.jsx and caused double-increment bugs.
// Extracted to utils.js so it can be tested in isolation.
// Regression guard: any change to thresholds will break these tests first.

describe('deriveLevel', () => {
  it('level 1 at 0 completed contracts', () => {
    expect(deriveLevel(0)).toBe(1)
  })
  it('level 1 at 1 completed contract', () => {
    expect(deriveLevel(1)).toBe(1)
  })
  it('level 1 at 2 contracts (boundary: just below 3)', () => {
    expect(deriveLevel(2)).toBe(1)
  })
  it('level 3 at exactly 3 contracts', () => {
    expect(deriveLevel(3)).toBe(3)
  })
  it('level 3 at 4 contracts (boundary: below 5)', () => {
    expect(deriveLevel(4)).toBe(3)
  })
  it('level 5 at exactly 5 contracts', () => {
    expect(deriveLevel(5)).toBe(5)
  })
  it('level 5 at 9 contracts (boundary: just below 10)', () => {
    expect(deriveLevel(9)).toBe(5)
  })
  it('level 10 at exactly 10 contracts', () => {
    expect(deriveLevel(10)).toBe(10)
  })
  it('level 10 at 100 contracts (no higher level exists)', () => {
    expect(deriveLevel(100)).toBe(10)
  })
})
