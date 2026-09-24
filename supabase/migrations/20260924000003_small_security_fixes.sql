-- Two minimal fixes carried in this pass, unrelated to event ingestion.

-- 1. trustpoints_balance was a SECURITY DEFINER view (Supabase advisor
--    security_definer_view, ERROR grade).
--
--    A view with no security_invoker setting evaluates the base table's RLS as
--    its owner. This view is owned by postgres, and trustpoints_ledger has
--    RLS with `user_read_own_trustpoints USING (auth.uid() = user_id)` — so
--    the intended per-user isolation was real, and the view bypassed it: any
--    holder of the anon key could read every user's balance. The ledger is
--    currently empty, so nothing has leaked; it would have started leaking at
--    the first settlement, since capture-payment is what populates it.
--
--    security_invoker = on makes the view evaluate RLS as the querying user,
--    which restores the isolation with no change to the view's shape. Nothing
--    depends on this view (no dependent rules, no function references it, and
--    no client code reads it), so this is safe to apply as-is.
alter view public.trustpoints_balance set (security_invoker = on);

-- Write privileges on an aggregate view and on an append-only ledger are
-- meaningless; the ledger is written only by capture-payment / cancel-payment
-- with the service role. RLS was already denying these (no policy for them),
-- so this removes a grant that should never have been there rather than
-- closing an open hole.
revoke insert, update, delete, truncate on public.trustpoints_balance from anon, authenticated;
revoke insert, update, delete, truncate on public.trustpoints_ledger  from anon, authenticated;

-- 2. rls_auto_enable() was executable by anon and authenticated (Supabase
--    advisors 0028/0029, WARN).
--
--    Not actually exploitable: the function returns the pseudo-type
--    event_trigger, and calling it directly fails with "trigger functions can
--    only be called as triggers" regardless of privilege — verified, not
--    assumed. This is lint hygiene rather than a security fix.
--
--    REVOKE from anon and authenticated alone would NOT be sufficient: the
--    ACL was {=X/postgres, postgres=X/postgres, anon=X/postgres,
--    authenticated=X/postgres, service_role=X/postgres} and the leading =X is
--    a grant to PUBLIC, through which both roles would keep EXECUTE.
--
--    No dependency breaks: the function backs the `ensure_rls` event trigger,
--    and event triggers do not consult EXECUTE at fire time — that privilege
--    is checked when the trigger is created.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
