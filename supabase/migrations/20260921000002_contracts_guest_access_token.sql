-- Long-lived guest session credential for the guest Hirer.
--
-- invite_token (20260527000002) is single-use and scoped to the initial
-- acceptance flow only (INVITED -> TERMS_ACCEPTED) — per spec it must become
-- invalid right after that transition. guest_access_token is issued at that
-- same moment (see validate-invite-token's accept path) and authorizes the
-- guest Hirer's later actions on this contract: pay, confirm delivery,
-- cancel. It is the same credential the guest confirmation page (a later
-- phase) will use, introduced now because payment already needs it.

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS guest_access_token            UUID,
  ADD COLUMN IF NOT EXISTS guest_access_token_expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS contracts_guest_access_token_idx
  ON contracts(guest_access_token)
  WHERE guest_access_token IS NOT NULL;

-- No RLS policy needed — always read/written via service_role in Edge Functions,
-- same as invite_token.
