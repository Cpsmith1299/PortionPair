/** Deterministic nutrient math — the only place these numbers are computed (CLAUDE.md §3, §17: "Never let the AI invent nutrition numbers"). */

import type { NutrientBasis, NutrientTotals } from './types';
import { ZERO_NUTRIENTS } from './types';

/** Scales a nutrient basis (usually per 100 g) to a real quantity in grams. */
export function nutrientsForGrams(basis: NutrientBasis, grams: number): NutrientTotals {
  if (grams < 0) throw new RangeError(`Negative quantity (${grams}g) is not valid.`);
  const factor = grams / basis.basisAmount;
  return {
    calories: basis.calories * factor,
    proteinG: basis.proteinG * factor,
    carbsG: basis.carbsG * factor,
    fatG: basis.fatG * factor,
    fiberG: basis.fiberG * factor,
  };
}

export function addNutrients(a: NutrientTotals, b: NutrientTotals): NutrientTotals {
  return {
    calories: a.calories + b.calories,
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fatG: a.fatG + b.fatG,
    fiberG: a.fiberG + b.fiberG,
  };
}

export function aggregateNutrients(totals: NutrientTotals[]): NutrientTotals {
  return totals.reduce(addNutrients, ZERO_NUTRIENTS);
}

export function scaleNutrients(totals: NutrientTotals, factor: number): NutrientTotals {
  return {
    calories: totals.calories * factor,
    proteinG: totals.proteinG * factor,
    carbsG: totals.carbsG * factor,
    fatG: totals.fatG * factor,
    fiberG: totals.fiberG * factor,
  };
}

/** Rounds every field to a display-sane precision without mutating the input. */
export function roundNutrients(totals: NutrientTotals): NutrientTotals {
  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    calories: Math.round(totals.calories),
    proteinG: round1(totals.proteinG),
    carbsG: round1(totals.carbsG),
    fatG: round1(totals.fatG),
    fiberG: round1(totals.fiberG),
  };
}
