/**
 * Unit conversion for the nutrition engine.
 *
 * Everything reduces to grams. Mass converts directly; volume needs a
 * density (grams per ml) or an ingredient-supplied grams-per-cup/tbsp figure,
 * because "1 cup rice" and "1 cup spinach" are not the same mass — there is no
 * universal volume→mass constant (CLAUDE.md §9 "store quantities in normalized
 * base units; convert only for display").
 */

import type { CountUnit, MassUnit, Quantity, Unit, VolumeUnit } from './types';

const MASS_UNITS: readonly MassUnit[] = ['g', 'kg', 'oz', 'lb'];
const VOLUME_UNITS: readonly VolumeUnit[] = ['ml', 'l', 'tsp', 'tbsp', 'cup', 'floz'];
const COUNT_UNITS: readonly CountUnit[] = ['piece', 'clove', 'slice'];

export function isMassUnit(unit: Unit): unit is MassUnit {
  return (MASS_UNITS as readonly Unit[]).includes(unit);
}

export function isVolumeUnit(unit: Unit): unit is VolumeUnit {
  return (VOLUME_UNITS as readonly Unit[]).includes(unit);
}

export function isCountUnit(unit: Unit): unit is CountUnit {
  return (COUNT_UNITS as readonly Unit[]).includes(unit);
}

const MASS_TO_GRAMS: Record<MassUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  floz: 29.5735,
};

/** The density/weight facts an ingredient needs to convert non-mass units to grams. */
export interface IngredientDensity {
  /** Grams in one US cup of this ingredient, as prepared. */
  gramsPerCup?: number;
  /** Grams in one tablespoon, when a cup figure would be too coarse (oils, pastes). */
  gramsPerTbsp?: number;
  /** Grams in one countable unit — a tortilla, a clove, a slice. */
  gramsPerPiece?: number;
}

export class UnitConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnitConversionError';
  }
}

/** Converts a quantity to grams using an ingredient's density facts where needed. */
export function toGrams(quantity: Quantity, density: IngredientDensity, ingredientName: string): number {
  const { amount, unit } = quantity;

  if (isMassUnit(unit)) {
    return amount * MASS_TO_GRAMS[unit];
  }

  if (isVolumeUnit(unit)) {
    if (unit === 'tbsp' && density.gramsPerTbsp !== undefined) {
      return amount * density.gramsPerTbsp;
    }
    if (density.gramsPerCup !== undefined) {
      const ml = amount * VOLUME_TO_ML[unit];
      return (ml / VOLUME_TO_ML.cup) * density.gramsPerCup;
    }
    throw new UnitConversionError(
      `No density conversion for "${ingredientName}" in unit "${unit}" — add gramsPerCup or gramsPerTbsp.`,
    );
  }

  if (isCountUnit(unit)) {
    if (density.gramsPerPiece === undefined) {
      throw new UnitConversionError(`No piece weight for "${ingredientName}" — add gramsPerPiece.`);
    }
    return amount * density.gramsPerPiece;
  }

  throw new UnitConversionError(`Unsupported unit "${unit}" for "${ingredientName}".`);
}
