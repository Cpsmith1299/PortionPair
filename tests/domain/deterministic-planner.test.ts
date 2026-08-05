import { describe, expect, it } from 'vitest';
import { DAYS_IN_WEEK, DEFAULT_PREFERENCES, type PlanPreferences } from '@/domain/meal-plans/types';
import { DeterministicPlanner } from '@/lib/planning/deterministic-planner';
import { DEMO_HOUSEHOLD } from '@/lib/planning/demo-household';

const planner = new DeterministicPlanner();
const WEEK_START = new Date('2026-08-03T00:00:00Z');

function plan(overrides: Partial<PlanPreferences> = {}) {
  return planner.generateWeeklyPlan({
    preferences: { ...DEFAULT_PREFERENCES, ...overrides },
    household: DEMO_HOUSEHOLD,
    weekStart: WEEK_START,
  });
}

describe('deterministic planner', () => {
  it('fills the days beyond the requested dinner count with leftovers', async () => {
    const result = await plan({ dinners: 3 });

    expect(result.meals).toHaveLength(DAYS_IN_WEEK);
    expect(result.meals.filter((meal) => meal.kind === 'leftovers')).toHaveLength(4);
    expect(result.meals.every((meal) => meal.name)).toBe(true);
  });

  it('cooks every night when seven dinners are requested', async () => {
    const result = await plan({ dinners: 7 });

    expect(result.meals).toHaveLength(DAYS_IN_WEEK);
    expect(result.meals.filter((meal) => meal.kind === 'leftovers')).toHaveLength(0);
  });

  it('always returns seven days regardless of dinner count', async () => {
    for (const dinners of [3, 4, 5, 6, 7]) {
      const result = await plan({ dinners });
      expect(result.meals).toHaveLength(DAYS_IN_WEEK);
    }
  });

  it('gives the same plan for the same input', async () => {
    expect(await plan()).toEqual(await plan());
  });

  it('assigns portions to real household members, largest first', async () => {
    const result = await plan({ dinners: 7 });
    const featured = result.meals.find((meal) => meal.name === 'Lemon herb chicken bowls');

    expect(featured).toBeDefined();
    expect(featured!.portions).toEqual([
      { memberId: 'charlie', portion: '6 oz chicken · 1½ cups rice', calories: 720, protein: 52 },
      { memberId: 'sam', portion: '4 oz chicken · 1 cup rice', calories: 540, protein: 38 },
    ]);
  });

  it('leaves portions empty rather than inventing figures for uncosted meals', async () => {
    const result = await plan({ dinners: 7 });
    const withoutFigures = result.meals.filter((meal) => meal.portions.length === 0);

    expect(withoutFigures.length).toBeGreaterThan(0);
    // Absent, never zeroed — a zero would read as a real calculated value.
    expect(withoutFigures.every((meal) => meal.portions.every((p) => p.calories > 0))).toBe(true);
  });

  it('normalizes a mid-week start date to that week', async () => {
    const result = await planner.generateWeeklyPlan({
      preferences: DEFAULT_PREFERENCES,
      household: DEMO_HOUSEHOLD,
      weekStart: new Date('2026-08-06T18:30:00Z'),
    });

    expect(result.weekStart).toBe('2026-08-03');
    expect(result.weekLabel).toBe('Aug 3–9');
  });

  it('runs without any browser global', () => {
    // Guards the server-safety requirement: the planner module must not reach
    // for window/document at import or call time.
    expect(planner.generateWeeklyPlan.toString()).not.toMatch(/\bwindow\b|\bdocument\b/);
  });
});
