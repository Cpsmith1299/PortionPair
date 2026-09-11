'use server';

import { validatePreferences, hasValidationErrors } from '@/domain/meal-plans/preferences';
import type { WeeklyPlan } from '@/domain/meal-plans/types';
import { deterministicPlanner } from '@/lib/planning/deterministic-planner';
import { planPreferencesSchema } from '@/lib/planning/schema';
import { getHouseholdForUser, upsertHouseholdPreferences } from '@/lib/households/repository';
import { createClient } from '@/lib/supabase/server';

export type GeneratePlanResult =
  | { ok: true; plan: WeeklyPlan }
  | { ok: false; error: string };

/** Safe, actionable, and identical for every failure mode — no internals leak. */
const GENERIC_FAILURE = 'We couldn’t create the plan. Check your connection and try again.';

/**
 * The only entry point into plan generation from the client.
 *
 * Every mutation is validated and authorized on the server (CLAUDE.md §17).
 * Milestone 2: the session check and household ownership assertion this
 * comment used to promise are here now — the plan is generated for the
 * signed-in user's real household, and the chosen preferences are persisted
 * so they're there next time (`household_preferences`, upserted below).
 * Milestone 5 adds the entitlement check on top (free tier: one three-day
 * plan per month).
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

    const plan = await deterministicPlanner.generateWeeklyPlan({
      preferences: parsed.data,
      household,
      weekStart: new Date(),
    });

    await upsertHouseholdPreferences(supabase, household.id, parsed.data);

    return { ok: true, plan };
  } catch (cause) {
    // Observable server-side; opaque to the browser.
    console.error('[planning] plan generation failed', cause);
    return { ok: false, error: GENERIC_FAILURE };
  }
}
