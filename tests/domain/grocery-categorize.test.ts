import { describe, expect, it } from 'vitest';
import { categorizeIngredient } from '@/domain/groceries/categorize';
import { INGREDIENT_LOOKUP } from '@/domain/recipes/ingredients';

describe('grocery categorization', () => {
  it('never lets a whole-word substring match hijack an unrelated ingredient', () => {
    // Regression: "oil" as a plain substring also matches inside "broiled"
    // and "boiled", so every meat cooked that way landed in Pantry instead
    // of Protein.
    expect(categorizeIngredient(INGREDIENT_LOOKUP['ground-turkey-93']!, 'protein')).toBe('protein');
    expect(categorizeIngredient(INGREDIENT_LOOKUP['beef-flank-steak']!, 'protein')).toBe('protein');
    expect(categorizeIngredient(INGREDIENT_LOOKUP['pork-tenderloin-cooked']!, 'protein')).toBe('protein');
  });

  it('still recognizes an actual oil as pantry', () => {
    expect(categorizeIngredient(INGREDIENT_LOOKUP['olive-oil']!, 'other')).toBe('pantry');
  });

  it('overrides a canned protein to canned-goods rather than protein', () => {
    expect(categorizeIngredient(INGREDIENT_LOOKUP['black-beans-canned']!, 'protein')).toBe('canned-goods');
  });

  it('routes a dairy item to dairy-eggs regardless of its recipe role', () => {
    expect(categorizeIngredient(INGREDIENT_LOOKUP['heavy-cream']!, 'fat')).toBe('dairy-eggs');
    expect(categorizeIngredient(INGREDIENT_LOOKUP['parmesan-grated']!, 'protein')).toBe('dairy-eggs');
  });

  it('routes a starch carb to grains-bakery and a vegetable-like carb to produce', () => {
    expect(categorizeIngredient(INGREDIENT_LOOKUP['white-rice-cooked']!, 'carb')).toBe('grains-bakery');
    expect(categorizeIngredient(INGREDIENT_LOOKUP['sweet-potato-cooked']!, 'carb')).toBe('produce');
  });

  it('routes a composite sauce to spices-condiments', () => {
    expect(categorizeIngredient(INGREDIENT_LOOKUP['ginger-soy-glaze']!, 'fat')).toBe('spices-condiments');
  });
});
