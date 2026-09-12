/**
 * Per-member nutrition targets — the piece Milestone 2 deliberately deferred
 * ("Signup collects only names") and Milestone 4's portion engine cannot
 * work without (CLAUDE.md §3 onboarding: "Daily calorie target... manual
 * target entry or an editable in-app estimate... always editable").
 *
 * Deliberately minimal: two numbers per member, not the full Person 1/2
 * profile-and-preferences wizard (dietary style, allergies, cuisines, ...)
 * from CLAUDE.md's first-time flow — that remains its own later pass.
 */

export interface MemberNutritionTargetInput {
  memberId: string;
  calories: number;
  proteinG: number;
}

export type NutritionTargetsByMember = Record<string, MemberNutritionTargetInput>;

/** Matches the migration's `check` constraints — kept in sync deliberately. */
export const CALORIE_RANGE = { min: 1000, max: 5000, step: 50 } as const;
export const PROTEIN_RANGE = { min: 40, max: 300, step: 5 } as const;

/** A reasonable, clearly-a-placeholder starting point — always editable. */
export const DEFAULT_MEMBER_TARGET: Omit<MemberNutritionTargetInput, 'memberId'> = {
  calories: 2000,
  proteinG: 140,
};

export interface NutritionTargetValidationErrors {
  calories?: string;
  proteinG?: string;
}

export function validateNutritionTarget(target: {
  calories: number;
  proteinG: number;
}): NutritionTargetValidationErrors {
  const errors: NutritionTargetValidationErrors = {};

  if (!Number.isFinite(target.calories) || target.calories < CALORIE_RANGE.min || target.calories > CALORIE_RANGE.max) {
    errors.calories = `Enter a calorie target between ${CALORIE_RANGE.min} and ${CALORIE_RANGE.max}.`;
  }

  if (!Number.isFinite(target.proteinG) || target.proteinG < PROTEIN_RANGE.min || target.proteinG > PROTEIN_RANGE.max) {
    errors.proteinG = `Enter a protein target between ${PROTEIN_RANGE.min}g and ${PROTEIN_RANGE.max}g.`;
  }

  return errors;
}

export function hasNutritionTargetErrors(errors: NutritionTargetValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

/**
 * What a stored target means is a *daily* calorie/protein target (CLAUDE.md
 * §3 "Daily calorie target"), but the MVP only plans dinner (§4: "not
 * full-day meal planning" — CLAUDE.md §12's own worked example prices
 * Charlie's dinner at ~720 of a 2,700-calorie day, about 27%). Handing a
 * dinner's portion engine someone's *whole day's* target would force wildly
 * oversized scaling for every member, and since real target gaps between two
 * people are usually similar in ratio, they tend to collide against the same
 * plausibility ceiling and come out identical — the opposite of
 * personalization. This share is the seam until per-meal target splitting
 * (breakfast/lunch/dinner/snacks) is worth building.
 */
export const DINNER_SHARE_OF_DAILY_TARGET = 0.3;

export function toDinnerTarget(dailyTarget: { calories: number; proteinG: number }): {
  calories: number;
  proteinG: number;
} {
  return {
    calories: dailyTarget.calories * DINNER_SHARE_OF_DAILY_TARGET,
    proteinG: dailyTarget.proteinG * DINNER_SHARE_OF_DAILY_TARGET,
  };
}
