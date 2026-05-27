-- trustpoints_ledger table
-- Append-only ledger of TrustPoints earned and spent.
-- TrustPoints are non-redeemable for cash — they are a reputation reward token.
-- A positive delta = earned. A negative delta = spent on a platform benefit.

CREATE TABLE IF NOT EXISTS trustpoints_ledger (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id),
  delta        INTEGER     NOT NULL,       -- positive = earned, negative = spent
  reason       TEXT        NOT NULL,       -- human-readable reason
  reason_code  TEXT        NOT NULL,       -- machine-readable code (matches TRUSTPOINTS_RULES in lib)
  contract_id  UUID        REFERENCES contracts(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE trustpoints_ledger ENABLE ROW LEVEL SECURITY;

-- Users can only read their own ledger
CREATE POLICY "user_read_own_trustpoints" ON trustpoints_ledger
  FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts via Edge Functions only (service_role bypasses RLS)
-- No direct client inserts allowed.

-- Convenience view: current balance per user
CREATE OR REPLACE VIEW trustpoints_balance AS
SELECT
  user_id,
  SUM(delta) AS balance,
  COUNT(*) FILTER (WHERE delta > 0) AS earn_count,
  COUNT(*) FILTER (WHERE delta < 0) AS spend_count
FROM trustpoints_ledger
GROUP BY user_id;
