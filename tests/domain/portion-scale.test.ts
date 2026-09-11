import { describe, expect, it } from 'vitest';
import { RECIPE_LOOKUP } from '@/domain/recipes/catalog';
import { INGREDIENT_LOOKUP } from '@/domain/recipes/ingredients';
import { computeRecipePerServing, gramsForLine } from '@/domain/recipes/nutrition';
import { CALORIE_TOLERANCE, scalePortionForMember } from '@/domain/portions/scale';
import { ImplausibleTargetError } from '@/domain/portions/types';

const recipe = RECIPE_LOOKUP['lemon-herb-chicken-bowls']!;

describe('portion scaling', () => {
  it('lands within tolerance for a target close to the baseline serving', () => {
    const baseline = computeRecipePerServing(recipe, INGREDIENT_LOOKUP);
    const result = scalePortionForMember(recipe, INGREDIENT_LOOKUP, {
      memberId: 'a',
      calories: baseline.calories,
      proteinG: baseline.proteinG,
    });

    expect(result.toleranceMet).toBe(true);
    expect(Math.abs(result.calorieDeltaFraction)).toBeLessThanOrEqual(CALORIE_TOLERANCE);
  });

  it('scales the protein ingredient up for a higher target and down for a lower one', () => {
    const bigger = scalePortionForMember(recipe, INGREDIENT_LOOKUP, { memberId: 'charlie', calories: 900, proteinG: 65 });
    const smaller = scalePortionForMember(recipe, INGREDIENT_LOOKUP, { memberId: 'sam', calories: 550, proteinG: 35 });

    const biggerChicken = bigger.scaledIngredients.find((i) => i.ingredientId === 'chicken-breast')!.grams;
    const smallerChicken = smaller.scaledIngredients.find((i) => i.ingredientId === 'chicken-breast')!.grams;
    expect(biggerChicken).toBeGreaterThan(smallerChicken);
  });

  it('keeps vegetable and fat lines close to baseline rather than fully rescaling them', () => {
    const baselineVeg = recipe.ingredients.find((i) => i.role === 'vegetable')!;
    const baselineGrams = gramsForLine(baselineVeg, INGREDIENT_LOOKUP) / recipe.servings;

    const result = scalePortionForMember(recipe, INGREDIENT_LOOKUP, { memberId: 'charlie', calories: 1400, proteinG: 100 });
    const scaledVeg = result.scaledIngredients.find((i) => i.role === 'vegetable')!.grams;

    // Even for a much larger target, vegetables move at most ~20% from baseline.
    expect(scaledVeg).toBeLessThanOrEqual(baselineGrams * 1.21);
  });

  it('explains itself when a target forces an implausible portion, instead of failing silently', () => {
    const result = scalePortionForMember(recipe, INGREDIENT_LOOKUP, { memberId: 'x', calories: 3000, proteinG: 250 });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.toLowerCase().includes('clamped'))).toBe(true);
  });

  it('handles a recipe with no carbohydrate role by scaling protein alone', () => {
    const salmon = RECIPE_LOOKUP['miso-salmon-sesame-greens']!;
    const result = scalePortionForMember(salmon, INGREDIENT_LOOKUP, { memberId: 'a', calories: 500, proteinG: 40 });
    expect(result.totals.calories).toBeGreaterThan(0);
    expect(Number.isFinite(result.totals.calories)).toBe(true);
  });

  it('rejects a non-positive calorie target outright', () => {
    expect(() => scalePortionForMember(recipe, INGREDIENT_LOOKUP, { memberId: 'a', calories: 0, proteinG: 10 })).toThrow(
      ImplausibleTargetError,
    );
  });
});
