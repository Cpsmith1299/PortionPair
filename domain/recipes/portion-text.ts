/**
 * Turns a scaled portion's raw grams into the quantity-first summary string
 * the UI leads with (CLAUDE.md §11 "quantity-first portion display; detailed
 * macros are secondary") — e.g. "6 oz chicken breast · 1½ cups white rice".
 *
 * Only the protein and carb roles make the headline; vegetables, fat, and
 * garnish stay in the detailed ingredient list (`ScaledIngredientLine[]`,
 * carried through unchanged for the meal-details view).
 */

import type { IngredientLookup } from './types';
import type { ScaledIngredientLine } from '@/domain/portions/types';

const OUNCES_PER_GRAM = 1 / 28.3495;

/** Nearest-quarter fraction glyphs, matching the design system's mono-figure treatment. */
const QUARTER_GLYPHS: Record<number, string> = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' };

function formatQuarters(value: number, quantum: number): string {
  const quantized = Math.round(value / quantum) * quantum;
  const whole = Math.floor(quantized);
  const fraction = Math.round((quantized - whole) * 4) / 4;

  if (whole === 0 && fraction === 0) return '0';
  if (fraction === 0) return String(whole);
  const glyph = QUARTER_GLYPHS[fraction] ?? '';
  return whole === 0 ? glyph : `${whole}${glyph}`;
}

/** "Chicken breast, skinless, roasted" → "Chicken breast" — short enough for a headline. */
function shortName(canonicalName: string): string {
  return canonicalName.split(',')[0]!.trim();
}

/**
 * Formats one ingredient's grams into a shopping/cooking-friendly quantity —
 * "6 oz chicken breast", "1½ cups white rice", "3 corn tortillas". Shared by
 * the portion headline (below) and the grocery list, so an ingredient reads
 * the same way in both places.
 */
export function formatIngredientQuantity(
  ingredientId: string,
  grams: number,
  ingredients: IngredientLookup,
): string | undefined {
  const ingredient = ingredients[ingredientId];
  if (!ingredient || grams <= 0) return undefined;
  const name = shortName(ingredient.canonicalName).toLowerCase();

  if (ingredient.gramsPerPiece !== undefined) {
    const count = Math.round(grams / ingredient.gramsPerPiece);
    if (count <= 0) return undefined;
    return `${count} ${name}`;
  }

  if (ingredient.gramsPerCup !== undefined) {
    const rawCups = grams / ingredient.gramsPerCup;
    const cups = formatQuarters(rawCups, 0.25);
    if (cups === '0') return undefined;
    // "½ cup", not "½ cups" — pluralizes on quantity, not on the presence of a fraction.
    const plural = Math.round(rawCups / 0.25) * 0.25 > 1;
    return `${cups} cup${plural ? 's' : ''} ${name}`;
  }

  const ounces = formatQuarters(grams * OUNCES_PER_GRAM, 0.5);
  // Rounds to nothing worth measuring (a trace of oil in one person's scaled-down
  // portion, say) — worth having in the total, not worth a "0 oz" line item.
  if (ounces === '0') return undefined;
  return `${ounces} oz ${name}`;
}

function formatLine(line: ScaledIngredientLine, ingredients: IngredientLookup): string | undefined {
  return formatIngredientQuantity(line.ingredientId, line.grams, ingredients);
}

/** Builds the "6 oz chicken · 1½ cups rice" headline from a scaled portion's ingredient lines. */
export function formatPortionSummary(lines: ScaledIngredientLine[], ingredients: IngredientLookup): string {
  const headline = lines
    .filter((line) => line.role === 'protein' || line.role === 'carb')
    .map((line) => formatLine(line, ingredients))
    .filter((text): text is string => Boolean(text));

  if (headline.length > 0) return headline.join(' · ');

  // No protein/carb role (e.g. a fish-and-greens dish) — fall back to whatever the
  // largest line is, so the summary is never blank.
  const fallback = [...lines].sort((a, b) => b.grams - a.grams)[0];
  return fallback ? formatLine(fallback, ingredients) ?? 'Portion' : 'Portion';
}
