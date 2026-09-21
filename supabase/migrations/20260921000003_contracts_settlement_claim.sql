-- Idempotency guard for capture-payment. A separate claim timestamp (rather
-- than an extra transient value in the `state` column) lets a concurrent
-- duplicate capture-payment call be rejected atomically without introducing
-- a state outside the spec's canonical list.

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS settlement_claimed_at TIMESTAMPTZ;
