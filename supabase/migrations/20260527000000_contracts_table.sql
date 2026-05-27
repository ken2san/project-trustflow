-- contracts table
-- Persists contract records so audit trails survive beyond localStorage.
-- contract_id is the canonical identifier shared with the events table.

CREATE TABLE IF NOT EXISTS contracts (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by                UUID        REFERENCES auth.users(id),
  counterparty_id           UUID,
  project_name              TEXT        NOT NULL,
  dod                       JSONB       NOT NULL DEFAULT '[]',
  dod_hash                  TEXT,
  amount_jpy                INTEGER     NOT NULL DEFAULT 0,
  currency                  TEXT        NOT NULL DEFAULT 'JPY',
  stripe_payment_intent_id  TEXT,
  stripe_transfer_id        TEXT,
  stripe_refund_id          TEXT,
  state                     TEXT        NOT NULL DEFAULT 'DRAFTING',
  milestones                JSONB       NOT NULL DEFAULT '[]',
  deadline                  DATE,
  auto_release_armed        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contracts_updated_at ON contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Parties can read their own contracts
CREATE POLICY "parties_read_own_contracts" ON contracts
  FOR SELECT
  USING (
    auth.uid() = created_by
    OR auth.uid() = counterparty_id
  );

-- Creator can insert
CREATE POLICY "creator_insert_contract" ON contracts
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Parties can update (state transitions driven by Edge Functions via service_role)
-- Direct client updates are intentionally NOT allowed — all transitions happen server-side.
-- Edge Functions use service_role key which bypasses RLS.
