-- Milestone 2: identity and households (CLAUDE.md §15, §Identity and households).
--
-- Deliberately scoped: this covers only what the app reads/writes today —
-- accounts, one household per account, two members, and one household-wide
-- preferences snapshot. `nutrition_targets` and `dietary_preferences`
-- (per-member) are deferred to the Person 1/2 profile onboarding pass, since
-- nothing populates or reads them yet.
--
-- Apply via the Supabase SQL editor, or `supabase db push` once a project is
-- linked with the CLI.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid());

-- No insert/delete policy for profiles: rows are created only by the trigger
-- below (security definer), never directly by a client.

-- ---------------------------------------------------------------------------
-- households
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  plan_tier text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One household per account for the initial release (CLAUDE.md §Accounts and households).
create unique index households_owner_id_key on public.households (owner_id);

alter table public.households enable row level security;

create policy "households: all for owner"
  on public.households for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- household_members
-- ---------------------------------------------------------------------------

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  display_order int not null,
  profile_color text not null check (profile_color in ('charlie', 'sam')),
  created_at timestamptz not null default now()
);

create unique index household_members_household_id_profile_color_key
  on public.household_members (household_id, profile_color);

alter table public.household_members enable row level security;

create policy "household_members: all for owning household"
  on public.household_members for all
  using (household_id in (select id from public.households where owner_id = auth.uid()))
  with check (household_id in (select id from public.households where owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- New-user provisioning
-- ---------------------------------------------------------------------------

-- Creates the profile, household, and two members for every new auth user in
-- one transaction, reading the household/member names `signUpAction`
-- (features/auth/actions.ts) passes as signup metadata.
--
-- Runs as a trigger rather than a follow-up server action so provisioning
-- happens even when email confirmation delays the first authenticated
-- session — the trigger fires at user-creation time regardless.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  household_name text := coalesce(new.raw_user_meta_data ->> 'household_name', 'Our household');
  member_1_name text := coalesce(new.raw_user_meta_data -> 'member_names' ->> 0, 'Member 1');
  member_2_name text := coalesce(new.raw_user_meta_data -> 'member_names' ->> 1, 'Member 2');
  new_household_id uuid;
begin
  insert into public.profiles (id) values (new.id);

  insert into public.households (owner_id, name)
  values (new.id, household_name)
  returning id into new_household_id;

  insert into public.household_members (household_id, name, display_order, profile_color)
  values
    (new_household_id, member_1_name, 0, 'charlie'),
    (new_household_id, member_2_name, 1, 'sam');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- household_preferences
-- ---------------------------------------------------------------------------

-- Maps 1:1 onto `PlanPreferences` in domain/meal-plans/types.ts.
create table public.household_preferences (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  diets text[] not null default '{}',
  avoid_foods text[] not null default '{}',
  weekly_budget_cents int not null,
  dinners int not null,
  max_cook_time int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index household_preferences_household_id_key on public.household_preferences (household_id);

alter table public.household_preferences enable row level security;

create policy "household_preferences: all for owning household"
  on public.household_preferences for all
  using (household_id in (select id from public.households where owner_id = auth.uid()))
  with check (household_id in (select id from public.households where owner_id = auth.uid()));
