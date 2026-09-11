import { describe, expect, it } from 'vitest';
import { RECIPE_CATALOG, RECIPE_LOOKUP } from '@/domain/recipes/catalog';
import { INGREDIENT_LOOKUP } from '@/domain/recipes/ingredients';
import { computeRecipePerServing, computeRecipeTotals } from '@/domain/recipes/nutrition';
import { consolidateIngredients } from '@/domain/groceries/consolidate';

describe('recipe nutrient calculation', () => {
  it('computes a sane per-serving total for the flagship recipe', () => {
    const recipe = RECIPE_LOOKUP['lemon-herb-chicken-bowls']!;
    const perServing = computeRecipePerServing(recipe, INGREDIENT_LOOKUP);

    // Sanity band around CLAUDE.md §12's approximate figures — the demo
    // catalog's numbers were illustrative, not a literal target this engine
    // must reproduce, but a real dinner-sized serving should land nearby.
    expect(perServing.calories).toBeGreaterThan(500);
    expect(perServing.calories).toBeLessThan(950);
    expect(perServing.proteinG).toBeGreaterThan(30);
  });

  it('scales linearly with serving count', () => {
    const recipe = RECIPE_LOOKUP['turkey-pesto-pasta']!;
    const total = computeRecipeTotals(recipe, INGREDIENT_LOOKUP);
    const perServing = computeRecipePerServing(recipe, INGREDIENT_LOOKUP);
    expect(perServing.calories * recipe.servings).toBeCloseTo(total.calories, 5);
  });

  it('never invents a negative or NaN figure across the whole starter catalog', () => {
    for (const recipe of RECIPE_CATALOG) {
      const totals = computeRecipeTotals(recipe, INGREDIENT_LOOKUP);
      for (const value of Object.values(totals)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('has every ingredient reference resolve to a catalog entry', () => {
    for (const recipe of RECIPE_CATALOG) {
      for (const ri of recipe.ingredients) {
        expect(INGREDIENT_LOOKUP[ri.ingredientId], `${recipe.id} -> ${ri.ingredientId}`).toBeDefined();
      }
    }
  });
});

describe('ingredient consolidation', () => {
  it('combines the same ingredient across two recipes into one gram total', () => {
    const consolidated = consolidateIngredients(
      [
        { ingredient: { ingredientId: 'chicken-breast', quantity: { amount: 340, unit: 'g' } } },
        { ingredient: { ingredientId: 'chicken-breast', quantity: { amount: 6, unit: 'oz' } } },
        { ingredient: { ingredientId: 'white-rice-cooked', quantity: { amount: 1, unit: 'cup' } } },
      ],
      INGREDIENT_LOOKUP,
    );

    const chicken = consolidated.find((line) => line.ingredientId === 'chicken-breast');
    expect(chicken?.totalGrams).toBeCloseTo(340 + 6 * 28.3495, 3);
    expect(consolidated).toHaveLength(2);
  });

  it('applies a per-line multiplier before summing', () => {
    const consolidated = consolidateIngredients(
      [{ ingredient: { ingredientId: 'white-rice-cooked', quantity: { amount: 1, unit: 'cup' } }, multiplier: 3 }],
      INGREDIENT_LOOKUP,
    );
    expect(consolidated[0]!.totalGrams).toBeCloseTo(158 * 3, 3);
  });
});
