/**
 * Portion scaling — CLAUDE.md §8 "Portioning approach for MVP".
 *
 * Starting from one standard serving, scale the primary protein toward the
 * member's protein target, then scale the primary carbohydrate to close
 * whatever calorie gap is left, then nudge vegetables/fats/garnish only
 * slightly so the meal still looks and cooks like one dish. Every bound this
 * hits is recorded in `warnings` — nothing is silently dropped or rejected
 * without saying why.
 *
 * This governs one member's serving, not the recipe's other diner — the
 * caller (Milestone 4's plan builder) runs it once per member from the same
 * baseline recipe.
 */

import { aggregateNutrients, nutrientsForGrams } from '@/domain/nutrition/calculate';
import type { NutrientTotals } from '@/domain/nutrition/types';
import type { IngredientLookup, Recipe, RecipeIngredient } from '@/domain/recipes/types';
import { gramsForLine, nutrientsForLine, computeRecipePerServing } from '@/domain/recipes/nutrition';
import { ImplausibleTargetError, type MemberNutritionTarget, type PortionResult, type ScaledIngredientLine } from './types';

/** Default calorie tolerance — "initially around ±5% where practical" (CLAUDE.md §8). */
export const CALORIE_TOLERANCE = 0.05;

/** How far the primary protein/carb may scale from baseline before other bounds take over. */
const PRIMARY_SCALE_BOUNDS = { min: 0.4, max: 2.2 };
/** Vegetables, fats, and garnish move only slightly — the dish should still look and cook the same. */
const SECONDARY_SCALE_BOUNDS = { min: 0.85, max: 1.2 };

/** Reject-by-clamping bounds for the two scaled roles — cooked grams per member serving. */
const PLAUSIBLE_GRAMS: Record<'protein' | 'carbohydrate', { min: number; max: number }> = {
  protein: { min: 85, max: 400 }, // roughly 3 oz to 14 oz cooked
  carbohydrate: { min: 40, max: 400 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampPlausible(
  grams: number,
  bounds: { min: number; max: number },
  label: string,
  warnings: string[],
): number {
  if (grams < bounds.min) {
    warnings.push(
      `${label} portion clamped up to ${bounds.min}g — the ${grams.toFixed(0)}g the raw scale wanted was implausibly small.`,
    );
    return bounds.min;
  }
  if (grams > bounds.max) {
    warnings.push(
      `${label} portion clamped down to ${bounds.max}g — the ${grams.toFixed(0)}g the raw scale wanted was implausibly large.`,
    );
    return bounds.max;
  }
  return grams;
}

function totalsForGrams(
  gramsByIngredient: Map<string, number>,
  recipe: Recipe,
  ingredients: IngredientLookup,
): NutrientTotals {
  return aggregateNutrients(
    recipe.ingredients.map((ri) => {
      const ingredient = ingredients[ri.ingredientId];
      if (!ingredient) throw new Error(`Recipe references unknown ingredient "${ri.ingredientId}".`);
      return nutrientsForGrams(ingredient.nutrients, gramsByIngredient.get(ri.ingredientId) ?? 0);
    }),
  );
}

function findByRole(recipe: Recipe, role: RecipeIngredient['role']): RecipeIngredient | undefined {
  return recipe.ingredients.find((ri) => ri.role === role);
}

export function scalePortionForMember(
  recipe: Recipe,
  ingredients: IngredientLookup,
  target: MemberNutritionTarget,
  options: { tolerance?: number } = {},
): PortionResult {
  if (!Number.isFinite(target.calories) || target.calories <= 0) {
    throw new ImplausibleTargetError(`Member ${target.memberId} needs a positive calorie target.`);
  }
  if (!Number.isFinite(target.proteinG) || target.proteinG < 0) {
    throw new ImplausibleTargetError(`Member ${target.memberId} has a negative protein target.`);
  }

  const tolerance = options.tolerance ?? CALORIE_TOLERANCE;
  const warnings: string[] = [];

  // Step 1: start from the recipe's standard per-serving baseline.
  const baselineGrams = new Map<string, number>();
  for (const ri of recipe.ingredients) {
    baselineGrams.set(ri.ingredientId, gramsForLine(ri, ingredients) / recipe.servings);
  }
  const baselineTotals = computeRecipePerServing(recipe, ingredients);
  const gramsByIngredient = new Map(baselineGrams);

  const proteinLine = findByRole(recipe, 'protein');
  const carbLine = findByRole(recipe, 'carb');

  // Step 2: scale the primary protein toward this member's protein target.
  let proteinScale = 1;
  if (proteinLine && baselineTotals.proteinG > 0) {
    proteinScale = clamp(target.proteinG / baselineTotals.proteinG, PRIMARY_SCALE_BOUNDS.min, PRIMARY_SCALE_BOUNDS.max);
    const raw = baselineGrams.get(proteinLine.ingredientId)! * proteinScale;
    gramsByIngredient.set(proteinLine.ingredientId, clampPlausible(raw, PLAUSIBLE_GRAMS.protein, 'Protein', warnings));
  }

  // Step 3: scale the primary carbohydrate to close whatever calorie gap remains.
  let carbScale = 1;
  if (carbLine) {
    const runningTotals = totalsForGrams(gramsByIngredient, recipe, ingredients);
    const carbBaseGrams = baselineGrams.get(carbLine.ingredientId)!;
    const carbBaseCalories = nutrientsForLine(carbLine, ingredients).calories / recipe.servings;
    if (carbBaseCalories > 0) {
      const calorieGap = target.calories - runningTotals.calories;
      const desiredCarbCalories = Math.max(carbBaseCalories + calorieGap, 0);
      carbScale = clamp(desiredCarbCalories / carbBaseCalories, PRIMARY_SCALE_BOUNDS.min, PRIMARY_SCALE_BOUNDS.max);
      const raw = carbBaseGrams * carbScale;
      gramsByIngredient.set(carbLine.ingredientId, clampPlausible(raw, PLAUSIBLE_GRAMS.carbohydrate, 'Carbohydrate', warnings));
    }
  }

  // Step 4: keep vegetables, and step 5: keep fats/sauces/garnish, within practical bounds —
  // a light nudge toward the meal's overall scale rather than a full rescale.
  const overallScale = clamp((proteinScale + carbScale) / 2, SECONDARY_SCALE_BOUNDS.min, SECONDARY_SCALE_BOUNDS.max);
  for (const ri of recipe.ingredients) {
    if (ri.role === 'vegetable' || ri.role === 'fat' || ri.role === 'other') {
      gramsByIngredient.set(ri.ingredientId, baselineGrams.get(ri.ingredientId)! * overallScale);
    }
  }

  const totals = totalsForGrams(gramsByIngredient, recipe, ingredients);
  const calorieDeltaFraction = (totals.calories - target.calories) / target.calories;
  const proteinDeltaFraction = target.proteinG > 0 ? (totals.proteinG - target.proteinG) / target.proteinG : 0;
  const toleranceMet = Math.abs(calorieDeltaFraction) <= tolerance;

  if (!toleranceMet) {
    warnings.push(
      `Calories landed ${(calorieDeltaFraction * 100).toFixed(1)}% from target after bounds were applied.`,
    );
  }

  const scaledIngredients: ScaledIngredientLine[] = recipe.ingredients.map((ri) => ({
    ingredientId: ri.ingredientId,
    role: ri.role,
    grams: gramsByIngredient.get(ri.ingredientId) ?? 0,
  }));

  return {
    memberId: target.memberId,
    scaledIngredients,
    totals,
    calorieDeltaFraction,
    proteinDeltaFraction,
    toleranceMet,
    warnings,
  };
}
