-- Stores each Earner's Stripe Connected Account ID so capture-payment can
-- resolve the settlement destination server-side (contract -> earner_user_id
-- -> this table) instead of trusting a client-supplied account id.
--
-- Storage only in this migration — no Stripe Connect onboarding flow yet.
-- capture-payment fails safely (no transfer, clear error) when a row is
-- missing or stripe_connected_account_id is null.

CREATE TABLE IF NOT EXISTS earner_payout_profiles (
  user_id                     UUID        PRIMARY KEY REFERENCES auth.users(id),
  stripe_connected_account_id TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reuses set_updated_at() defined in 20260527000000_contracts_table.sql.
DROP TRIGGER IF EXISTS earner_payout_profiles_updated_at ON earner_payout_profiles;
CREATE TRIGGER earner_payout_profiles_updated_at
  BEFORE UPDATE ON earner_payout_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE earner_payout_profiles ENABLE ROW LEVEL SECURITY;

-- An Earner can read/write only their own payout profile (for a future
-- "connect Stripe account" settings page). capture-payment reads this via
-- service_role, which bypasses RLS.
CREATE POLICY "own_payout_profile_read" ON earner_payout_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own_payout_profile_insert" ON earner_payout_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_payout_profile_update" ON earner_payout_profiles
  FOR UPDATE USING (auth.uid() = user_id);
