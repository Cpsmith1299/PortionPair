-- Postgres grants EXECUTE to the PUBLIC pseudo-role by default at function
-- creation time, and anon/authenticated inherit through it — so revoking
-- from those two roles directly (previous migration) didn't actually remove
-- access, confirmed by the Supabase security advisor still flagging it.
-- Revoke from PUBLIC itself.
revoke execute on function public.handle_new_user() from public;
