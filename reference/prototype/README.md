# PortionPair

Production foundation and first vertical slice for PortionPair, built from the locked v0.2.2 design-system and product-screen canvases in this workspace.

## Included flow

The implemented flow starts at the final household setup step and ends on the generated weekly-plan dashboard. Users can select dietary preferences, manage avoided foods, set budget and dinner count, choose cooking time, generate a plan, browse planned days, switch the visible household portion, and return to edit preferences.

The plan generator is intentionally local and deterministic for this first slice. Its interface is isolated in `src/domain/mealPlan.ts` so an API-backed planner can replace it without changing presentation components.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Verify

```bash
npm run check
npm test
npm run build
npm run preview
```

The source design artifacts remain unchanged. Current implementation code lives under `src/`, while the original packaged photography is imported directly from `assets/` and copied into the production bundle by Vite.
