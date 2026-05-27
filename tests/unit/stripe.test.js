import { describe, it, expect } from 'vitest'
import { formatJpy } from '../../src/lib/stripe.js'

// Only the pure formatJpy helper is tested here.
// Network-dependent helpers (createPaymentIntent, capturePayment, cancelPayment)
// require Supabase + Stripe and are tested via E2E / integration tests.

describe('formatJpy', () => {
  it('formats zero', () => {
    expect(formatJpy(0)).toBe('¥0')
  })

  it('formats a typical contract amount', () => {
    expect(formatJpy(300000)).toBe('¥300,000')
  })

  it('formats small amounts without thousand separator', () => {
    expect(formatJpy(500)).toBe('¥500')
  })

  it('formats large amounts with commas', () => {
    expect(formatJpy(1000000)).toBe('¥1,000,000')
  })

  it('returns ¥0 for NaN', () => {
    expect(formatJpy(NaN)).toBe('¥0')
  })

  it('returns ¥0 for Infinity', () => {
    expect(formatJpy(Infinity)).toBe('¥0')
  })

  it('handles negative amounts (refund display)', () => {
    const result = formatJpy(-50000)
    expect(result).toMatch(/¥/)
    expect(result).toMatch(/50/)
  })
})
