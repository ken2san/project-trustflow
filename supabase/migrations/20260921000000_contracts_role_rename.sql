-- Rename generic role columns to canonical Earner/Hirer semantics.
--
-- created_by already functions in practice as the Earner: the registered account
-- that creates the contract, defines the DoD, and is the intended recipient of
-- released funds. counterparty_id has never been populated by any code path
-- (verified: no INSERT/UPDATE anywhere sets it) and becomes the slot for a future
-- registered Hirer account. The guest Hirer (the common case for this MVP) is
-- identified by hirer_email (added in 20260527000002), not by this column.
--
-- Canonical rule (see Protocol.md): contract creator = Earner, payer = Hirer,
-- recipient of released funds = Earner.

ALTER TABLE contracts RENAME COLUMN created_by TO earner_user_id;
ALTER TABLE contracts RENAME COLUMN counterparty_id TO hirer_user_id;

DROP POLICY IF EXISTS "parties_read_own_contracts" ON contracts;
CREATE POLICY "parties_read_own_contracts" ON contracts
  FOR SELECT
  USING (
    auth.uid() = earner_user_id
    OR auth.uid() = hirer_user_id
  );

DROP POLICY IF EXISTS "creator_insert_contract" ON contracts;
CREATE POLICY "creator_insert_contract" ON contracts
  FOR INSERT
  WITH CHECK (auth.uid() = earner_user_id);

-- Guest Hirer access (no auth.users row) is never granted via RLS — it goes
-- through Edge Functions using service_role, gated by guest_access_token
-- (see 20260921000002_contracts_guest_access_token.sql).
