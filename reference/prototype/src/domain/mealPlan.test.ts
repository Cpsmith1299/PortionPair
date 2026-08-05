import { addAvoidFood, DEFAULT_PREFERENCES, makeWeeklyPlan, validatePreferences } from './mealPlan';

describe('meal plan business rules', () => {
  it('requires a dietary preference and viable two-person budget', () => {
    expect(validatePreferences({ ...DEFAULT_PREFERENCES, diets: [], weeklyBudget: 45 })).toEqual({
      diets: 'Choose at least one dietary preference so we can shape the plan.',
      weeklyBudget: 'Set a budget of at least $50 for two people.',
    });
  });

  it('normalizes food input and rejects duplicates case-insensitively', () => {
    expect(addAvoidFood(['Mushrooms'], '  shellfish  ')).toEqual({ foods: ['Mushrooms', 'shellfish'] });
    expect(addAvoidFood(['Mushrooms'], 'mushrooms')).toEqual({ foods: ['Mushrooms'], error: 'mushrooms is already on the list.' });
  });

  it('fills the days beyond the requested dinner count with leftovers', () => {
    const plan = makeWeeklyPlan({ ...DEFAULT_PREFERENCES, dinners: 3 });
    expect(plan.meals).toHaveLength(7);
    expect(plan.meals.filter((meal) => meal.name === 'Leftovers night')).toHaveLength(4);
    expect(makeWeeklyPlan({ ...DEFAULT_PREFERENCES, dinners: 7 }).meals.filter((meal) => meal.name === 'Leftovers night')).toHaveLength(0);
  });
});
