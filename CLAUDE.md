# PortionPair — Claude Code Project Handoff

**Status:** Consolidated product and engineering brief  
**Canonical product name:** PortionPair  
**MVP audience:** Fitness-conscious couples and two-person households  
**Primary platform:** Mobile-first responsive web application  
**Canonical production architecture:** Next.js full-stack application with Supabase  

This document consolidates the product, UX, visual-design, technical, commercial, and implementation decisions made so far. It is intended to be placed in a new repository and given to Claude Code as the source-of-truth project brief.

---

## 1. Product in one paragraph

PortionPair creates one shared weekly dinner plan for a couple, then calculates different portions for each person based on their individual calorie and macronutrient targets. The household cooks the same recipes, shops from one combined grocery list, and avoids preparing separate meals. The core problem is not simply meal planning; it is coordinating shared meals for people with different nutrition goals.

### Core positioning

- Product tagline: **Same meals. Different goals.**
- Approved brand line: **Same meal, same table.**
- Functional promise: **One meal. Personalized portions. Less planning.**
- Job to be done: “Help us plan, shop for, and cook the same meals while following our individual nutrition goals.”

### The three questions the product must always answer

1. What are we cooking?
2. How much should each person eat?
3. What do we need to buy?

Features that do not materially improve one of those answers should be questioned before being added.

---

## 2. Problem, customer, and value proposition

### Initial customer

The first product is for fitness-conscious couples or two-person households who:

- Live and eat together.
- Have different calorie or macro targets.
- Cook several dinners at home each week.
- Want to eat healthier without making separate recipes.
- Currently coordinate using spreadsheets, calorie trackers, notes, or manual calculations.

Example: one partner needs about 2,700 calories and 180 g of protein per day, while the other needs about 1,800 calories and 120 g of protein. They want the same chicken bowl for dinner, but not the same serving.

### Why it is different

Most meal-planning apps answer, “What should I eat?” PortionPair answers, “What should we cook, and how much should each of us eat?”

The differentiation is the combination of:

- One shared menu.
- Individual portions and nutrition targets.
- One consolidated grocery list.
- Ingredient reuse, leftovers, and reduced food waste.
- The ability to replace one meal without rebuilding the whole week.

### Expansion later

Potential later audiences include families, roommates, coaches, trainers, dietitians operating within their scope, and meal-preparation businesses. The MVP remains deliberately focused on two people.

---

## 3. Locked MVP scope

The MVP must prove that users value **shared meals plus personalized portions** and return the following week.

### Accounts and households

- Email registration and login.
- One household per account in the initial release.
- One profile for free accounts; up to two profiles for Plus.
- Household and member preferences stored separately.
- Supabase Row Level Security must prevent cross-household data access.

### Onboarding

Collect:

- Household name and goals.
- Member name and basic profile.
- Daily calorie target.
- Protein, carbohydrate, and fat targets.
- Manual target entry or an editable in-app estimate.
- Dietary style.
- Allergies and foods to avoid.
- Disliked foods.
- Favorite cuisines and spice preference.
- Weekly dinner count: 3–7.
- Maximum cooking time.
- Cooking skill.
- Weekly grocery budget.
- Leftover preference.
- Preference for ingredient reuse versus variety.

Targets produced by a calculator must always be editable. The product must not present itself as medical nutrition therapy.

### Meal planning

- Start with shared dinners, not full-day meal planning.
- Free: one three-day plan per month.
- Plus: full seven-day plan.
- The weekly view always covers seven days.
- Days beyond the selected number of newly cooked dinners become **Leftovers night** rather than disappearing.
- Every planned dinner includes recipe information, total household ingredients, cooking time, dietary tags, estimated cost, and individual portions.
- Users can replace one meal without regenerating the entire week.
- Users can adjust portions and servings.
- Users can favorite recipes and save or reuse previous weeks.

### Grocery list

- Combine repeated ingredients across the active plan.
- Scale quantities to total household needs.
- Group by produce, protein, dairy and eggs, grains and bakery, canned goods, frozen, pantry, spices/condiments, and other.
- Allow check-off, already-owned/pantry state, custom items, reset, print, and export.
- Show grocery price as an estimated range, not an exact promise.
- Replacing a meal must eventually update grocery quantities. The high-fidelity prototype intentionally did not calculate this; production must.

### Commercial features

- Pricing page.
- Stripe-hosted Checkout.
- Stripe webhooks as the subscription source of truth.
- Stripe Customer Portal for billing changes and cancellation.
- Free and PortionPair Plus entitlements enforced on the server.

### Safety and trust

- Allergies displayed prominently.
- Users told to verify packaged-food labels.
- Nutrition values labeled as estimates that can vary by brand and cooking method.
- General meal-planning disclaimer; no diagnosis or treatment recommendations.
- Do not use words such as “guaranteed” for macro accuracy.
- Never let the AI invent nutrition numbers.

---

## 4. Explicitly out of scope for MVP

Do not delay the MVP for:

- Native iOS or Android apps.
- Households larger than two.
- Breakfast, lunch, snacks, or full-day planning as a primary workflow.
- Grocery delivery or retailer integrations.
- Instacart/Amazon Fresh fulfillment.
- Real-time supermarket pricing.
- Barcode scanning.
- Automatic pantry inventory.
- Wearable or fitness-platform integrations.
- Restaurant planning.
- Coach or dietitian dashboards.
- Public recipes, feeds, social voting, or community features.
- Separate user accounts collaborating in real time.
- Medical or therapeutic nutrition plans.
- A custom payment system.
- A separate Python service, microservices, or machine learning for portioning.
- Unlimited AI-created recipes from arbitrary ingredients.

---

## 5. Pricing decision

### Free — $0

- One household member.
- One three-day plan per month.
- Basic grocery list.
- Limited replacements.

### PortionPair Plus — $7.99/month or $59/year

- Two household profiles.
- Seven-day plans.
- Individual calorie and macro targets.
- Personalized portions.
- Unlimited meal replacements.
- Serving adjustments.
- Favorites and saved weeks.
- Leftover optimization.
- Combined grocery lists.

A larger family tier was discussed but is deferred until the couples product shows retention.

---

## 6. Product principles and success criteria

### Product principles

- **Household first:** major features should make planning for multiple people easier.
- **Cook once, serve differently:** reinforce the idea throughout the UI.
- **Simple before powerful:** users should not need nutrition expertise.
- **Editable, not rigid:** changing one meal or portion should not destroy the week.
- **Transparent estimates:** nutrition, cost, and quantities are estimates.
- **Fast time to value:** first plan in under ten minutes; the focused setup portion should feel closer to five minutes.
- **One primary action per screen:** limit clutter and decision fatigue.
- **Progressive disclosure:** lead with the meal and practical portions; reveal detailed macros when needed.

### Primary hypothesis

Couples with different nutrition goals will pay for a product that lets them cook the same meals while receiving personalized portions and one combined grocery list.

### MVP release is complete when a user can

1. Create an account.
2. Create a household with two profiles.
3. Enter separate nutrition goals and food restrictions.
4. Generate a shared seven-day dinner plan.
5. See each person’s portion.
6. Open the recipe and cooking instructions.
7. Replace an unwanted meal.
8. See the grocery list update.
9. Adjust portions.
10. Save the week.
11. Subscribe through Stripe.
12. Return later and retrieve the saved plan.

### Metrics

- Activation: registered user completes onboarding and generates a plan; initial target 60%.
- Plans generated and failed generations.
- Meals replaced and portion adjustments.
- Grocery lists opened and checked.
- Favorites and saved-week reuse.
- Seven-to-fourteen-day plan regeneration.
- Free-to-paid conversion and monthly versus annual mix.
- Cancellation rate.
- AI generation cost per plan.
- Reported allergy conflicts, nutrition issues, duplicate ingredients, or impractical portions.

The decisive early retention question is whether the household creates another plan the next week.

---

## 7. Canonical production technology stack

Build one TypeScript repository.

| Layer | Decision |
|---|---|
| Product platform | Mobile-first responsive web app |
| Framework | Next.js App Router + TypeScript |
| UI styling | Tailwind CSS plus selectively adopted shadcn/ui/Radix primitives |
| Server | Next.js Server Actions and Route Handlers |
| Validation | Schema validation at every server boundary; choose a mainstream TypeScript schema library |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | Supabase Row Level Security plus server-side entitlement checks |
| AI | OpenAI Responses API with structured outputs |
| Nutrition source | USDA FoodData Central API plus normalized local ingredient records |
| Billing | Stripe Checkout, webhooks, and Customer Portal |
| Hosting | Vercel |
| Email | Resend |
| Product analytics | PostHog |
| Error monitoring | Sentry |
| Testing | Unit, component, integration, and a small end-to-end critical-path suite |

Do not pin framework versions in this brief. Use compatible stable versions at project creation time and commit the lockfile.

### Important reconciliation: Next.js versus Vite

A working UI prototype was later built with React 19, TypeScript, Vite, Vitest, and Testing Library. That prototype validated the design tokens, responsive shell, onboarding setup interaction, deterministic plan generator, seven-day dashboard, leftovers logic, error/retry behavior, and accessible tab navigation.

**Vite is the prototype implementation, not a replacement for the production architecture decision.** For the new production repository:

- Use Next.js as the application framework.
- Reuse or port the prototype’s tokens, domain interfaces, validation rules, tests, and presentation patterns.
- Do not blindly copy Vite bootstrapping or browser-only domain behavior.
- Keep the local deterministic plan generator behind an interface so it can serve development/demo data while the real server-backed planner is built.

---

## 8. Core system flow

```text
Account and household profiles
        ↓
Dietary constraints, targets, budget, schedule
        ↓
Eligible recipes from a verified catalog
        ↓
AI proposes a structured weekly combination
        ↓
Server validates schema, allergens, and restrictions
        ↓
Deterministic nutrition engine calculates nutrients
        ↓
Portion optimizer adjusts protein and carbohydrate amounts
        ↓
Plan validator checks tolerance, practicality, and cost
        ↓
Plan and member portions are persisted
        ↓
Combined grocery list is calculated from normalized ingredients
        ↓
User reviews, replaces meals, adjusts portions, shops, and saves
```

### AI responsibilities

Use AI for:

- Selecting compatible meals from eligible candidates.
- Creating variety across the week.
- Drafting or adapting readable cooking instructions.
- Suggesting safe substitutions from approved options.
- Explaining portion differences.

AI must return a schema-constrained object. Validate it on the server before saving or rendering.

### Deterministic code responsibilities

Use application code and verified data for:

- Calories and macronutrients.
- Ingredient and serving conversions.
- Portion calculations.
- Grocery quantities.
- Budget estimates.
- Macro-target tolerance.
- Allergy and dietary restriction enforcement.
- Subscription entitlements.

### Portioning approach for MVP

Start with explainable TypeScript rules:

1. Begin with a standard recipe serving.
2. Scale the primary protein.
3. Scale the primary carbohydrate.
4. Keep vegetable portions relatively consistent.
5. Keep fats, sauces, and garnishes within practical bounds.
6. Accept a configurable target tolerance, initially around ±5% where practical.
7. Reject implausibly small, large, or awkward household portions.

Optimization goals, in priority order:

- Minimize distance from calorie and protein targets.
- Avoid dietary and allergy conflicts.
- Minimize separate ingredients and cooking divergence.
- Reduce grocery cost and waste.
- Avoid excessive or stigmatizing portion differences.

No separate Python optimizer is required for MVP.

### Recipe strategy

Begin with approximately 40–75 curated recipes containing:

- Verified ingredients and FoodData Central mappings.
- Normalized units and serving sizes.
- Verified calories and macros.
- Preparation and cooking times.
- Dietary and allergen tags.
- Substitution rules.
- Tested instructions.

The app should assemble and resize this trusted catalog before allowing open-ended recipe generation.

---

## 9. Suggested data model

Use UUID primary keys, timestamps, explicit ownership, and database migrations. Exact naming can evolve, but preserve these concepts.

### Identity and households

- `profiles`: application profile linked to the Supabase auth user.
- `households`: owner, name, settings, plan tier.
- `household_members`: name, display order, profile color, personal details.
- `nutrition_targets`: calories, protein, carbohydrates, fat, calculation method, effective date.
- `dietary_preferences`: dietary style, allergies, avoidances, cuisines, spice level.
- `household_preferences`: dinner count, time limit, skill, budget, leftovers, variety/reuse.

### Recipes and nutrition

- `recipes`: name, description, instructions, times, yield, source/status, tags.
- `ingredients`: canonical ingredient, default unit, USDA/FDC mapping, allergen metadata.
- `recipe_ingredients`: recipe, ingredient, quantity, unit, preparation note, optional/substitution group.
- `ingredient_nutrients`: normalized nutrient values and provenance.
- `recipe_images`: packaged/local asset metadata and alt text.

### Plans and portions

- `meal_plans`: household, week start, status, source, preferences snapshot, estimated cost.
- `meal_plan_items`: day, slot, recipe, state, replacement lineage, cooked state.
- `member_portions`: plan item, member, per-ingredient quantities, serving weight, calories, macros.
- `favorites`: household or user, recipe.
- `saved_plans` or durable completed-plan state.

### Grocery and billing

- `grocery_lists`: linked plan, status, estimated range.
- `grocery_items`: canonical ingredient, combined quantity/unit, category, checked, pantry-owned, custom.
- `grocery_item_sources`: list item to contributing meal-plan item.
- `subscriptions`: customer/subscription IDs, product/price, status, period dates.
- `stripe_events`: webhook idempotency and audit status.

### Recommended constraints

- A member belongs to exactly one household.
- A plan belongs to one household and retains a preference/target snapshot.
- A plan item replacement is transactional: update plan item, portions, nutrition summary, and grocery list together.
- Store nutrition provenance and calculation version for reproducibility.
- Store quantities in normalized base units; convert only for display.
- Never expose service-role, OpenAI, USDA, or Stripe secrets to the browser.

---

## 10. Information architecture and user flows

### Public navigation

- Home
- How It Works
- Pricing
- Log In
- Get Started

### Authenticated navigation — approved product screens

Desktop persistent navigation and mobile bottom navigation:

- Week
- Grocery
- Favorites
- Profile

History, household management, billing, and settings can live under Profile/Household until they deserve primary navigation.

### First-time flow

```text
Landing
→ Pricing or Get Started
→ Sign Up
→ Welcome
→ Household Setup
→ Person 1 Profile
→ Person 1 Preferences
→ Person 2 Profile
→ Person 2 Preferences
→ Household Meal Preferences
→ Review
→ Generate Plan
→ This Week
→ Meal Details / Portion Comparison
→ Grocery List
```

### Returning flow

```text
Log In
→ This Week
→ Review, replace, or adjust meals
→ Grocery List
→ Cook
→ Generate or duplicate next week
```

### Free-to-paid flow

```text
Attempt paid feature
→ Contextual upgrade prompt
→ Stripe Checkout
→ Stripe webhook confirms entitlement
→ Return to the requested feature
```

### Six locked high-fidelity screen families

1. Onboarding and plan setup.
2. Weekly plan dashboard.
3. Replace a meal.
4. Meal details and cooking view.
5. Portion comparison.
6. Grocery list.

The replacement flow must keep the dashboard, meal details, portion comparison, nutrition summary, and grocery list consistent.

---

## 11. Design system — locked foundation

The visual direction is approved. Do not re-explore or substitute another style.

### Product feel

- Warm, calm, premium, modern, smooth, food-focused, practical, and trustworthy.
- Supportive rather than restrictive.
- Not clinical, sterile, bodybuilding-oriented, childish, futuristic, crowded, or generic SaaS.

### Visual approach

- Warm neutral surfaces.
- Herb-green primary actions.
- Burgundy/plum as a restrained profile/secondary accent.
- Daylight, natural, attainable domestic food photography.
- Rounded outline icons.
- Restrained elevation and generous space.
- Quantity-first portion display; detailed macros are secondary.

### Canonical code tokens recovered from the validated prototype

```css
:root {
  --color-action-primary: #3d7551;
  --color-action-hover: #2e5c40;
  --color-action-pressed: #234a33;
  --color-action-subtle: #eef4ee;
  --color-action-disabled: #e6e1d6;

  --color-text-primary: #1c2620;
  --color-text-body: #38423c;
  --color-text-secondary: #4f5a53;
  --color-text-tertiary: #636c65;
  --color-text-disabled: #79817a;

  --color-surface-page: #f0ede4;
  --color-surface-canvas: #fbf9f5;
  --color-surface-raised: #ffffff;
  --color-surface-sunken: #f4f1ea;
  --color-surface-inverse: #1a3726;

  --color-border-default: #e6e1d6;
  --color-border-soft: #efe9dc;
  --color-border-control: #948a70;

  --color-feedback-success: #2e7d5b;
  --color-feedback-success-surface: #eaf4ee;
  --color-feedback-success-border: #b4cfb9;
  --color-feedback-error: #a8362b;
  --color-feedback-error-text: #8a2a21;
  --color-feedback-error-surface: #fbedeb;

  --color-profile-charlie: #1f6d6a;
  --color-profile-sam: #9b3b63;

  --font-display: 'Newsreader', Georgia, serif;
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  --radius-sm: 0.5rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.875rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.125rem;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgb(28 38 32 / 8%);
  --shadow-card: 0 1px 3px rgb(28 38 32 / 6%);
  --shadow-overlay: 0 16px 36px rgb(28 38 32 / 12%);

  --content-max: 74rem;
  --motion-fast: 140ms;
  --motion-normal: 220ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

Breakpoints:

- Compact: 30rem.
- Tablet: 48rem.
- Desktop persistent navigation: 64rem.

### Typography use

- Plus Jakarta Sans for functional interface text.
- Newsreader only for limited brand/editorial moments.
- IBM Plex Mono for portions, calories, prices, and quantities when the monospaced treatment improves scanning.
- Sentence case; avoid excessive capitalization.

### Motion

Fluidity is a top brand requirement, but motion must communicate state or preserve context.

Use motion for:

- Button hover and press feedback.
- Selected cards and chips.
- Profile switching.
- Portion changes.
- Meal replacement.
- Grocery completion and category disclosure.
- Loading-to-loaded plan transitions.
- Bottom sheets and dialogs.

Avoid constant animation, exaggerated bounce, large parallax, glow effects, or decorative motion. Respect `prefers-reduced-motion` and provide equivalent non-animated state changes.

### Accessibility

- WCAG AA contrast for normal text.
- At least 44×44 CSS-pixel interactive targets, including transparent hit areas where appropriate.
- Visible keyboard focus, at least the approved three-pixel treatment.
- Semantic headings, landmarks, forms, labels, dialogs, tabs, disclosures, and status messages.
- Roving focus for tabs: arrows move focus and selection; one `tabindex="0"`.
- Dialog focus enters, traps, closes with Escape, and returns to its trigger.
- Selection and portion differences must not rely on color alone.
- No document-level horizontal overflow at 320 px or 200% zoom.
- Useful alt text for food images; missing-image state must be a deliberate UI state, not a failed request.

---

## 12. Representative product data

Use this household and meal consistently in demos and fixtures.

### Household

**Charlie**

- Green profile treatment.
- Larger of the two dinner portions.

**Sam**

- Burgundy profile treatment.
- Smaller of the two dinner portions.

Do not label either portion good, bad, excessive, restrictive, or morally superior.

### Featured meal

**Lemon herb chicken bowls**

- 30 minutes.
- High protein.
- Gluten-free.
- About $4.80 per serving.

Charlie:

- 6 oz chicken.
- 1½ cups rice.
- 1 cup roasted vegetables.
- 2 tbsp dressing.
- Approximately 720 calories.

Sam:

- 4 oz chicken.
- 1 cup rice.
- ¾ cup roasted vegetables.
- 1½ tbsp dressing.
- Approximately 540 calories.

Additional accepted example meals:

- Miso salmon with sesame greens.
- Turkey pesto pasta.
- Roasted vegetable tacos.
- Ginger beef lettuce bowls.
- Creamy tomato orzo.
- Sheet-pan chicken fajitas.

---

## 13. Existing approved artifacts and prototype

### Locked design handoff

The final package is named:

`PortionPair Product Screens v0.2.2.zip`

It contains:

- `PortionPair Design System v0.2.2.dc.html`
- `PortionPair Product Screens v0.2.2.dc.html`
- A frozen offline design-system HTML reference.
- `START HERE.md`
- Packaged food photography and supporting assets.
- Superseded explorations in an archive folder.

The package was reviewed for offline rendering, responsive behavior, keyboard interaction, modal focus, 44px targets, image loading, and 320px reflow. The visual direction is locked.

### Working React/Vite vertical slice

A separate prototype currently implements:

- Final household plan setup.
- Dietary selections and avoided foods.
- Budget, dinner count, and cook-time controls.
- Validation, disabled, loading, error, retry, and success states.
- A deterministic local seven-day plan generator.
- Leftovers nights beyond the chosen dinner count.
- Weekly dashboard, day selection, and Charlie/Sam portion tabs.
- Responsive navigation.
- Business logic separated from presentation.
- Seven passing business-rule and interaction tests.
- Type check and production build.

Prototype validation rules currently include:

- At least one dietary preference.
- Minimum $50 weekly budget for two people.
- Avoided foods cannot be blank or duplicated case-insensitively.
- The week always contains seven days.
- Arrow keys move focus and selection between member tabs.

Treat this prototype as reusable reference code, not the production repository architecture.

---

## 14. Recommended repository shape

```text
portionpair/
├── app/
│   ├── (marketing)/
│   ├── (auth)/
│   ├── onboarding/
│   ├── week/
│   ├── meals/[mealPlanItemId]/
│   ├── grocery/
│   ├── favorites/
│   ├── profile/
│   ├── api/
│   │   ├── stripe/webhook/
│   │   └── ...
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── meal/
│   ├── portions/
│   ├── grocery/
│   └── navigation/
├── features/
│   ├── onboarding/
│   ├── planning/
│   ├── replacement/
│   ├── portions/
│   ├── grocery/
│   └── billing/
├── lib/
│   ├── ai/
│   ├── nutrition/
│   ├── optimization/
│   ├── groceries/
│   ├── stripe/
│   └── supabase/
├── domain/
│   ├── recipes/
│   ├── meal-plans/
│   ├── portions/
│   └── households/
├── types/
├── tests/
└── supabase/
    ├── migrations/
    └── seed.sql
```

Keep domain calculations free of React, browser globals, database clients, and AI SDK calls. Put external integrations behind typed interfaces.

---

## 15. Implementation sequence

### Milestone 0 — Repository and design foundation

- Inspect all design and prototype artifacts before coding.
- Scaffold Next.js and TypeScript.
- Configure linting, formatting, type checking, tests, and environment validation.
- Port locked design tokens and fonts.
- Create the responsive app shell and accessible primitives needed by the first slice.
- Document environment variables without committing secrets.

### Milestone 1 — First production vertical slice

Port the validated flow:

```text
Final plan setup
→ validation
→ loading/error/retry
→ deterministic seven-day plan
→ weekly dashboard
→ day selection
→ member portion switching
→ edit preferences
```

Use server-safe domain interfaces even while the generator is deterministic. This produces a reviewable app quickly and validates the Next.js foundation.

### Milestone 2 — Authentication and persisted households

- Supabase project configuration.
- Migrations and RLS.
- Sign up, login, password reset, and protected routes.
- Household and two member profiles.
- Persisted onboarding and preference snapshots.

### Milestone 3 — Trusted recipe and nutrition domain

- Ingredient normalization and USDA/FDC mapping.
- Curated starter recipe catalog.
- Deterministic nutrient calculations and unit conversions.
- Portion rules, tolerances, and explainable validation.

### Milestone 4 — Real planning flow

- Structured AI proposal from eligible recipes.
- Server validation and fallback behavior.
- Persisted plans and member portions.
- Meal details and cooking view.
- Replace-meal transaction.
- Grocery-list aggregation and recalculation.

### Milestone 5 — Retention and monetization

- Favorites and saved weeks.
- Plan duplication.
- Stripe Checkout, webhook idempotency, portal, and entitlements.
- Resend transactional email.
- PostHog funnel/retention events.
- Sentry server/client monitoring with sensitive-data scrubbing.

### Milestone 6 — Private beta

- Recruit 10–20 couples.
- Measure onboarding completion, plan quality, replacements, grocery accuracy, weekly return, and willingness to pay.
- Fix product-quality issues before expanding feature scope.

---

## 16. Testing and definition of quality

At minimum, test:

### Domain/unit

- Nutrition aggregation and unit conversion.
- Portion scaling and tolerance.
- Allergy and dietary filtering.
- Dinner-count/leftovers behavior.
- Ingredient consolidation.
- Replacement recalculates portions, totals, and groceries.
- Subscription entitlement rules.
- Duplicate webhook handling.

### Component/integration

- Onboarding validation and resume behavior.
- Loading, failure, retry, and empty states.
- Keyboard member/day tabs.
- Dialog focus management.
- Grocery disclosures and check-off.
- Portion adjustment updates visible nutrition and quantities.

### End to end

- Sign up → onboarding → generate → view portions → replace → grocery list.
- Free user hits paid limit → Checkout → webhook entitlement → requested feature unlocked.
- Returning user retrieves a saved week.

### Nonfunctional acceptance

- Type check, lint, tests, and production build pass.
- No secrets in browser bundles or source control.
- RLS verified with cross-household negative tests.
- No console/runtime errors in the critical path.
- No broken images.
- No horizontal overflow at 320 px or 200% zoom.
- Mobile, tablet, and desktop checked visually.
- Keyboard-only critical path works.
- Reduced-motion behavior works.
- Server errors are safe, actionable, and observable.

---

## 17. Security, privacy, and operational rules

- Treat diet, allergy, wellness, and goal data as sensitive.
- Collect only data the feature needs.
- Keep OpenAI, USDA, Stripe, Resend, and Supabase service credentials server-side.
- Validate and authorize every mutation on the server.
- Use RLS as defense in depth, not as the only validation layer.
- Verify Stripe webhook signatures and make processing idempotent.
- Do not send unnecessary personally identifying or health-related data to the AI provider.
- Log calculation versions and external-data provenance, not raw secrets.
- Scrub sensitive context from analytics and error reports.
- Support account deletion and a clear privacy policy before public launch.

---

## 18. Decisions intentionally still open

Claude Code may make conservative, documented choices for these without stopping unless the choice materially changes the product:

- Exact stable package versions.
- Exact TypeScript validation, unit-conversion, test-runner, and end-to-end libraries.
- Whether shadcn/ui is installed wholesale or only selected primitives are copied.
- Exact OpenAI model, selected by quality, latency, and a strict cost ceiling.
- Exact calorie/macro estimation formula, provided it is transparent and editable.
- Final recipe-authoring and administrative workflow.
- Exact trial strategy; pricing itself is already decided.

Do not invent medical claims, expand beyond two-person dinners, introduce a separate backend, or change the locked visual direction under the guise of resolving an open choice.

---

# Claude Code start prompt

You are building the production version of **PortionPair** from this handoff and the supplied locked design/prototype artifacts.

Read this entire document and inspect every supplied artifact before changing files. Treat the locked PortionPair Design System v0.2.2 and Product Screens v0.2.2 as the visual and interaction source of truth. Treat the React/Vite vertical slice as validated reference code. The canonical production architecture is a single Next.js App Router + TypeScript repository backed by Supabase; do not retain Vite as the production framework unless the human explicitly changes that decision.

Begin by reporting:

1. What artifacts and source code are present.
2. Which decisions are locked.
3. Any contradictions between the artifacts and this handoff.
4. The smallest production vertical slice you will implement first.

Then proceed unless a missing decision would materially change the product.

Your first delivery should:

- Scaffold or normalize a production-quality Next.js TypeScript repository.
- Port the locked design tokens, fonts, responsive shell, focus behavior, and motion/reduced-motion rules.
- Port the validated final setup → generate → weekly dashboard flow.
- Keep planning/business logic framework-independent and behind a typed planner interface.
- Use the deterministic local planner initially, with seven days and leftovers beyond the selected dinner count.
- Include validation, loading, disabled, error, retry, empty, and success behavior.
- Be responsive and keyboard accessible at mobile, tablet, and desktop sizes.
- Add tests for the business rules and interactions already validated in the prototype.
- Document how to install, configure, run, test, and build the app.

Do not:

- Redesign the product.
- Add native apps, families larger than two, full-day meal planning, retailer integrations, or unrelated features.
- Let AI calculate nutrition.
- Expose secrets to client code.
- Stop after only a plan or static mockups.
- Rewrite useful working logic merely for stylistic preference.

Before finishing the first delivery:

- Run type checking, linting, tests, and the production build.
- Inspect the rendered result at approximately 390 px and 1440 px and at the 320 px minimum.
- Verify keyboard navigation, visible focus, reduced motion, 44 px targets, loading/error paths, and no horizontal overflow.
- Fix issues discovered during verification.
- Summarize what changed, what remains mocked, and the exact next milestone.

After the first vertical slice is stable, continue in this order unless directed otherwise: Supabase auth and RLS → persisted households/profiles → curated recipes and nutrition engine → real structured planner → replacement and grocery recalculation → favorites/history → Stripe and launch instrumentation.
