-- Wrap auth.uid() as (select auth.uid()) in every RLS policy so Postgres
-- evaluates it once per query (via an InitPlan) instead of once per row.
-- Flagged by the Supabase performance advisor after the initial migration.
-- See https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

alter policy "profiles: select own" on public.profiles
  using (id = (select auth.uid()));

alter policy "profiles: update own" on public.profiles
  using (id = (select auth.uid()));

alter policy "households: all for owner" on public.households
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

alter policy "household_members: all for owning household" on public.household_members
  using (household_id in (select id from public.households where owner_id = (select auth.uid())))
  with check (household_id in (select id from public.households where owner_id = (select auth.uid())));

alter policy "household_preferences: all for owning household" on public.household_preferences
  using (household_id in (select id from public.households where owner_id = (select auth.uid())))
  with check (household_id in (select id from public.households where owner_id = (select auth.uid())));
