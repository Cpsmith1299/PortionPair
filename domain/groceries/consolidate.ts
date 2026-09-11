/**
 * Ingredient consolidation — combining repeated ingredients across a plan
 * into one grocery quantity (CLAUDE.md §3 "Grocery list", §16 test list).
 *
 * This is the direct payoff of ingredient normalization: two recipes calling
 * the same canonical ingredient by different quantities/units still combine
 * into one correct total, because both resolve through the same ingredient's
 * density facts to grams (CLAUDE.md §9 "store quantities in normalized base
 * units"). Aggregation only — grouping into shopping categories, check-off
 * state, and pantry/custom items are Milestone 4 grocery-list work.
 */

import type { IngredientLookup, RecipeIngredient } from '@/domain/recipes/types';
import type { Quantity } from '@/domain/nutrition/types';
import { toGrams } from '@/domain/nutrition/units';

export interface ConsolidatedIngredient {
  ingredientId: string;
  canonicalName: string;
  totalGrams: number;
}

/** A recipe-ingredient line plus how many times that recipe recurs in the plan (servings multiplier). */
export interface ConsolidationLine {
  ingredient: Pick<RecipeIngredient, 'ingredientId' | 'quantity'>;
  /** Scales the line's quantity — e.g. a recipe's serving-count multiplier for this plan. */
  multiplier?: number;
}

export function consolidateIngredients(
  lines: ConsolidationLine[],
  ingredients: IngredientLookup,
): ConsolidatedIngredient[] {
  const totals = new Map<string, number>();

  for (const line of lines) {
    const ingredient = ingredients[line.ingredient.ingredientId];
    if (!ingredient) {
      throw new Error(`Unknown ingredient id "${line.ingredient.ingredientId}".`);
    }
    const scaledQuantity: Quantity = {
      amount: line.ingredient.quantity.amount * (line.multiplier ?? 1),
      unit: line.ingredient.quantity.unit,
    };
    const grams = toGrams(scaledQuantity, ingredient, ingredient.canonicalName);
    totals.set(ingredient.id, (totals.get(ingredient.id) ?? 0) + grams);
  }

  return [...totals.entries()].map(([ingredientId, totalGrams]) => ({
    ingredientId,
    canonicalName: ingredients[ingredientId]!.canonicalName,
    totalGrams,
  }));
}
