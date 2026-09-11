/**
 * Nutrition primitives for the trusted recipe domain (CLAUDE.md §15 Milestone 3).
 *
 * These types are deliberately framework-, database-, and AI-SDK-free (CLAUDE.md
 * §14) so the same calculation code runs on the server, in tests, and later in
 * any AI-proposal validation step without carrying dead dependencies.
 */

export type MassUnit = 'g' | 'kg' | 'oz' | 'lb';
export type VolumeUnit = 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'floz';
export type CountUnit = 'piece' | 'clove' | 'slice';
export type Unit = MassUnit | VolumeUnit | CountUnit;

export interface Quantity {
  amount: number;
  unit: Unit;
}

/**
 * Where a nutrient figure came from. `usda_fdc` rows carry the FoodData
 * Central id they were read from; `reference_estimate` rows are well-established
 * generic values (nutrition-label-grade, not FDC-verified yet) pending backfill —
 * see CLAUDE.md §9 "store nutrition provenance ... for reproducibility."
 */
export type NutrientProvenance = 'usda_fdc' | 'reference_estimate';

/** Calories and macros for some basis amount of an ingredient (usually 100 g). */
export interface NutrientBasis {
  basisAmount: number;
  basisUnit: MassUnit;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  provenance: NutrientProvenance;
  /** USDA FoodData Central id, when `provenance` is `'usda_fdc'`. */
  fdcId?: string;
  /** Freeform note — proxy substitutions, pending verification, etc. */
  note?: string;
}

/** Absolute nutrient totals for some real quantity of food (a line, a serving, a meal). */
export interface NutrientTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export const ZERO_NUTRIENTS: NutrientTotals = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
};

/** Calculation code version, stored alongside computed totals for reproducibility. */
export const NUTRITION_ENGINE_VERSION = 'nutrition-engine-v1';
