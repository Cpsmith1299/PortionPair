# PortionPair

**Same meals. Different goals.**

One shared weekly dinner plan for a two-person household, with different portions
calculated for each person from their individual calorie and macro targets. Cook
the same recipes, shop from one combined list, skip the separate meals.

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

Then open http://localhost:3000. The app redirects to `/onboarding`.

No environment variables are needed for the current slice — the planner is local
and deterministic, and there is no database, AI, or billing yet. See
[.env.example](.env.example) for the variables each later milestone introduces.

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

## What is still mocked

- **The planner.** `DeterministicPlanner` serves a seven-meal fixture catalog. It
  does not filter by diet or allergy — real enforcement belongs to the verified
  recipe domain in Milestone 3 and must not be faked earlier.
- **Nutrition figures.** Only "Lemon herb chicken bowls" carries portion numbers,
  because those are the only figures approved in the brief. No calories or macros
  are invented for the other meals.
- **Persistence.** The generated plan lives in `sessionStorage`
  (`features/planning/plan-store.tsx`) until Supabase lands. There are no
  accounts, and no household is stored.
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
