# PortionPair

**Same meals. Different goals.**

One shared weekly dinner plan for a two-person household, with different portions
calculated for each person from their individual calorie and macro targets. Cook
the same recipes, shop from one combined list, skip the separate meals.

Live: https://portionpair-cpsmith1299smith-7423s-projects.vercel.app (Milestone 4 — the
whole plan → portions → meal details → replace → grocery list flow is real and
persisted; see "What is still mocked" below for what isn't yet)

The full product brief, locked decisions, and milestone sequence live in
[CLAUDE.md](CLAUDE.md). It is the source of truth; this file only covers running
the code.

## Requirements

- Node.js 20.9+ (developed on 24.x)
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000. The app redirects to `/onboarding`, behind
sign-up/login (Milestone 2).

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run every file in `supabase/migrations/`, in filename order, against it —
   paste each into the SQL editor, or `supabase db push` once the CLI is
   linked to the project. There's no local Supabase (Docker) setup in this
   repo; migrations are meant to be applied straight to a hosted project.
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`
   and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API.
4. Optionally, in Authentication → Providers, turn off "Confirm email" for
   faster local testing — sign-up works either way (see "What is still mocked").
5. Milestone 3's recipe/ingredient tables are reference data, not something
   each install needs to author from scratch: after the migration, run
   `npx tsx scripts/generate-recipe-seed-sql.ts` and apply the SQL it prints
   to seed the starter catalog from `domain/recipes/`.

See [.env.example](.env.example) for the variables each later milestone introduces.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest, watch mode |
| `npm run verify` | typecheck → lint → test → build |

Run `npm run verify` before committing.

## What is built

The first production vertical slice:

```
Plan setup → validation → loading/error/retry → deterministic seven-day plan
→ weekly dashboard → day selection → member portion switching → edit preferences
```

Working: dietary chips, avoided-food add/remove with duplicate rejection, budget
and dinner-count steppers, cook-time selection, server-side validation, a
seven-day plan where days past the chosen dinner count become leftovers nights,
roving-focus member and day tabs, and the responsive shell at mobile, tablet, and
desktop.

The trusted recipe and nutrition domain (Milestone 3): a curated starter catalog
of 15 recipes (`domain/recipes/catalog.ts`) built from 38 normalized
ingredients (`domain/recipes/ingredients.ts`) — 31 mapped to a verified USDA
FoodData Central entry, 7 composite sauces/glazes clearly flagged
`reference_estimate` pending a from-scratch breakdown. `domain/nutrition/` computes calories and macros
deterministically from those figures; `domain/portions/scale.ts` scales a
recipe's primary protein and carbohydrate toward each member's target within
a configurable tolerance, keeping vegetables/fat/garnish close to baseline and
explaining every bound it has to enforce. `domain/recipes/eligibility.ts`
filters the catalog by diet and avoided foods, and
`domain/groceries/consolidate.ts` combines repeated ingredients into one
total — the normalization payoff. The same catalog is mirrored into Supabase
(`ingredients` / `ingredient_nutrients` / `recipes` / `recipe_ingredients`,
readable by everyone, writable only by the service role) via
`scripts/generate-recipe-seed-sql.ts`.

The real planning flow (Milestone 4): `CatalogPlanner`
(`lib/planning/catalog-planner.ts`) replaced the fixture planner — it filters
the verified catalog by diet/avoided foods, picks a varied recipe per cooked
night, and scales each member's portion from their *own* nutrition target
(`nutrition_targets`, a new minimal step 2 of onboarding — Milestone 2 had
deferred this, and the portion engine cannot personalize without it; a
member's daily target is scaled to a dinner-sized share before it reaches the
portion engine, per `domain/households/nutrition-targets.ts`). The generated
plan is persisted (`meal_plans` / `meal_plan_items` / `member_portions`,
written atomically through two Postgres functions —
`upsert_meal_plan`/`replace_meal_plan_item` — rather than sequential
client-side inserts) and `sessionStorage` is gone. Built on top of that:
meal-details/cooking view (`/meals/[mealPlanItemId]`, full ingredients and
instructions, per-member breakdown), a working "Replace meal" action, and a
categorized, check-off-able grocery list (`/grocery`) built from
`domain/groceries/consolidate.ts` combining every cooked night's ingredients.
The AI-proposal step CLAUDE.md §15 calls for still slots in behind
`CatalogPlanner`/`Planner` without touching persistence or presentation.

## What is still mocked

- **The AI proposal.** Meal selection is still deterministic (varied, not
  random) rather than a structured AI proposal from OpenAI — the eligible
  catalog and portion engine it will hand off to are real and already wired,
  per `lib/planning/catalog-planner.ts`'s doc comment.
- **Nutrition figures beyond the starter catalog.** The engine computes real
  numbers for all 15 Milestone 3 recipes, but the catalog is a starting batch
  (CLAUDE.md §8 calls for 40–75) and 7 composite sauces/glazes are
  `reference_estimate` values pending a from-scratch or per-brand breakdown —
  see the notes in `domain/recipes/ingredients.ts`.
- **Per-person profiles.** Onboarding now collects each member's daily
  calorie/protein target (just two numbers), but not the full Person 1/Person
  2 profile — dietary style, allergies, cuisines, spice preference — from
  CLAUDE.md's first-time flow, deliberately deferred past this pass.
- **Navigation.** Favorites and Profile are still rendered disabled. Week and
  Grocery are both real now.
- **Grocery list nuance.** A replaced meal clears the whole derived list and
  rebuilds it fresh next visit — custom items survive, but a derived item's
  checked/pantry state does not. There's also no per-ingredient
  "which meals need this" traceability (`grocery_item_sources` from CLAUDE.md
  §9 was deliberately skipped for this slice) and no reset/print/export yet.

## Architecture

```
app/         Routes, root layout, design tokens, global CSS
components/  Presentational primitives (Button, Avatar, Stepper)
features/    Screen-level composition and Server Actions
domain/      Pure business rules — no React, browser globals, DB, or AI SDK
lib/         Adapters behind typed interfaces (the planner today)
tests/       Vitest + Testing Library
```

The rule that matters: **`domain/` stays pure.** Plan generation sits behind the
`Planner` interface in `domain/meal-plans/planner.ts` — `CatalogPlanner`
(`lib/planning/catalog-planner.ts`) implements it today; swapping in a
structured AI proposal ahead of the same eligible-recipe pool and portion
engine won't touch persistence or a single component.

Plan generation, replacement, and grocery mutations all run in Server Actions
(`features/planning/actions.ts`, `features/grocery/actions.ts`) that validate
input with Zod, so none of it executes in the browser. Persistence
(`lib/planning/repository.ts`, `lib/planning/grocery-repository.ts`,
`lib/households/nutrition-targets-repository.ts`) is a separate adapter layer
between the Server Actions and Supabase — `domain/` never imports it.

## Design system

Visual direction is **locked** — Design System v0.2.2. Do not re-explore it.

- Tokens: [app/tokens.css](app/tokens.css), ported verbatim from the approved set
- Source canvases: `design/` (start with `design/START HERE.md`)
- Fonts self-host via `next/font`; there is no third-party font request

The original React/Vite prototype is kept read-only under `reference/prototype/`
as validated reference code. It is excluded from the build, lint, and tests.

## Accessibility baseline

Verified for this slice: no document-level horizontal overflow at 320px, every
interactive target at least 44×44 CSS pixels, the 3px focus treatment on keyboard
focus, roving focus on member and day tabs, focus moved to the error summary on a
failed submit, and `prefers-reduced-motion` honored.
