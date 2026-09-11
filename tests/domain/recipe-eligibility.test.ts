import { describe, expect, it } from 'vitest';
import { RECIPE_CATALOG } from '@/domain/recipes/catalog';
import { filterEligibleRecipes, isRecipeEligible } from '@/domain/recipes/eligibility';

describe('recipe eligibility', () => {
  it('excludes a recipe whose allergen tags conflict with an avoided food', () => {
    const salmonRecipe = RECIPE_CATALOG.find((r) => r.id === 'miso-salmon-sesame-greens')!;
    expect(isRecipeEligible(salmonRecipe, { diets: [], avoidFoods: ['fish'] })).toBe(false);
    expect(isRecipeEligible(salmonRecipe, { diets: [], avoidFoods: ['shellfish'] })).toBe(true);
  });

  it('excludes a recipe that uses an avoided ingredient even without a matching allergen tag', () => {
    const beefRecipe = RECIPE_CATALOG.find((r) => r.id === 'ginger-beef-lettuce-bowls')!;
    expect(isRecipeEligible(beefRecipe, { diets: [], avoidFoods: ['carrots'] })).toBe(false);
  });

  it('requires at least one matching dietary tag when the household has diet preferences', () => {
    const tacos = RECIPE_CATALOG.find((r) => r.id === 'roasted-vegetable-tacos')!;
    expect(isRecipeEligible(tacos, { diets: ['Vegetarian'], avoidFoods: [] })).toBe(true);
    expect(isRecipeEligible(tacos, { diets: ['Low-carb'], avoidFoods: [] })).toBe(false);
  });

  it('filters a whole catalog down to what is actually eligible', () => {
    const eligible = filterEligibleRecipes(RECIPE_CATALOG, { diets: ['Vegetarian'], avoidFoods: [] });
    expect(eligible.every((r) => r.dietaryTags.includes('Vegetarian'))).toBe(true);
    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible.length).toBeLessThan(RECIPE_CATALOG.length);
  });
});
