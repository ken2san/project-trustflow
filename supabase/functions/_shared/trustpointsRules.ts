// supabase/functions/_shared/trustpointsRules.ts
//
// Single source of truth for the TrustPoints deltas that the Edge Functions
// award/deduct server-side. Plain numeric constants, no Deno-specific APIs,
// so this same file is also imported directly from the frontend
// (src/lib/trustpoints.js) — previously capture-payment and cancel-payment
// each hardcoded their own local copies of these numbers with nothing
// keeping them in sync with what the frontend displayed as the rule.
//
// Changing a value here changes it everywhere it's used. No redeploy-one-
// side-and-forget-the-other risk.

export const TP_CONTRACT_COMPLETED = 50
export const TP_ON_TIME_BONUS = 20
export const TP_CONTRACT_COMPLETED_HIRER = Math.round(TP_CONTRACT_COMPLETED * 0.4)
export const TP_CANCELLATION_PENALTY = -30
