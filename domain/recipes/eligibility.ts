/**
 * Recipe eligibility — the "Eligible recipes from a verified catalog" step of
 * the core system flow (CLAUDE.md §8), ahead of the Milestone 4 AI proposal.
 *
 * Allergy and avoided-food enforcement is deterministic application code, not
 * AI (CLAUDE.md §3): the AI never sees a recipe this excludes.
 */

import type { DietOption, PlanPreferences } from '@/domain/meal-plans/types';
import type { Recipe } from './types';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** True if any of the household's avoided foods names an allergen tag or an ingredient the recipe uses. */
function conflictsWithAvoidedFoods(recipe: Recipe, avoidFoods: string[]): boolean {
  if (avoidFoods.length === 0) return false;
  const avoided = avoidFoods.map(normalize);

  const allergenHit = recipe.allergenTags.some((tag) => avoided.includes(normalize(tag)));
  if (allergenHit) return true;

  return recipe.ingredients.some((ri) => {
    // Ingredient names are resolved by the caller's lookup in most call sites;
    // here we only need the id/slug-ish text a household is likely to type,
    // so match against the ingredient id's words as a conservative fallback.
    const words = ri.ingredientId.split('-');
    return avoided.some((food) => words.includes(food));
  });
}

/** A recipe with no dietary tags is treated as diet-agnostic (nothing to conflict with). */
function matchesDiets(recipe: Recipe, diets: DietOption[]): boolean {
  if (diets.length === 0) return true;
  if (recipe.dietaryTags.length === 0) return true;
  return recipe.dietaryTags.some((tag) => diets.includes(tag));
}

export function isRecipeEligible(recipe: Recipe, preferences: Pick<PlanPreferences, 'diets' | 'avoidFoods'>): boolean {
  if (conflictsWithAvoidedFoods(recipe, preferences.avoidFoods)) return false;
  return matchesDiets(recipe, preferences.diets);
}

export function filterEligibleRecipes(
  catalog: Recipe[],
  preferences: Pick<PlanPreferences, 'diets' | 'avoidFoods'>,
): Recipe[] {
  return catalog.filter((recipe) => isRecipeEligible(recipe, preferences));
}
