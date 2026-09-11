import type { DietOption } from '@/domain/meal-plans/types';
import type { IngredientDensity } from '@/domain/nutrition/units';
import type { NutrientBasis, Quantity } from '@/domain/nutrition/types';

/**
 * The role an ingredient line plays in a recipe, used by the portion engine
 * (CLAUDE.md §8 "Portioning approach for MVP") to decide what to scale:
 * protein and carb move to hit a member's targets, vegetables stay close to
 * baseline, and fat/other (sauces, garnish) stay within tight practical bounds.
 */
export const INGREDIENT_ROLES = ['protein', 'carb', 'vegetable', 'fat', 'other'] as const;
export type IngredientRole = (typeof INGREDIENT_ROLES)[number];

/**
 * A canonical, normalized ingredient — one row regardless of how many recipes
 * use it, mapped to USDA FoodData Central where verified (CLAUDE.md §9).
 */
export interface Ingredient extends IngredientDensity {
  id: string;
  canonicalName: string;
  defaultUnit: Quantity['unit'];
  allergens: string[];
  nutrients: NutrientBasis;
}

export type IngredientLookup = Record<string, Ingredient>;

export interface RecipeIngredient {
  ingredientId: string;
  role: IngredientRole;
  quantity: Quantity;
  preparationNote?: string;
  isOptional?: boolean;
}

export type RecipeStatus = 'verified' | 'draft';

export interface Recipe {
  id: string;
  slug: string;
  name: string;
  description: string;
  prepMinutes: number;
  cookMinutes: number;
  /** Base yield this recipe's ingredient quantities are written for. */
  servings: number;
  dietaryTags: DietOption[];
  /** Union of every ingredient's allergens — kept explicit for fast eligibility checks. */
  allergenTags: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  imageKey?: string;
  imageAlt?: string;
  costPerServing?: number;
  status: RecipeStatus;
}

/** Active cooking time — matches the `time` field the planner/UI already render. */
export function totalMinutes(recipe: Recipe): number {
  return recipe.prepMinutes + recipe.cookMinutes;
}
