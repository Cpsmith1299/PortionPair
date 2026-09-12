-- Milestone 4: real planning flow (CLAUDE.md §15, §9 "Plans and portions").
--
-- Scope for this slice: persisted plans/items/portions, per-member nutrition
-- targets (the gap Milestone 2 deliberately deferred — the portion engine
-- cannot personalize without them), and a grocery list built from the plan.
-- Two writes need to be atomic across several tables (§9 "a plan item
-- replacement is transactional"), so those are Postgres functions rather than
-- sequential client-side inserts — RLS still applies inside them (security
-- invoker), so this is defense in depth on top of RLS, not instead of it
-- (CLAUDE.md §17).
--
-- Deliberately out of scope here: replacement lineage tracking beyond the
-- current recipe (no history chain), and grocery_item_sources (per-source
-- traceability) — the grocery list is rebuilt wholesale from the plan's
-- current items instead, which satisfies "replacing a meal must update
-- grocery quantities" without the extra join table. Custom (non-derived)
-- grocery items are preserved across a rebuild; derived items' checked state
-- is not.

-- ---------------------------------------------------------------------------
-- nutrition_targets
-- ---------------------------------------------------------------------------

-- One row per member — a "current" target, not a history. `calculation_method`
-- is always 'manual' for now; 'estimated' is reserved for a future in-app
-- calculator (CLAUDE.md §3 "manual target entry or an editable in-app estimate").
create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  household_member_id uuid not null references public.household_members (id) on delete cascade,
  calories int not null check (calories between 800 and 6000),
  protein_g numeric not null check (protein_g between 20 and 400),
  carbs_g numeric,
  fat_g numeric,
  calculation_method text not null default 'manual' check (calculation_method in ('manual', 'estimated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index nutrition_targets_household_member_id_key on public.nutrition_targets (household_member_id);

alter table public.nutrition_targets enable row level security;

create policy "nutrition_targets: all for owning household"
  on public.nutrition_targets for all
  using (household_member_id in (
    select hm.id from public.household_members hm
    join public.households h on h.id = hm.household_id
    where h.owner_id = auth.uid()
  ))
  with check (household_member_id in (
    select hm.id from public.household_members hm
    join public.households h on h.id = hm.household_id
    where h.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- meal_plans
-- ---------------------------------------------------------------------------

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  week_start date not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  source text not null default 'catalog' check (source in ('catalog', 'ai')),
  preferences_snapshot jsonb not null default '{}',
  estimated_cost numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index meal_plans_household_id_week_start_key on public.meal_plans (household_id, week_start);

alter table public.meal_plans enable row level security;

create policy "meal_plans: all for owning household"
  on public.meal_plans for all
  using (household_id in (select id from public.households where owner_id = auth.uid()))
  with check (household_id in (select id from public.households where owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- meal_plan_items
-- ---------------------------------------------------------------------------

create table public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,
  day_index int not null check (day_index between 0 and 6),
  -- null only for a leftovers night.
  recipe_id text references public.recipes (id),
  kind text not null check (kind in ('cooked', 'leftovers')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index meal_plan_items_meal_plan_id_day_index_key on public.meal_plan_items (meal_plan_id, day_index);

alter table public.meal_plan_items enable row level security;

create policy "meal_plan_items: all for owning household"
  on public.meal_plan_items for all
  using (meal_plan_id in (
    select mp.id from public.meal_plans mp
    join public.households h on h.id = mp.household_id
    where h.owner_id = auth.uid()
  ))
  with check (meal_plan_id in (
    select mp.id from public.meal_plans mp
    join public.households h on h.id = mp.household_id
    where h.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- member_portions
-- ---------------------------------------------------------------------------

create table public.member_portions (
  id uuid primary key default gen_random_uuid(),
  meal_plan_item_id uuid not null references public.meal_plan_items (id) on delete cascade,
  household_member_id uuid not null references public.household_members (id) on delete cascade,
  portion_summary text not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric,
  fat_g numeric,
  -- ScaledIngredientLine[] from domain/portions/types.ts — kept for
  -- explainability (grocery-list drilldown, "why is this here").
  scaled_ingredients jsonb not null default '[]',
  warnings text[] not null default '{}',
  calculation_version text not null,
  created_at timestamptz not null default now()
);

create unique index member_portions_item_member_key on public.member_portions (meal_plan_item_id, household_member_id);
create index member_portions_meal_plan_item_id_idx on public.member_portions (meal_plan_item_id);

alter table public.member_portions enable row level security;

create policy "member_portions: all for owning household"
  on public.member_portions for all
  using (meal_plan_item_id in (
    select mpi.id from public.meal_plan_items mpi
    join public.meal_plans mp on mp.id = mpi.meal_plan_id
    join public.households h on h.id = mp.household_id
    where h.owner_id = auth.uid()
  ))
  with check (meal_plan_item_id in (
    select mpi.id from public.meal_plan_items mpi
    join public.meal_plans mp on mp.id = mpi.meal_plan_id
    join public.households h on h.id = mp.household_id
    where h.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- grocery_lists / grocery_items
-- ---------------------------------------------------------------------------

create table public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null unique references public.meal_plans (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.grocery_lists enable row level security;

create policy "grocery_lists: all for owning household"
  on public.grocery_lists for all
  using (meal_plan_id in (
    select mp.id from public.meal_plans mp
    join public.households h on h.id = mp.household_id
    where h.owner_id = auth.uid()
  ))
  with check (meal_plan_id in (
    select mp.id from public.meal_plans mp
    join public.households h on h.id = mp.household_id
    where h.owner_id = auth.uid()
  ));

create table public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null references public.grocery_lists (id) on delete cascade,
  -- null for a custom (user-typed) item.
  ingredient_id text references public.ingredients (id),
  canonical_name text not null,
  category text not null,
  total_grams numeric,
  display_quantity text,
  checked boolean not null default false,
  pantry boolean not null default false,
  is_custom boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index grocery_items_grocery_list_id_idx on public.grocery_items (grocery_list_id);

alter table public.grocery_items enable row level security;

create policy "grocery_items: all for owning household"
  on public.grocery_items for all
  using (grocery_list_id in (
    select gl.id from public.grocery_lists gl
    join public.meal_plans mp on mp.id = gl.meal_plan_id
    join public.households h on h.id = mp.household_id
    where h.owner_id = auth.uid()
  ))
  with check (grocery_list_id in (
    select gl.id from public.grocery_lists gl
    join public.meal_plans mp on mp.id = gl.meal_plan_id
    join public.households h on h.id = mp.household_id
    where h.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- upsert_meal_plan — atomic (re)write of a whole week
-- ---------------------------------------------------------------------------

-- `p_items` shape: [{ day_index, recipe_id, kind, portions: [{ household_member_id,
-- portion_summary, calories, protein_g, carbs_g, fat_g, scaled_ingredients,
-- warnings, calculation_version }] }]
create function public.upsert_meal_plan(
  p_household_id uuid,
  p_week_start date,
  p_source text,
  p_preferences jsonb,
  p_estimated_cost numeric,
  p_items jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_plan_id uuid;
  v_item jsonb;
  v_item_id uuid;
  v_portion jsonb;
begin
  if not exists (select 1 from public.households where id = p_household_id and owner_id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  insert into public.meal_plans (household_id, week_start, source, preferences_snapshot, estimated_cost)
  values (p_household_id, p_week_start, p_source, p_preferences, p_estimated_cost)
  on conflict (household_id, week_start) do update set
    source = excluded.source,
    preferences_snapshot = excluded.preferences_snapshot,
    estimated_cost = excluded.estimated_cost,
    status = 'active',
    updated_at = now()
  returning id into v_plan_id;

  -- A regenerated week is a clean slate: old items/portions (cascade) and any
  -- built grocery list are cleared so nothing stale survives.
  delete from public.meal_plan_items where meal_plan_id = v_plan_id;
  delete from public.grocery_lists where meal_plan_id = v_plan_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.meal_plan_items (meal_plan_id, day_index, recipe_id, kind)
    values (v_plan_id, (v_item ->> 'day_index')::int, v_item ->> 'recipe_id', v_item ->> 'kind')
    returning id into v_item_id;

    for v_portion in select * from jsonb_array_elements(coalesce(v_item -> 'portions', '[]'::jsonb))
    loop
      insert into public.member_portions (
        meal_plan_item_id, household_member_id, portion_summary,
        calories, protein_g, carbs_g, fat_g, scaled_ingredients, warnings, calculation_version
      ) values (
        v_item_id,
        (v_portion ->> 'household_member_id')::uuid,
        v_portion ->> 'portion_summary',
        (v_portion ->> 'calories')::numeric,
        (v_portion ->> 'protein_g')::numeric,
        (v_portion ->> 'carbs_g')::numeric,
        (v_portion ->> 'fat_g')::numeric,
        coalesce(v_portion -> 'scaled_ingredients', '[]'::jsonb),
        (select coalesce(array_agg(w), '{}') from jsonb_array_elements_text(coalesce(v_portion -> 'warnings', '[]'::jsonb)) w),
        v_portion ->> 'calculation_version'
      );
    end loop;
  end loop;

  return v_plan_id;
end;
$$;

grant execute on function public.upsert_meal_plan(uuid, date, text, jsonb, numeric, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- replace_meal_plan_item — atomic single-meal swap
-- ---------------------------------------------------------------------------

create function public.replace_meal_plan_item(
  p_item_id uuid,
  p_recipe_id text,
  p_kind text,
  p_portions jsonb
) returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_owned boolean;
  v_portion jsonb;
begin
  select exists (
    select 1 from public.meal_plan_items mpi
    join public.meal_plans mp on mp.id = mpi.meal_plan_id
    join public.households h on h.id = mp.household_id
    where mpi.id = p_item_id and h.owner_id = auth.uid()
  ) into v_owned;

  if not v_owned then
    raise exception 'not authorized';
  end if;

  update public.meal_plan_items
  set recipe_id = p_recipe_id, kind = p_kind, updated_at = now()
  where id = p_item_id;

  delete from public.member_portions where meal_plan_item_id = p_item_id;

  for v_portion in select * from jsonb_array_elements(coalesce(p_portions, '[]'::jsonb))
  loop
    insert into public.member_portions (
      meal_plan_item_id, household_member_id, portion_summary,
      calories, protein_g, carbs_g, fat_g, scaled_ingredients, warnings, calculation_version
    ) values (
      p_item_id,
      (v_portion ->> 'household_member_id')::uuid,
      v_portion ->> 'portion_summary',
      (v_portion ->> 'calories')::numeric,
      (v_portion ->> 'protein_g')::numeric,
      (v_portion ->> 'carbs_g')::numeric,
      (v_portion ->> 'fat_g')::numeric,
      coalesce(v_portion -> 'scaled_ingredients', '[]'::jsonb),
      (select coalesce(array_agg(w), '{}') from jsonb_array_elements_text(coalesce(v_portion -> 'warnings', '[]'::jsonb)) w),
      v_portion ->> 'calculation_version'
    );
  end loop;

  -- The grocery list no longer reflects this item's ingredients — cleared so
  -- the next visit rebuilds it (CLAUDE.md §3 "replacing a meal must ...
  -- update grocery quantities").
  delete from public.grocery_lists where meal_plan_id = (
    select meal_plan_id from public.meal_plan_items where id = p_item_id
  );
end;
$$;

grant execute on function public.replace_meal_plan_item(uuid, text, text, jsonb) to authenticated;
