import { z } from 'zod';
import {
  BUDGET_RANGE,
  COOK_TIMES,
  DIET_OPTIONS,
  DINNER_RANGE,
  type CookTime,
  type PlanPreferences,
} from '@/domain/meal-plans/types';

/**
 * The annotation is the guard: if `COOK_TIMES` and this union ever drift apart,
 * TypeScript fails the build rather than letting an unvalidated value through.
 */
const cookTimeSchema: z.ZodType<CookTime> = z.union([
  z.literal(20),
  z.literal(30),
  z.literal(45),
  z.literal(60),
]);

/** Schema validation at the server boundary (CLAUDE.md §7, §17). */
export const planPreferencesSchema: z.ZodType<PlanPreferences> = z.object({
  diets: z.array(z.enum(DIET_OPTIONS)).max(DIET_OPTIONS.length),
  avoidFoods: z
    .array(z.string().trim().min(1, 'Enter a food name first.').max(60))
    .max(50, 'That is more foods than we can plan around.'),
  weeklyBudget: z.number().int().min(BUDGET_RANGE.min).max(BUDGET_RANGE.max),
  dinners: z.number().int().min(DINNER_RANGE.min).max(DINNER_RANGE.max),
  maxCookTime: cookTimeSchema,
});

export function parsePlanPreferences(input: unknown): PlanPreferences {
  return planPreferencesSchema.parse(input);
}

export { COOK_TIMES };
