-- Milestone 3: trusted recipe and nutrition domain (CLAUDE.md §15, §9).
--
-- This is reference/catalog data, not household data: every household reads
-- the same verified recipes and ingredients, so RLS grants read to everyone
-- and write to no one — the service role (which bypasses RLS) is the only
-- way to add or edit a recipe, matching "final recipe-authoring workflow" as
-- still open per CLAUDE.md §18. Nothing in the app queries these tables yet;
-- the curated starter catalog and the calculation engine that reads it live
-- in `domain/recipes/` and `domain/nutrition/` as the source of truth, with
-- this schema ready for Milestone 4 to persist against.
--
-- Apply via the Supabase SQL editor, the MCP connector, or `supabase db push`
-- once a project is linked with the CLI.

-- ---------------------------------------------------------------------------
-- ingredients
-- ---------------------------------------------------------------------------

create table public.ingredients (
  id text primary key,
  canonical_name text not null,
  default_unit text not null,
  allergens text[] not null default '{}',
  grams_per_cup numeric,
  grams_per_tbsp numeric,
  grams_per_piece numeric,
  created_at timestamptz not null default now()
);

alter table public.ingredients enable row level security;

create policy "ingredients: readable by everyone"
  on public.ingredients for select
  using (true);

-- ---------------------------------------------------------------------------
-- ingredient_nutrients
-- ---------------------------------------------------------------------------

-- One verified nutrient snapshot per ingredient (CLAUDE.md §9 "normalized
-- nutrient values and provenance"). `calculation_version` lets a future
-- reproduction know which engine/data revision produced numbers derived from
-- this row (CLAUDE.md §9 "store ... calculation version for reproducibility").
create table public.ingredient_nutrients (
  ingredient_id text primary key references public.ingredients (id) on delete cascade,
  basis_amount numeric not null default 100,
  basis_unit text not null default 'g',
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  fiber_g numeric not null default 0,
  provenance text not null check (provenance in ('usda_fdc', 'reference_estimate')),
  fdc_id text,
  note text,
  calculation_version text not null default 'nutrition-engine-v1',
  created_at timestamptz not null default now()
);

alter table public.ingredient_nutrients enable row level security;

create policy "ingredient_nutrients: readable by everyone"
  on public.ingredient_nutrients for select
  using (true);

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------

create table public.recipes (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  prep_minutes int not null,
  cook_minutes int not null,
  servings int not null check (servings > 0),
  dietary_tags text[] not null default '{}',
  allergen_tags text[] not null default '{}',
  instructions text[] not null default '{}',
  image_key text,
  image_alt text,
  cost_per_serving numeric,
  status text not null default 'draft' check (status in ('draft', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

create policy "recipes: readable by everyone"
  on public.recipes for select
  using (true);

-- ---------------------------------------------------------------------------
-- recipe_ingredients
-- ---------------------------------------------------------------------------

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references public.recipes (id) on delete cascade,
  ingredient_id text not null references public.ingredients (id) on delete restrict,
  role text not null check (role in ('protein', 'carb', 'vegetable', 'fat', 'other')),
  quantity_amount numeric not null check (quantity_amount > 0),
  quantity_unit text not null,
  preparation_note text,
  is_optional boolean not null default false,
  sort_order int not null default 0
);

create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);

alter table public.recipe_ingredients enable row level security;

create policy "recipe_ingredients: readable by everyone"
  on public.recipe_ingredients for select
  using (true);

-- ---------------------------------------------------------------------------
-- recipe_images
-- ---------------------------------------------------------------------------

-- Metadata only, matching the Design System v0.2.2 assets already packaged
-- under `public/meals/` and resolved by `lib/planning/demo-catalog.ts`.
create table public.recipe_images (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references public.recipes (id) on delete cascade,
  image_key text not null,
  alt_text text not null,
  sort_order int not null default 0
);

create index recipe_images_recipe_id_idx on public.recipe_images (recipe_id);

alter table public.recipe_images enable row level security;

create policy "recipe_images: readable by everyone"
  on public.recipe_images for select
  using (true);
