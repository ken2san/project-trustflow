-- The invitation lookup compares a uuid column with a text argument.
--
-- WHAT WAS BROKEN
-- contracts.invite_token is UUID (20260527000002). Both functions added in
-- 20260928000000 declare p_invite_token as text and compare the two directly,
-- so every call raised
--
--   42883 operator does not exist: uuid = text
--
-- PostgreSQL will coerce an unknown-typed literal to uuid, which is why this
-- never showed up while the same predicate was written by hand in psql; it will
-- not coerce a parameter already typed as text. The Edge Function reported the
-- failure as lookup_failed and every acceptance returned 500. The
-- atomic-acceptance suite found it on its first real execution — all 10 tests.
--
-- WHY THE PARAMETER STAYS text
-- The token arrives from a URL, so it is a caller-supplied string that may not
-- be a uuid at all. A uuid parameter would make PostgREST reject a malformed one
-- with 22P02 before the function could answer, turning a routine bad link into a
-- server error. Parsing it here lets an unparseable token be what it actually
-- is: an invitation that does not exist. The cast is still done once, into a
-- uuid local, so the unique index on invite_token is still used.

-- ── 1. Everything the caller needs, read once ───────────────────────────────

create or replace function public.invite_acceptance_context(p_invite_token text)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  c record;
  v_tip text;
  v_token uuid;
begin
  -- A token that is not a uuid cannot name a row in a uuid column, so it names
  -- no invitation. Reported as not_found rather than raised: the alternative is
  -- a 500 for what is only a malformed link.
  begin
    v_token := p_invite_token::uuid;
  exception when invalid_text_representation then
    return jsonb_build_object('status', 'not_found');
  end;

  select ct.*, ct.xmin::text as row_version into c
    from public.contracts ct
   where ct.invite_token = v_token;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if c.invite_token_used_at is not null then
    return jsonb_build_object('status', 'already_used');
  end if;
  if c.invite_token_expires_at is not null and c.invite_token_expires_at < now() then
    return jsonb_build_object('status', 'expired');
  end if;

  -- The chain tip the acceptance event will be linked to. Checked again under
  -- the lock, because another party may append between now and the commit.
  select e.event_hash into v_tip
    from public.events e
   where e.contract_id = c.id::text
     and e.event_hash is not null
   -- id breaks the tie, matching derive_contract_state. created_at comes from
   -- the writer's clock in milliseconds, so two events can share one; without a
   -- tiebreak "the tip" is whichever row the planner happened to return, and
   -- two readers could disagree about where the chain ends.
   order by e.created_at desc, e.id desc
   limit 1;

  return jsonb_build_object(
    'status', 'ok',
    'row_version', c.row_version,
    'chain_tip', v_tip,
    'contract', jsonb_build_object(
      'id',                  c.id,
      'project_name',        c.project_name,
      'dod',                 c.dod,
      'amount_jpy',          c.amount_jpy,
      'currency',            c.currency,
      'deadline',            c.deadline,
      'performed_by',        c.performed_by,
      'earner_display_name', c.earner_display_name,
      'invited_hirer_email', c.invited_hirer_email,
      'state',               c.state
    )
  );
end;
$$;

-- ── 2. Acceptance and its evidence, or neither ──────────────────────────────

create or replace function public.accept_invitation(
  p_invite_token        text,
  p_hirer_email         text,
  p_guest_token         text,
  p_guest_token_expires timestamptz,
  p_row_version         text,
  p_prev_event_hash     text,
  p_event               jsonb
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  c record;
  v_tip text;
  v_token uuid;
  v_event public.events;
begin
  -- A token that is not a uuid cannot name a row in a uuid column, so it names
  -- no invitation. Reported as not_found rather than raised: the alternative is
  -- a 500 for what is only a malformed link.
  begin
    v_token := p_invite_token::uuid;
  exception when invalid_text_representation then
    return jsonb_build_object('status', 'not_found');
  end;

  -- Serializes concurrent accepts of the same invitation.
  select ct.*, ct.xmin::text as row_version into c
    from public.contracts ct
   where ct.invite_token = v_token
     for update;

  -- ── Validation. Nothing has been written yet, so a status is enough. ──
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if c.invite_token_used_at is not null then
    return jsonb_build_object('status', 'already_used');
  end if;
  if c.invite_token_expires_at is not null and c.invite_token_expires_at < now() then
    return jsonb_build_object('status', 'expired');
  end if;

  -- The caller hashed a snapshot of this row. If the row changed in between,
  -- that snapshot describes a deal that is no longer the one on file, and
  -- recording it would attest terms nobody currently holds. xmin is used rather
  -- than a field-by-field comparison so that this check cannot fall out of step
  -- with buildAgreementSnapshot as that grows: any change to the row at all
  -- invalidates the snapshot, which is the conservative direction.
  --
  -- No client can UPDATE contracts — the grants were revoked entirely — so in
  -- practice only another server-side call could trip this. It is defence in
  -- depth, and it is one comparison.
  if c.row_version is distinct from p_row_version then
    return jsonb_build_object('status', 'contract_changed');
  end if;

  -- The chain must still end where the caller believed it did, or the hash
  -- links to the wrong predecessor. The unique index on
  -- (contract_id, prev_event_hash) would catch this too; checking here lets the
  -- caller retry with a fresh tip instead of reading an opaque 23505.
  select e.event_hash into v_tip
    from public.events e
   where e.contract_id = c.id::text
     and e.event_hash is not null
   -- id breaks the tie, matching derive_contract_state. created_at comes from
   -- the writer's clock in milliseconds, so two events can share one; without a
   -- tiebreak "the tip" is whichever row the planner happened to return, and
   -- two readers could disagree about where the chain ends.
   order by e.created_at desc, e.id desc
   limit 1;

  -- An empty chain is SQL NULL here but the literal 'GENESIS' in the caller and
  -- in the row it is about to write, so the two must be brought into one domain
  -- before they are compared. Without this every acceptance fails: the
  -- acceptance event is always the FIRST event on a contract — createContract
  -- writes no event — so v_tip is always null on the real path, `null is
  -- distinct from 'GENESIS'` is true, and the caller's retry loop spins on an
  -- unchanging tip until it gives up with chain_contention.
  --
  -- Both sides are coalesced rather than only one, so this accepts either
  -- convention and the function therefore does not have to be deployed in step
  -- with the Edge Function that calls it. 'GENESIS' cannot collide with a real
  -- tip, which is always a SHA-256 hex digest.
  --
  -- The sentinel belongs here despite living in _shared/eventCanonical.ts: the
  -- partial unique index events_chain_no_fork_idx (… where prev_event_hash is
  -- not null) only guards the genesis link because the first event stores that
  -- literal, so the database's anti-fork guarantee already rests on this value.
  if coalesce(v_tip, 'GENESIS') is distinct from coalesce(p_prev_event_hash, 'GENESIS') then
    return jsonb_build_object('status', 'chain_conflict');
  end if;

  -- ── Commit point. From here, everything lands or nothing does. ──
  --
  -- A raise anywhere below — a unique violation on the fork index, a check
  -- constraint, the freeze trigger — aborts the function and therefore the
  -- statement, and PostgREST runs each call in its own transaction. There is no
  -- ordering of these two writes that can leave one without the other.

  update public.contracts
     set invite_token_used_at          = now(),
         hirer_email                   = p_hirer_email,
         guest_access_token            = p_guest_token,
         guest_access_token_expires_at = p_guest_token_expires,
         state                         = 'TERMS_ACCEPTED'
   where id = c.id;

  -- Built through jsonb_populate_record rather than a column list with casts.
  -- Each field is converted to whatever type that column actually has, so this
  -- function does not carry a second, hand-maintained copy of the events
  -- schema that could quietly disagree with the table. Keys the table does not
  -- have are ignored; columns the caller did not send stay null, which is what
  -- tsa_token should be.
  insert into public.events
  select *
    from jsonb_populate_record(
      null::public.events,
      p_event || jsonb_build_object('server_recorded_at', now())
    )
  returning * into v_event;

  return jsonb_build_object(
    'status', 'accepted',
    'event', to_jsonb(v_event),
    'contract', jsonb_build_object(
      'id',                  c.id,
      'project_name',        c.project_name,
      'dod',                 c.dod,
      'amount_jpy',          c.amount_jpy,
      'currency',            c.currency,
      'deadline',            c.deadline,
      'performed_by',        c.performed_by,
      'earner_display_name', c.earner_display_name
    )
  );
end;
$$;
