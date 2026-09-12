/**
 * Grocery-list section grouping (CLAUDE.md §3: "Group by produce, protein,
 * dairy and eggs, grains and bakery, canned goods, frozen, pantry,
 * spices/condiments, and other").
 *
 * This is a heuristic over the existing ingredient/role data, not a stored
 * category field — deliberately, so the categorizer can improve without a
 * migration. It is read in order: the first matching rule wins, so more
 * specific overrides (an oil, a canned good) are checked before the broad
 * role-based defaults.
 */

import type { Ingredient, IngredientRole } from '@/domain/recipes/types';

export const GROCERY_CATEGORIES = [
  'produce',
  'protein',
  'dairy-eggs',
  'grains-bakery',
  'canned-goods',
  'frozen',
  'pantry',
  'spices-condiments',
  'other',
] as const;

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number];

export const GROCERY_CATEGORY_LABELS: Record<GroceryCategory, string> = {
  produce: 'Produce',
  protein: 'Protein',
  'dairy-eggs': 'Dairy & eggs',
  'grains-bakery': 'Grains & bakery',
  'canned-goods': 'Canned goods',
  frozen: 'Frozen',
  pantry: 'Pantry',
  'spices-condiments': 'Spices & condiments',
  other: 'Other',
};

const STARCH_WORDS = ['pasta', 'orzo', 'rice', 'quinoa', 'couscous', 'tortilla'];
const PRODUCE_OVERRIDE_WORDS = ['potato', 'avocado'];
const CONDIMENT_WORDS = ['dressing', 'glaze', 'pesto', 'sauce', 'miso'];

/**
 * Whole-word match only — a plain `.includes('oil')` also matches inside
 * "bro**il**ed" or "b**oil**ed", which is exactly the bug that shipped here
 * once (ground turkey, broiled, landing in Pantry instead of Protein).
 */
function includesWord(haystack: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`).test(haystack);
}

function includesAny(haystack: string, words: string[]): boolean {
  return words.some((word) => includesWord(haystack, word));
}

export function categorizeIngredient(ingredient: Ingredient, role: IngredientRole): GroceryCategory {
  const name = ingredient.canonicalName.toLowerCase();

  if (includesWord(name, 'canned')) return 'canned-goods';
  if (ingredient.allergens.includes('dairy')) return 'dairy-eggs';
  if (includesAny(name, PRODUCE_OVERRIDE_WORDS)) return 'produce';
  if (includesWord(name, 'oil')) return 'pantry';
  if (includesAny(name, CONDIMENT_WORDS)) return 'spices-condiments';

  switch (role) {
    case 'protein':
      return 'protein';
    case 'carb':
      return includesAny(name, STARCH_WORDS) ? 'grains-bakery' : 'produce';
    case 'vegetable':
      return 'produce';
    default:
      return 'pantry';
  }
}
