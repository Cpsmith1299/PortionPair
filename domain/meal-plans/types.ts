import type { Household } from '@/domain/households/types';

export const DIET_OPTIONS = [
  'Balanced',
  'High protein',
  'Vegetarian',
  'Gluten-free',
  'Low-carb',
  'Dairy-free',
] as const;

export const COOK_TIMES = [20, 30, 45, 60] as const;

export type DietOption = (typeof DIET_OPTIONS)[number];
export type CookTime = (typeof COOK_TIMES)[number];

/** Inclusive bounds for the household setup controls. */
export const DINNER_RANGE = { min: 3, max: 7 } as const;
export const BUDGET_RANGE = { min: 40, max: 200, step: 5 } as const;
/** Below this a two-person week is not realistically shoppable. */
export const MIN_VIABLE_BUDGET = 50;

/** The weekly view always covers seven days (CLAUDE.md §3). */
export const DAYS_IN_WEEK = 7;

export interface PlanPreferences {
  diets: DietOption[];
  avoidFoods: string[];
  weeklyBudget: number;
  dinners: number;
  maxCookTime: CookTime;
}

export interface PlanValidationErrors {
  diets?: string;
  weeklyBudget?: string;
}

/**
 * A member's share of one meal. `portion` is the quantity-first summary the UI
 * leads with; calories and protein are the secondary, progressively-disclosed
 * detail (CLAUDE.md §11). All values are estimates.
 */
export interface MemberPortion {
  memberId: string;
  portion: string;
  calories: number;
  protein: number;
}

export type MealKind = 'cooked' | 'leftovers';

export interface PlannedMeal {
  id: string;
  /** 0 = first day of the plan week. */
  dayIndex: number;
  dayLabel: string;
  dateLabel: string;
  isoDate: string;
  name: string;
  /** Active cooking time in minutes. */
  time: number;
  kind: MealKind;
  imageKey?: string;
  imageAlt?: string;
  tags?: string[];
  costPerServing?: number;
  portions: MemberPortion[];
}

export interface WeeklyPlan {
  weekStart: string;
  weekLabel: string;
  preferences: PlanPreferences;
  household: Household;
  /** Always `DAYS_IN_WEEK` entries. */
  meals: PlannedMeal[];
}

export const DEFAULT_PREFERENCES: PlanPreferences = {
  diets: ['Balanced', 'Gluten-free'],
  avoidFoods: ['Mushrooms', 'Cilantro', 'Blue cheese'],
  weeklyBudget: 90,
  dinners: 5,
  maxCookTime: 30,
};
