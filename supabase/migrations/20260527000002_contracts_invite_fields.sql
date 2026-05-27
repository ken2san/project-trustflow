-- T1: Add invite token fields to contracts table
-- Token-based invite hardening: one-time use, 72h expiry, hirer email capture.

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS invite_token           UUID        UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invite_token_used_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hirer_email             TEXT;

-- Index for fast token lookup by Edge Function
CREATE INDEX IF NOT EXISTS contracts_invite_token_idx ON contracts(invite_token);

-- Allow public token validation via Edge Function (no direct client access to this column).
-- The validate-invite-token function uses service_role to read and mark used_at.
-- No additional RLS policy needed here — token lookup is done server-side only.
