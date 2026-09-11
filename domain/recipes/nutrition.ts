/** Deterministic nutrient calculation for recipes — CLAUDE.md §15 Milestone 3. */

import { aggregateNutrients, nutrientsForGrams, scaleNutrients } from '@/domain/nutrition/calculate';
import type { NutrientTotals } from '@/domain/nutrition/types';
import { toGrams } from '@/domain/nutrition/units';
import type { IngredientLookup, Recipe, RecipeIngredient } from './types';

function ingredientFor(ri: RecipeIngredient, ingredients: IngredientLookup) {
  const ingredient = ingredients[ri.ingredientId];
  if (!ingredient) throw new Error(`Recipe references unknown ingredient "${ri.ingredientId}".`);
  return ingredient;
}

/** Grams a recipe line resolves to, using the ingredient's own density facts. */
export function gramsForLine(ri: RecipeIngredient, ingredients: IngredientLookup): number {
  const ingredient = ingredientFor(ri, ingredients);
  return toGrams(ri.quantity, ingredient, ingredient.canonicalName);
}

export function nutrientsForLine(ri: RecipeIngredient, ingredients: IngredientLookup): NutrientTotals {
  const ingredient = ingredientFor(ri, ingredients);
  return nutrientsForGrams(ingredient.nutrients, gramsForLine(ri, ingredients));
}

/** Totals for the recipe's full base yield (all `recipe.servings` servings). */
export function computeRecipeTotals(recipe: Recipe, ingredients: IngredientLookup): NutrientTotals {
  return aggregateNutrients(recipe.ingredients.map((ri) => nutrientsForLine(ri, ingredients)));
}

/** Totals for one standard serving — the portion engine's scaling baseline. */
export function computeRecipePerServing(recipe: Recipe, ingredients: IngredientLookup): NutrientTotals {
  if (recipe.servings <= 0) throw new RangeError(`Recipe "${recipe.id}" has a non-positive servings count.`);
  return scaleNutrients(computeRecipeTotals(recipe, ingredients), 1 / recipe.servings);
}
