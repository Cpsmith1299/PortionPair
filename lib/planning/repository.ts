import type { SupabaseClient } from '@supabase/supabase-js';
import type { Household, HouseholdMember } from '@/domain/households/types';
import { sortedMembers } from '@/domain/households/types';
import type { PlanPreferences, PlannedMeal, WeeklyPlan } from '@/domain/meal-plans/types';
import { buildWeekDays, formatWeekLabel, toIsoDate } from '@/domain/meal-plans/week';
import type { ScaledIngredientLine } from '@/domain/portions/types';
import { RECIPE_LOOKUP } from '@/domain/recipes/catalog';
import { totalMinutes, type Recipe } from '@/domain/recipes/types';
import type { Database, Json } from '@/lib/supabase/types';
import { PLANNER_CALCULATION_VERSION } from './catalog-planner';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Server-only persistence for the real planning flow (Milestone 4, CLAUDE.md
 * §9 "Plans and portions"). Recipe content (name, time, tags, instructions,
 * ingredients) is never read back from the database here — `domain/recipes/
 * catalog.ts` is the source of truth for that, both at generation time and
 * when re-hydrating a saved plan, so a plan row only needs to remember which
 * recipe id it used.
 */

interface PersistPortionInput {
  household_member_id: string;
  portion_summary: string;
  calories: number;
  protein_g: number;
  carbs_g: number | null;
  fat_g: number | null;
  scaled_ingredients: ScaledIngredientLine[];
  warnings: string[];
  calculation_version: string;
}

function toPortionPayload(meal: PlannedMeal): PersistPortionInput[] {
  return meal.portions.map((portion) => ({
    household_member_id: portion.memberId,
    portion_summary: portion.portion,
    calories: portion.calories,
    protein_g: portion.protein,
    carbs_g: null,
    fat_g: null,
    scaled_ingredients: portion.scaledIngredients ?? [],
    warnings: portion.warnings ?? [],
    calculation_version: PLANNER_CALCULATION_VERSION,
  }));
}

/** Saves a freshly generated plan, replacing anything previously saved for that household+week. */
export async function persistWeeklyPlan(
  supabase: TypedSupabaseClient,
  household: Household,
  plan: WeeklyPlan,
): Promise<WeeklyPlan> {
  const estimatedCost = plan.meals.reduce((sum, meal) => sum + (meal.costPerServing ?? 0), 0);

  const { data: planId, error } = await supabase.rpc('upsert_meal_plan', {
    p_household_id: household.id,
    p_week_start: plan.weekStart,
    p_source: 'catalog',
    p_preferences: plan.preferences as unknown as Json,
    p_estimated_cost: estimatedCost || null,
    p_items: plan.meals.map((meal) => ({
      day_index: meal.dayIndex,
      recipe_id: meal.recipeId ?? null,
      kind: meal.kind,
      portions: toPortionPayload(meal),
    })) as unknown as Json,
  });
  if (error) throw error;
  if (!planId) throw new Error('upsert_meal_plan did not return a plan id.');

  const persisted = await getMealPlanById(supabase, household, planId);
  if (!persisted) throw new Error('Plan was saved but could not be re-read.');
  return persisted;
}

async function getMealPlanById(
  supabase: TypedSupabaseClient,
  household: Household,
  mealPlanId: string,
): Promise<WeeklyPlan | null> {
  const { data: planRow, error: planError } = await supabase
    .from('meal_plans')
    .select('id, week_start, preferences_snapshot')
    .eq('id', mealPlanId)
    .maybeSingle();
  if (planError) throw planError;
  if (!planRow) return null;

  return hydratePlan(supabase, household, planRow);
}

/** The household's most recently generated active plan, if any. */
export async function getMostRecentMealPlan(
  supabase: TypedSupabaseClient,
  household: Household,
): Promise<WeeklyPlan | null> {
  const { data: planRow, error } = await supabase
    .from('meal_plans')
    .select('id, week_start, preferences_snapshot')
    .eq('household_id', household.id)
    .eq('status', 'active')
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!planRow) return null;

  return hydratePlan(supabase, household, planRow);
}

async function hydratePlan(
  supabase: TypedSupabaseClient,
  household: Household,
  planRow: { id: string; week_start: string; preferences_snapshot: Json },
): Promise<WeeklyPlan> {
  const { data: itemRows, error: itemsError } = await supabase
    .from('meal_plan_items')
    .select('id, day_index, recipe_id, kind')
    .eq('meal_plan_id', planRow.id)
    .order('day_index');
  if (itemsError) throw itemsError;

  const itemIds = (itemRows ?? []).map((item) => item.id);
  const { data: portionRows, error: portionsError } =
    itemIds.length > 0
      ? await supabase
          .from('member_portions')
          .select('meal_plan_item_id, household_member_id, portion_summary, calories, protein_g, scaled_ingredients, warnings')
          .in('meal_plan_item_id', itemIds)
      : { data: [], error: null };
  if (portionsError) throw portionsError;

  const portionsByItem = new Map<string, typeof portionRows>();
  for (const portion of portionRows ?? []) {
    const list = portionsByItem.get(portion.meal_plan_item_id) ?? [];
    list.push(portion);
    portionsByItem.set(portion.meal_plan_item_id, list);
  }

  const weekStartDate = new Date(`${planRow.week_start}T00:00:00.000Z`);
  const days = buildWeekDays(weekStartDate);
  const itemsByDay = new Map((itemRows ?? []).map((item) => [item.day_index, item]));

  const meals: PlannedMeal[] = days.map((day) => {
    const item = itemsByDay.get(day.dayIndex);
    if (!item || item.kind === 'leftovers' || !item.recipe_id) {
      return {
        id: item ? item.id : `leftovers-${day.isoDate}`,
        ...day,
        name: 'Leftovers night',
        time: 10,
        kind: 'leftovers',
        portions: [],
        mealPlanItemId: item?.id,
        recipeId: null,
      };
    }

    const recipe = RECIPE_LOOKUP[item.recipe_id];
    const portions = (portionsByItem.get(item.id) ?? []).map((row) => ({
      memberId: row.household_member_id,
      portion: row.portion_summary,
      calories: Math.round(row.calories),
      protein: Math.round(row.protein_g),
      scaledIngredients: (row.scaled_ingredients as unknown as ScaledIngredientLine[]) ?? [],
      warnings: row.warnings ?? [],
    }));

    return {
      id: item.id,
      ...day,
      name: recipe?.name ?? 'Recipe unavailable',
      time: recipe ? totalMinutes(recipe) : 0,
      kind: 'cooked',
      imageKey: recipe?.imageKey,
      imageAlt: recipe?.imageAlt,
      tags: recipe?.dietaryTags,
      costPerServing: recipe?.costPerServing,
      portions,
      mealPlanItemId: item.id,
      recipeId: item.recipe_id,
    };
  });

  return {
    id: planRow.id,
    weekStart: toIsoDate(weekStartDate),
    weekLabel: formatWeekLabel(weekStartDate),
    preferences: planRow.preferences_snapshot as unknown as PlanPreferences,
    household: { ...household, members: sortedMembers(household) },
    meals,
  };
}

export interface MealDetailsPortion {
  member: HouseholdMember;
  summary: string;
  calories: number;
  proteinG: number;
  scaledIngredients: ScaledIngredientLine[];
  warnings: string[];
}

export interface MealPlanItemDetails {
  mealPlanItemId: string;
  dayLabel: string;
  dateLabel: string;
  recipe: Recipe;
  portions: MealDetailsPortion[];
}

/** Everything the meal-details/cooking view needs for one plan slot. RLS scopes this to the caller's own household. */
export async function getMealPlanItemDetails(
  supabase: TypedSupabaseClient,
  household: Household,
  mealPlanItemId: string,
): Promise<MealPlanItemDetails | null> {
  const { data: item, error: itemError } = await supabase
    .from('meal_plan_items')
    .select('id, meal_plan_id, day_index, recipe_id, kind')
    .eq('id', mealPlanItemId)
    .maybeSingle();
  if (itemError) throw itemError;
  if (!item || item.kind !== 'cooked' || !item.recipe_id) return null;

  const recipe = RECIPE_LOOKUP[item.recipe_id];
  if (!recipe) return null;

  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .select('week_start')
    .eq('id', item.meal_plan_id)
    .maybeSingle();
  if (planError) throw planError;
  if (!plan) return null;

  const { data: portionRows, error: portionsError } = await supabase
    .from('member_portions')
    .select('household_member_id, portion_summary, calories, protein_g, scaled_ingredients, warnings')
    .eq('meal_plan_item_id', item.id);
  if (portionsError) throw portionsError;

  const membersById = new Map(sortedMembers(household).map((member) => [member.id, member]));
  const portions: MealDetailsPortion[] = (portionRows ?? [])
    .map((row) => {
      const member = membersById.get(row.household_member_id);
      if (!member) return null;
      return {
        member,
        summary: row.portion_summary,
        calories: Math.round(row.calories),
        proteinG: Math.round(row.protein_g),
        scaledIngredients: (row.scaled_ingredients as unknown as ScaledIngredientLine[]) ?? [],
        warnings: row.warnings ?? [],
      };
    })
    .filter((portion): portion is MealDetailsPortion => portion !== null)
    .sort((a, b) => a.member.displayOrder - b.member.displayOrder);

  const weekStartDate = new Date(`${plan.week_start}T00:00:00.000Z`);
  const day = buildWeekDays(weekStartDate)[item.day_index];

  return {
    mealPlanItemId: item.id,
    dayLabel: day?.dayLabel ?? '',
    dateLabel: day?.dateLabel ?? '',
    recipe,
    portions,
  };
}

export interface MealPlanItemContext {
  mealPlanItemId: string;
  mealPlanId: string;
  recipeId: string | null;
  preferences: PlanPreferences;
}

/** RLS scopes this to the caller's own household — a foreign id simply returns null. */
export async function getMealPlanItemContext(
  supabase: TypedSupabaseClient,
  mealPlanItemId: string,
): Promise<MealPlanItemContext | null> {
  const { data: item, error: itemError } = await supabase
    .from('meal_plan_items')
    .select('id, meal_plan_id, recipe_id')
    .eq('id', mealPlanItemId)
    .maybeSingle();
  if (itemError) throw itemError;
  if (!item) return null;

  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .select('preferences_snapshot')
    .eq('id', item.meal_plan_id)
    .maybeSingle();
  if (planError) throw planError;
  if (!plan) return null;

  return {
    mealPlanItemId: item.id,
    mealPlanId: item.meal_plan_id,
    recipeId: item.recipe_id,
    preferences: plan.preferences_snapshot as unknown as PlanPreferences,
  };
}

export async function replaceMealPlanItem(
  supabase: TypedSupabaseClient,
  mealPlanItemId: string,
  recipeId: string,
  portions: PlannedMeal['portions'],
): Promise<void> {
  const { error } = await supabase.rpc('replace_meal_plan_item', {
    p_item_id: mealPlanItemId,
    p_recipe_id: recipeId,
    p_kind: 'cooked',
    p_portions: portions.map((portion) => ({
      household_member_id: portion.memberId,
      portion_summary: portion.portion,
      calories: portion.calories,
      protein_g: portion.protein,
      carbs_g: null,
      fat_g: null,
      scaled_ingredients: portion.scaledIngredients ?? [],
      warnings: portion.warnings ?? [],
      calculation_version: PLANNER_CALCULATION_VERSION,
    })) as unknown as Json,
  });
  if (error) throw error;
}
