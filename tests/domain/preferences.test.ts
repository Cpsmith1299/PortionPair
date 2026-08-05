import { describe, expect, it } from 'vitest';
import { addAvoidFood, validatePreferences } from '@/domain/meal-plans/preferences';
import { DEFAULT_PREFERENCES } from '@/domain/meal-plans/types';

describe('plan preference rules', () => {
  it('requires a dietary preference and a viable two-person budget', () => {
    expect(validatePreferences({ ...DEFAULT_PREFERENCES, diets: [], weeklyBudget: 45 })).toEqual({
      diets: 'Choose at least one dietary preference so we can shape the plan.',
      weeklyBudget: 'Set a budget of at least $50 for two people.',
    });
  });

  it('accepts a complete set of preferences', () => {
    expect(validatePreferences(DEFAULT_PREFERENCES)).toEqual({});
  });

  it('normalizes food input and rejects duplicates case-insensitively', () => {
    expect(addAvoidFood(['Mushrooms'], '  shellfish  ')).toEqual({
      foods: ['Mushrooms', 'shellfish'],
    });

    expect(addAvoidFood(['Mushrooms'], 'mushrooms')).toEqual({
      foods: ['Mushrooms'],
      error: 'mushrooms is already on the list.',
    });
  });

  it('rejects a blank food without mutating the list', () => {
    const current = ['Mushrooms'];
    const result = addAvoidFood(current, '   ');

    expect(result.error).toBe('Enter a food name first.');
    expect(result.foods).toBe(current);
  });
});
