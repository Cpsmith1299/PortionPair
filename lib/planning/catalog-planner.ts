import { sortedMembers } from '@/domain/households/types';
import type { NutritionTargetsByMember } from '@/domain/households/nutrition-targets';
import { DEFAULT_MEMBER_TARGET, toDinnerTarget } from '@/domain/households/nutrition-targets';
import { PlanGenerationError, type Planner, type PlannerInput } from '@/domain/meal-plans/planner';
import { DAYS_IN_WEEK, type MemberPortion, type PlannedMeal, type WeeklyPlan } from '@/domain/meal-plans/types';
import { buildWeekDays, formatWeekLabel, startOfWeek, toIsoDate } from '@/domain/meal-plans/week';
import { NUTRITION_ENGINE_VERSION } from '@/domain/nutrition/types';
import { filterEligibleRecipes } from '@/domain/recipes/eligibility';
import { INGREDIENT_LOOKUP } from '@/domain/recipes/ingredients';
import { totalMinutes, type Recipe } from '@/domain/recipes/types';
import { formatPortionSummary } from '@/domain/recipes/portion-text';
import { scalePortionForMember } from '@/domain/portions/scale';
import { RECIPE_CATALOG } from '@/domain/recipes/catalog';

const MS_PER_WEEK = 7 * 86_400_000;

const LEFTOVERS_MEAL = { name: 'Leftovers night', time: 10 } as const;

/**
 * The real-catalog planner for Milestone 4's first slice: eligible recipes
 * (diet + avoided foods) from the verified catalog, personalized portions
 * from each member's real nutrition target, deterministic day-to-day meal
 * selection.
 *
 * "Deterministic" is a deliberate scope cut, not a placeholder masquerading
 * as done: CLAUDE.md §15 Milestone 4 calls for a *structured AI proposal*
 * from this same eligible-recipe pool. That step drops in behind this same
 * `Planner` interface without touching persistence, portions, or any
 * presentation code — exactly the seam Milestone 1 built this interface for.
 */
export class CatalogPlanner implements Planner {
  constructor(private readonly catalog: Recipe[] = RECIPE_CATALOG) {}

  async generateWeeklyPlan(input: PlannerInput & { memberTargets?: NutritionTargetsByMember }): Promise<WeeklyPlan> {
    const { preferences, household, weekStart, memberTargets = {} } = input;
    const monday = startOfWeek(weekStart);
    const days = buildWeekDays(monday);
    const members = sortedMembers(household);

    const eligible = filterEligibleRecipes(this.catalog, preferences);
    if (eligible.length === 0) {
      throw new PlanGenerationError(
        'No recipes in the catalog match every dietary preference and avoided food at once. Try relaxing one.',
      );
    }

    // Rotates which recipe a given day-of-week lands on from one week to the
    // next, so a household regenerating the same week doesn't see an
    // identical plan every time, while still being pure/deterministic (no
    // clock reads beyond the `weekStart` already passed in).
    const weekOffset = Math.floor(monday.getTime() / MS_PER_WEEK);

    const meals: PlannedMeal[] = days.map((day) => {
      const isCooked = day.dayIndex < preferences.dinners;

      if (!isCooked) {
        return {
          id: `leftovers-${day.isoDate}`,
          ...day,
          name: LEFTOVERS_MEAL.name,
          time: LEFTOVERS_MEAL.time,
          kind: 'leftovers',
          portions: [],
          recipeId: null,
        };
      }

      const recipe = eligible[(weekOffset + day.dayIndex) % eligible.length]!;
      const portions = members.map((member) =>
        buildMemberPortion(recipe, member.id, memberTargets[member.id]),
      );

      return {
        id: `${recipe.id}-${day.isoDate}`,
        ...day,
        name: recipe.name,
        time: totalMinutes(recipe),
        kind: 'cooked',
        imageKey: recipe.imageKey,
        imageAlt: recipe.imageAlt,
        tags: recipe.dietaryTags,
        costPerServing: recipe.costPerServing,
        portions,
        recipeId: recipe.id,
      };
    });

    if (meals.length !== DAYS_IN_WEEK) {
      throw new Error(`Expected ${DAYS_IN_WEEK} days, built ${meals.length}.`);
    }

    return {
      weekStart: toIsoDate(monday),
      weekLabel: formatWeekLabel(monday),
      preferences,
      household,
      meals,
    };
  }
}

export function buildMemberPortion(
  recipe: Recipe,
  memberId: string,
  target: NutritionTargetsByMember[string] | undefined,
): MemberPortion {
  const dailyTarget = target ?? { memberId, ...DEFAULT_MEMBER_TARGET };
  const dinnerTarget = toDinnerTarget(dailyTarget);

  const result = scalePortionForMember(recipe, INGREDIENT_LOOKUP, {
    memberId,
    calories: dinnerTarget.calories,
    proteinG: dinnerTarget.proteinG,
  });

  return {
    memberId,
    portion: formatPortionSummary(result.scaledIngredients, INGREDIENT_LOOKUP),
    calories: Math.round(result.totals.calories),
    protein: Math.round(result.totals.proteinG),
    scaledIngredients: result.scaledIngredients,
    warnings: result.warnings,
  };
}

/** Calculation-version tag stored alongside each persisted portion (CLAUDE.md §9). */
export const PLANNER_CALCULATION_VERSION = NUTRITION_ENGINE_VERSION;

export const catalogPlanner = new CatalogPlanner();
