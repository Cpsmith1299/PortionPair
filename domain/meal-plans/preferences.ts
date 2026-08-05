import {
  MIN_VIABLE_BUDGET,
  type PlanPreferences,
  type PlanValidationErrors,
} from './types';

/**
 * Validation rules carried over verbatim from the validated prototype:
 * at least one dietary preference, and a budget a two-person week can absorb.
 */
export function validatePreferences(preferences: PlanPreferences): PlanValidationErrors {
  const errors: PlanValidationErrors = {};

  if (preferences.diets.length === 0) {
    errors.diets = 'Choose at least one dietary preference so we can shape the plan.';
  }

  if (preferences.weeklyBudget < MIN_VIABLE_BUDGET) {
    errors.weeklyBudget = `Set a budget of at least $${MIN_VIABLE_BUDGET} for two people.`;
  }

  return errors;
}

export function hasValidationErrors(errors: PlanValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export interface AddAvoidFoodResult {
  foods: string[];
  error?: string;
}

/** Trims input and rejects blanks and case-insensitive duplicates. */
export function addAvoidFood(current: string[], draft: string): AddAvoidFoodResult {
  const normalized = draft.trim();

  if (!normalized) {
    return { foods: current, error: 'Enter a food name first.' };
  }

  if (current.some((food) => food.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
    return { foods: current, error: `${normalized} is already on the list.` };
  }

  return { foods: [...current, normalized] };
}

export function removeAvoidFood(current: string[], food: string): string[] {
  return current.filter((item) => item !== food);
}

export function toggleDiet(
  preferences: PlanPreferences,
  diet: PlanPreferences['diets'][number],
): PlanPreferences {
  const diets = preferences.diets.includes(diet)
    ? preferences.diets.filter((item) => item !== diet)
    : [...preferences.diets, diet];

  return { ...preferences, diets };
}

/** Clamps a numeric preference to its inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
