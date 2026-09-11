# PortionPair

**Same meals. Different goals.**

One shared weekly dinner plan for a two-person household, with different portions
calculated for each person from their individual calorie and macro targets. Cook
the same recipes, shop from one combined list, skip the separate meals.

Live: https://portionpair-cpsmith1299smith-7423s-projects.vercel.app (Milestone 2 — auth
and onboarding are real; meals are still a fixture catalog, see "What is still mocked" below)

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
of seven recipes (`domain/recipes/catalog.ts`) built from 27 normalized
ingredients (`domain/recipes/ingredients.ts`), most mapped to a verified USDA
FoodData Central entry and the rest clearly flagged `reference_estimate`
pending backfill. `domain/nutrition/` computes calories and macros
deterministically from those figures; `domain/portions/scale.ts` scales a
recipe's primary protein and carbohydrate toward each member's target within
a configurable tolerance, keeping vegetables/fat/garnish close to baseline and
explaining every bound it has to enforce. `domain/recipes/eligibility.ts`
filters the catalog by diet and avoided foods, and
`domain/groceries/consolidate.ts` combines repeated ingredients into one
total — the normalization payoff. The same catalog is mirrored into Supabase
(`ingredients` / `ingredient_nutrients` / `recipes` / `recipe_ingredients`,
readable by everyone, writable only by the service role) via
`scripts/generate-recipe-seed-sql.ts`, ready for Milestone 4 to query.

## What is still mocked

- **The planner.** `DeterministicPlanner` still serves its own seven-meal
  fixture catalog and does not read `domain/recipes/` yet — wiring the
  verified catalog and portion engine into plan generation, ahead of the
  structured AI proposal step, is Milestone 4.
- **Nutrition figures beyond the starter catalog.** The engine computes real
  numbers for all seven Milestone 3 recipes, but the catalog is a starting
  batch (CLAUDE.md §8 calls for 40–75) and several minor ingredients are
  `reference_estimate` values pending USDA FoodData Central verification —
  see the notes in `domain/recipes/ingredients.ts`.
- **Plan persistence.** Accounts, households, members, and plan preferences
  now persist to Supabase (Milestone 2). The generated plan itself still
  lives in `sessionStorage` (`features/planning/plan-store.tsx`) — `meal_plans`
  / `member_portions` land in Milestone 4.
- **Per-person profiles.** Signup collects a household name and both
  members' names, but not yet individual calorie/macro targets or dietary
  preferences — that's the Person 1/Person 2 profile wizard from CLAUDE.md's
  first-time flow, deliberately deferred past this pass.
- **Navigation.** Grocery, Favorites, and Profile are rendered disabled. Meal
  details, replace-meal, and the grocery list are not built.

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
`Planner` interface in `domain/meal-plans/planner.ts`, so the real pipeline —
eligible recipes → structured AI proposal → server validation → deterministic
nutrition and portion engines — replaces the fixture planner without touching a
single component.

Plan generation runs in a Server Action (`features/planning/actions.ts`) that
validates its input with Zod, so planning never executes in the browser.

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
