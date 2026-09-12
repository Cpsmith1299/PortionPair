import { describe, expect, it } from 'vitest';
import type { Household } from '@/domain/households/types';
import { DEFAULT_PREFERENCES } from '@/domain/meal-plans/types';
import { CatalogPlanner } from '@/lib/planning/catalog-planner';

const household: Household = {
  id: 'h1',
  name: 'Test household',
  members: [
    { id: 'alex', name: 'Alex', displayOrder: 0, profileColor: 'charlie' },
    { id: 'sam', name: 'Sam', displayOrder: 1, profileColor: 'sam' },
  ],
};

describe('CatalogPlanner', () => {
  it('gives two members with different daily targets genuinely different portions', async () => {
    // Regression: passing whole-day targets straight into the per-dinner
    // portion scaler forced both of these onto the same plausibility ceiling
    // and produced byte-identical portions — see CLAUDE.md §12's own worked
    // example (2,700/180 vs 1,800/120), which is exactly what caught it.
    const planner = new CatalogPlanner();
    const plan = await planner.generateWeeklyPlan({
      preferences: { ...DEFAULT_PREFERENCES, dinners: 7 },
      household,
      weekStart: new Date('2026-09-07T00:00:00Z'),
      memberTargets: {
        alex: { memberId: 'alex', calories: 2700, proteinG: 180 },
        sam: { memberId: 'sam', calories: 1800, proteinG: 120 },
      },
    });

    const cookedMeal = plan.meals.find((meal) => meal.kind === 'cooked')!;
    const alexPortion = cookedMeal.portions.find((p) => p.memberId === 'alex')!;
    const samPortion = cookedMeal.portions.find((p) => p.memberId === 'sam')!;

    expect(alexPortion.calories).toBeGreaterThan(samPortion.calories);
    expect(alexPortion.protein).toBeGreaterThan(samPortion.protein);
    expect(alexPortion.portion).not.toBe(samPortion.portion);
  });

  it('produces finite, positive totals for every member across a full week of varied recipes', async () => {
    // Not every recipe's baseline is generous enough to stretch cleanly to a
    // large target — an occasional plausibility clamp (with its warning) is
    // legitimate, not a bug. What must never happen is a non-finite or
    // non-positive total slipping through.
    const planner = new CatalogPlanner();
    const plan = await planner.generateWeeklyPlan({
      preferences: { ...DEFAULT_PREFERENCES, dinners: 7 },
      household,
      weekStart: new Date('2026-09-07T00:00:00Z'),
      memberTargets: {
        alex: { memberId: 'alex', calories: 2700, proteinG: 180 },
        sam: { memberId: 'sam', calories: 1800, proteinG: 120 },
      },
    });

    for (const meal of plan.meals.filter((m) => m.kind === 'cooked')) {
      for (const portion of meal.portions) {
        expect(Number.isFinite(portion.calories) && portion.calories > 0).toBe(true);
        expect(Number.isFinite(portion.protein) && portion.protein > 0).toBe(true);
      }
    }
  });
});
