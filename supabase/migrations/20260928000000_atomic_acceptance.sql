-- Acceptance and the evidence for it become one operation.
--
-- THE GAP THIS CLOSES
-- Accepting an invitation was two independent requests. validate-invite-token
-- consumed the invite and moved the contract to TERMS_ACCEPTED; the browser
-- then called log-event to write dod.consent_recorded. If the second request
-- failed — a dropped connection, a closed tab, a rejected preflight — the
-- contract was accepted and no acceptance evidence existed. Under canonical v4
-- the acceptance event is the only place the agreed deal is preserved, so that
-- window is the difference between having evidence and having none.
--
-- WHY A FUNCTION AND NOT A SINGLE SQL STATEMENT
-- The event hash is computed in Deno, over the canonical defined once in
-- _shared/eventCanonical.ts. Recomputing it here in plpgsql would create a
-- second implementation of that canonical — which is exactly the drift that
-- produced this project's one production bug, when created_at was hashed as
-- "…016Z" and read back as "…016+00:00" and every stored event verified as
-- tampered with. So the hash stays in one place and the DATABASE is given the
-- job it is actually good at: committing several writes or none.
--
-- THE SHAPE
--   1. invite_acceptance_context() — one read: the terms, the chain tip, and an
--      opaque version of the contract row.
--   2. the caller builds the snapshot and the hashes in Deno.
--   3. accept_invitation() — one transaction: lock the row, re-check that
--      nothing moved under us, consume the invite, record the identity, issue
--      the guest credential, append the acceptance event. Any failure raises,
--      and a raise inside a function rolls the whole call back.
--
-- WHAT THE ROW LOCK BUYS
-- `for update` serializes two concurrent accepts of the same invitation. The
-- loser blocks, then sees invite_token_used_at already set and is refused. The
-- previous conditional update guarded the contract row but not the event, so
-- two racing accepts could each have gone on to append their own acceptance.

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
begin
  select ct.*, ct.xmin::text as row_version into c
    from public.contracts ct
   where ct.invite_token = p_invite_token;

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
   order by e.created_at desc
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
  v_event public.events;
begin
  -- Serializes concurrent accepts of the same invitation.
  select ct.*, ct.xmin::text as row_version into c
    from public.contracts ct
   where ct.invite_token = p_invite_token
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
   order by e.created_at desc
   limit 1;

  if v_tip is distinct from p_prev_event_hash then
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

-- Neither function is SECURITY DEFINER, so a client calling one would run it as
-- themselves and be stopped by the grants anyway. Revoked as well, so that the
-- ability to hand this function a fully-formed event never depends on a single
-- layer: accept_invitation writes whatever event it is given, and only the
-- Edge Function that derives that event from server-held data may call it.
revoke execute on function public.invite_acceptance_context(text) from public, anon, authenticated;
revoke execute on function public.accept_invitation(
  text, text, text, timestamptz, text, text, jsonb) from public, anon, authenticated;

-- EXECUTE is granted to PUBLIC by default, and the revoke above takes it from
-- service_role too. Granted back explicitly, because the Edge Function calls
-- these with the service key and losing this would fail every acceptance.
grant execute on function public.invite_acceptance_context(text) to service_role;
grant execute on function public.accept_invitation(
  text, text, text, timestamptz, text, text, jsonb) to service_role;
