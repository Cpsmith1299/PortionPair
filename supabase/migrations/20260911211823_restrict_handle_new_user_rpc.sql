-- The handle_new_user trigger function is SECURITY DEFINER and, like every
-- function in the public schema, PostgREST auto-exposes it as an RPC
-- endpoint by default. It only makes sense inside a trigger (it reads the
-- trigger-only `new` record) and a direct call would error out harmlessly,
-- but there's no reason to leave it publicly callable at all.
--
-- This revoke alone turned out to be insufficient — see the next migration.
revoke execute on function public.handle_new_user() from anon, authenticated;
