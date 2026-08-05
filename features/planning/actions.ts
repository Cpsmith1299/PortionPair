'use server';

import { validatePreferences, hasValidationErrors } from '@/domain/meal-plans/preferences';
import type { WeeklyPlan } from '@/domain/meal-plans/types';
import { deterministicPlanner } from '@/lib/planning/deterministic-planner';
import { DEMO_HOUSEHOLD } from '@/lib/planning/demo-household';
import { planPreferencesSchema } from '@/lib/planning/schema';

export type GeneratePlanResult =
  | { ok: true; plan: WeeklyPlan }
  | { ok: false; error: string };

/** Safe, actionable, and identical for every failure mode — no internals leak. */
const GENERIC_FAILURE = 'We couldn’t create the plan. Check your connection and try again.';

/**
 * The only entry point into plan generation from the client.
 *
 * Every mutation is validated and authorized on the server (CLAUDE.md §17).
 * Authorization is a no-op today because there are no accounts yet; Milestone 2
 * adds the session check and household ownership assertion here, and Milestone 5
 * adds the entitlement check (free tier: one three-day plan per month).
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
    const plan = await deterministicPlanner.generateWeeklyPlan({
      preferences: parsed.data,
      household: DEMO_HOUSEHOLD,
      weekStart: new Date(),
    });

    return { ok: true, plan };
  } catch (cause) {
    // Observable server-side; opaque to the browser.
    console.error('[planning] plan generation failed', cause);
    return { ok: false, error: GENERIC_FAILURE };
  }
}
