-- H2: Record when Earner submits delivery so server-side auto-capture can enforce the 7-day timeout.
-- The frontend already handles the timer; this column allows a future pg_cron job or webhook to
-- trigger capture-payment for contracts where delivered_at < NOW() - INTERVAL '7 days' and
-- state = 'DELIVERED'.

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS contracts_delivered_at_idx
  ON contracts(delivered_at)
  WHERE state = 'DELIVERED';
