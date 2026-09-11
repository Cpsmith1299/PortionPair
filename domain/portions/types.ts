import type { NutrientTotals } from '@/domain/nutrition/types';
import type { IngredientRole } from '@/domain/recipes/types';

/** What one household member's plate should hit — from their nutrition targets (CLAUDE.md §3 onboarding). */
export interface MemberNutritionTarget {
  memberId: string;
  calories: number;
  proteinG: number;
}

export interface ScaledIngredientLine {
  ingredientId: string;
  role: IngredientRole;
  grams: number;
}

export interface PortionResult {
  memberId: string;
  scaledIngredients: ScaledIngredientLine[];
  totals: NutrientTotals;
  /** Fraction over/under target, e.g. 0.03 means 3% over. */
  calorieDeltaFraction: number;
  proteinDeltaFraction: number;
  /** Whether calories landed within the configured tolerance (CLAUDE.md §8, default ±5%). */
  toleranceMet: boolean;
  /** Explains any bound that was applied — the "explainable validation" CLAUDE.md §15 asks for. */
  warnings: string[];
}

export class ImplausibleTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImplausibleTargetError';
  }
}
