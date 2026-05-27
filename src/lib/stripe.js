// src/lib/stripe.js
// Client-side Stripe helper for TrustFlow.
//
// All sensitive Stripe operations (creating PaymentIntents, captures, refunds)
// go through Supabase Edge Functions — never directly from the browser.
// This file only handles:
//   1. Loading the Stripe.js library (for card element rendering)
//   2. Calling the Edge Functions with the user's auth token

import { loadStripe } from '@stripe/stripe-js'
import { supabase } from './supabase.js'

const PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// Stripe instance (lazy-loaded, null if not configured)
let _stripePromise = null

export function getStripe() {
  if (!PUBLISHABLE_KEY) return null
  if (!_stripePromise) _stripePromise = loadStripe(PUBLISHABLE_KEY)
  return _stripePromise
}

export const isStripeEnabled = Boolean(PUBLISHABLE_KEY)

// ── Edge Function callers ───────────────────────────────────────────────────

async function callEdgeFunction(name, body) {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

/**
 * Create a Stripe PaymentIntent for a contract.
 * Returns { clientSecret, paymentIntentId }.
 *
 * @param {object} params
 * @param {string} params.contractId
 * @param {number} params.amountJpy   — integer JPY amount (e.g. 300000 for ¥300,000)
 * @param {string} [params.description]
 * @param {string} [params.earnerEmail]
 */
export async function createPaymentIntent({ contractId, amountJpy, description, earnerEmail }) {
  return callEdgeFunction('create-payment-intent', {
    contractId,
    amountJpy,
    description,
    earnerEmail,
  })
}

/**
 * Release escrowed funds to the Earner.
 * Should be called after both parties confirm completion.
 *
 * @param {object} params
 * @param {string} params.contractId
 * @param {string} [params.earnerStripeAccountId]  — Earner's Stripe Connect account ID
 */
export async function capturePayment({ contractId, earnerStripeAccountId }) {
  return callEdgeFunction('capture-payment', { contractId, earnerStripeAccountId })
}

/**
 * Refund the Hirer and cancel the contract.
 *
 * @param {object} params
 * @param {string} params.contractId
 * @param {string} [params.reason]  — e.g. 'mutual_cancellation' | 'dispute_hirer_wins'
 */
export async function cancelPayment({ contractId, reason }) {
  return callEdgeFunction('cancel-payment', { contractId, reason })
}

/**
 * Format a JPY amount for display.
 * @param {number} amount
 * @returns {string}  e.g. "¥300,000"
 */
export function formatJpy(amount) {
  if (!Number.isFinite(amount)) return '¥0'
  return `¥${amount.toLocaleString('ja-JP')}`
}
