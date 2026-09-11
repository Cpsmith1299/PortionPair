import { describe, expect, it } from 'vitest';
import { addNutrients, aggregateNutrients, nutrientsForGrams, scaleNutrients } from '@/domain/nutrition/calculate';
import { ZERO_NUTRIENTS, type NutrientBasis } from '@/domain/nutrition/types';
import { toGrams, UnitConversionError } from '@/domain/nutrition/units';

const chickenBasis: NutrientBasis = {
  basisAmount: 100,
  basisUnit: 'g',
  calories: 165,
  proteinG: 31,
  carbsG: 0,
  fatG: 3.57,
  fiberG: 0,
  provenance: 'usda_fdc',
  fdcId: '171477',
};

describe('unit conversion', () => {
  it('converts mass units directly to grams', () => {
    expect(toGrams({ amount: 6, unit: 'oz' }, {}, 'chicken')).toBeCloseTo(170.1, 0);
    expect(toGrams({ amount: 1, unit: 'kg' }, {}, 'chicken')).toBe(1000);
  });

  it('converts volume units using the ingredient-specific density', () => {
    expect(toGrams({ amount: 1.5, unit: 'cup' }, { gramsPerCup: 158 }, 'rice')).toBeCloseTo(237, 0);
    expect(toGrams({ amount: 2, unit: 'tbsp' }, { gramsPerTbsp: 14 }, 'dressing')).toBe(28);
  });

  it('converts a count unit using the ingredient piece weight', () => {
    expect(toGrams({ amount: 3, unit: 'piece' }, { gramsPerPiece: 26 }, 'tortilla')).toBe(78);
  });

  it('throws instead of guessing when no density is available', () => {
    expect(() => toGrams({ amount: 1, unit: 'cup' }, {}, 'mystery ingredient')).toThrow(UnitConversionError);
  });
});

describe('nutrient aggregation', () => {
  it('scales a per-100g basis to a real quantity', () => {
    const result = nutrientsForGrams(chickenBasis, 170);
    expect(result.calories).toBeCloseTo(280.5, 5);
    expect(result.proteinG).toBeCloseTo(52.7, 5);
    expect(result.carbsG).toBe(0);
    expect(result.fatG).toBeCloseTo(6.069, 5);
    expect(result.fiberG).toBe(0);
  });

  it('rejects a negative quantity rather than returning a negative total', () => {
    expect(() => nutrientsForGrams(chickenBasis, -10)).toThrow(RangeError);
  });

  it('sums multiple lines into one total', () => {
    const a = nutrientsForGrams(chickenBasis, 100);
    const b = nutrientsForGrams(chickenBasis, 50);
    expect(aggregateNutrients([a, b])).toEqual(addNutrients(a, b));
    expect(aggregateNutrients([])).toEqual(ZERO_NUTRIENTS);
  });

  it('scales a total by a serving factor', () => {
    const total = nutrientsForGrams(chickenBasis, 200);
    expect(scaleNutrients(total, 0.5)).toEqual(nutrientsForGrams(chickenBasis, 100));
  });
});
