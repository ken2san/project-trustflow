-- The guest credential is written into a uuid column from a text argument.
--
-- The second instance of the same mistake as 20260929000000, found by the same
-- suite on its next run:
--
--   column "guest_access_token" is of type uuid but expression is of type text
--
-- contracts.guest_access_token is UUID (20260921000002). accept_invitation takes
-- p_guest_token as text and assigns it directly, so the acceptance rolled back
-- after passing every validation — the failure was in the commit block, which is
-- exactly where the transaction is supposed to make "all or nothing" hold. It
-- did: nothing landed. It just never succeeded either.
--
-- The whole class was then checked rather than only the reported column. Every
-- parameter was compared against the type of what it is assigned to or compared
-- with: hirer_email, state, currency and the hash columns are text, deadline is
-- date, amount_jpy integer, dod jsonb, events.contract_id text (which is why
-- c.id::text is correct), and the event row is built through
-- jsonb_populate_record, which casts per column by construction. guest_access_token
-- was the only remaining mismatch.
--
-- WHY THIS CAST IS UNGUARDED, UNLIKE THE INVITATION TOKEN'S
-- The invite token arrives from a URL, so a malformed one is an ordinary event
-- and is reported as not_found. The guest token is generated server-side by
-- crypto.randomUUID() in the Edge Function, so a value that will not parse means
-- that function is broken, not that a caller sent something odd. Raising is the
-- honest outcome: it must not be turned into a refusal that looks like the
-- guest's fault.

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
         guest_access_token            = p_guest_token::uuid,
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
