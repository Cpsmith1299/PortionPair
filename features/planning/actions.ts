'use server';

import { revalidatePath } from 'next/cache';
import { hasValidationErrors, validatePreferences } from '@/domain/meal-plans/preferences';
import type { WeeklyPlan } from '@/domain/meal-plans/types';
import { filterEligibleRecipes } from '@/domain/recipes/eligibility';
import { RECIPE_CATALOG } from '@/domain/recipes/catalog';
import { buildMemberPortion, catalogPlanner } from '@/lib/planning/catalog-planner';
import { getMealPlanItemContext, persistWeeklyPlan, replaceMealPlanItem } from '@/lib/planning/repository';
import { planPreferencesSchema } from '@/lib/planning/schema';
import { getNutritionTargetsForHousehold } from '@/lib/households/nutrition-targets-repository';
import { getHouseholdForUser, upsertHouseholdPreferences } from '@/lib/households/repository';
import { createClient } from '@/lib/supabase/server';

export type GeneratePlanResult = { ok: true; plan: WeeklyPlan } | { ok: false; error: string };
export type ReplaceMealResult = { ok: true } | { ok: false; error: string };

/** Safe, actionable, and identical for every failure mode — no internals leak. */
const GENERIC_FAILURE = 'We couldn’t create the plan. Check your connection and try again.';
const REPLACE_FAILURE = 'We couldn’t replace that meal. Check your connection and try again.';

/**
 * The only entry point into plan generation from the client.
 *
 * Every mutation is validated and authorized on the server (CLAUDE.md §17).
 * Milestone 4: generation now reads the verified recipe catalog (eligible by
 * diet/avoided foods) and each member's real nutrition target, computes
 * personalized portions with the deterministic portion engine, and persists
 * the result to `meal_plans` / `meal_plan_items` / `member_portions` —
 * `sessionStorage` is gone. The AI-proposal step CLAUDE.md §15 calls for
 * still slots in behind `CatalogPlanner`/`Planner` without touching this
 * action or anything downstream of it.
 */
export async function generatePlanAction(input: unknown): Promise<GeneratePlanResult> {
  const parsed = planPreferencesSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: GENERIC_FAILURE };
  }

  // Business rules run server-side too; the client form is a convenience, not a
  // trust boundary.
  if (hasValidationErrors(validatePreferences(parsed.data))) {
    return { ok: false, error: GENERIC_FAILURE };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: GENERIC_FAILURE };
    }

    const household = await getHouseholdForUser(supabase, user.id);
    if (!household) {
      // Provisioned at signup by the handle_new_user trigger — should always
      // exist for an authenticated user. Treated as a failure, not a crash.
      console.error('[planning] no household for authenticated user', user.id);
      return { ok: false, error: GENERIC_FAILURE };
    }

    const memberTargets = await getNutritionTargetsForHousehold(
      supabase,
      household.members.map((member) => member.id),
    );

    const draft = await catalogPlanner.generateWeeklyPlan({
      preferences: parsed.data,
      household,
      weekStart: new Date(),
      memberTargets,
    });

    const plan = await persistWeeklyPlan(supabase, household, draft);
    await upsertHouseholdPreferences(supabase, household.id, parsed.data);

    return { ok: true, plan };
  } catch (cause) {
    // Observable server-side; opaque to the browser.
    console.error('[planning] plan generation failed', cause);
    return { ok: false, error: GENERIC_FAILURE };
  }
}

/**
 * Swaps one meal for a different eligible recipe and recalculates every
 * member's portion for it — a transaction on the database side
 * (`replace_meal_plan_item`), so the slot's recipe and its portions never
 * disagree (CLAUDE.md §9). The grocery list for this plan is invalidated by
 * that same function; `/grocery` rebuilds it from the plan's current items
 * next time it's opened.
 */
export async function replaceMealAction(mealPlanItemId: string): Promise<ReplaceMealResult> {
  if (typeof mealPlanItemId !== 'string' || mealPlanItemId.length === 0) {
    return { ok: false, error: REPLACE_FAILURE };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: REPLACE_FAILURE };

    const household = await getHouseholdForUser(supabase, user.id);
    if (!household) return { ok: false, error: REPLACE_FAILURE };

    const context = await getMealPlanItemContext(supabase, mealPlanItemId);
    if (!context) return { ok: false, error: REPLACE_FAILURE };

    const eligible = filterEligibleRecipes(RECIPE_CATALOG, context.preferences);
    const alternatives = eligible.filter((recipe) => recipe.id !== context.recipeId);
    const pool = alternatives.length > 0 ? alternatives : eligible;
    if (pool.length === 0) return { ok: false, error: REPLACE_FAILURE };

    const recipe = pool[Math.floor(Math.random() * pool.length)]!;
    const memberTargets = await getNutritionTargetsForHousehold(
      supabase,
      household.members.map((member) => member.id),
    );
    const portions = household.members.map((member) =>
      buildMemberPortion(recipe, member.id, memberTargets[member.id]),
    );

    await replaceMealPlanItem(supabase, mealPlanItemId, recipe.id, portions);
    revalidatePath('/week');

    return { ok: true };
  } catch (cause) {
    console.error('[planning] meal replacement failed', cause);
    return { ok: false, error: REPLACE_FAILURE };
  }
}
