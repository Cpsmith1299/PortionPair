import type { ScaledIngredientLine } from './types';

/**
 * Sums scaled ingredient lines across members (and, for a grocery list,
 * across every cooked meal in the week) into one line per ingredient — the
 * "total household ingredients" a meal-details view shows, and the raw
 * input to the grocery list (CLAUDE.md §3).
 */
export function combineScaledIngredientLines(lineSets: ScaledIngredientLine[][]): ScaledIngredientLine[] {
  const totals = new Map<string, ScaledIngredientLine>();

  for (const lines of lineSets) {
    for (const line of lines) {
      const existing = totals.get(line.ingredientId);
      totals.set(line.ingredientId, existing ? { ...existing, grams: existing.grams + line.grams } : { ...line });
    }
  }

  return [...totals.values()];
}
