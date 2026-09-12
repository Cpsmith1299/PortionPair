import type { SupabaseClient } from '@supabase/supabase-js';
import { combineScaledIngredientLines } from '@/domain/portions/aggregate';
import type { WeeklyPlan } from '@/domain/meal-plans/types';
import { categorizeIngredient, type GroceryCategory } from '@/domain/groceries/categorize';
import { formatIngredientQuantity } from '@/domain/recipes/portion-text';
import { INGREDIENT_LOOKUP } from '@/domain/recipes/ingredients';
import type { Database } from '@/lib/supabase/types';

type TypedSupabaseClient = SupabaseClient<Database>;

export interface GroceryItemView {
  id: string;
  ingredientId: string | null;
  canonicalName: string;
  category: GroceryCategory;
  displayQuantity: string | null;
  checked: boolean;
  pantry: boolean;
  isCustom: boolean;
}

/**
 * Grocery list for a plan (Milestone 4, CLAUDE.md §3). Built once from every
 * cooked meal's combined member ingredient lines, then persisted so
 * check-off/pantry state survives a revisit; rebuilt (derived rows only —
 * custom items survive) whenever `replace_meal_plan_item` invalidates it.
 */
export interface GroceryListResult {
  groceryListId: string;
  items: GroceryItemView[];
}

export async function getOrBuildGroceryList(
  supabase: TypedSupabaseClient,
  mealPlanId: string,
  plan: WeeklyPlan,
): Promise<GroceryListResult> {
  const { data: existingList, error: listError } = await supabase
    .from('grocery_lists')
    .select('id')
    .eq('meal_plan_id', mealPlanId)
    .maybeSingle();
  if (listError) throw listError;

  const groceryListId = existingList?.id ?? (await createGroceryList(supabase, mealPlanId));

  if (existingList) {
    const items = await fetchItems(supabase, groceryListId);
    if (items.length > 0) return { groceryListId, items };
    // A list can exist with zero derived rows only if every cooked night was
    // removed — fall through and (re)build from the current plan.
  }

  await buildDerivedItems(supabase, groceryListId, plan);
  return { groceryListId, items: await fetchItems(supabase, groceryListId) };
}

async function createGroceryList(supabase: TypedSupabaseClient, mealPlanId: string): Promise<string> {
  const { data, error } = await supabase
    .from('grocery_lists')
    .insert({ meal_plan_id: mealPlanId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function fetchItems(supabase: TypedSupabaseClient, groceryListId: string): Promise<GroceryItemView[]> {
  const { data, error } = await supabase
    .from('grocery_items')
    .select('id, ingredient_id, canonical_name, category, display_quantity, checked, pantry, is_custom')
    .eq('grocery_list_id', groceryListId)
    .order('category')
    .order('sort_order');
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    ingredientId: row.ingredient_id,
    canonicalName: row.canonical_name,
    category: row.category as GroceryCategory,
    displayQuantity: row.display_quantity,
    checked: row.checked,
    pantry: row.pantry,
    isCustom: row.is_custom,
  }));
}

async function buildDerivedItems(supabase: TypedSupabaseClient, groceryListId: string, plan: WeeklyPlan): Promise<void> {
  const lines = plan.meals
    .filter((meal) => meal.kind === 'cooked')
    .flatMap((meal) => meal.portions.map((portion) => portion.scaledIngredients ?? []));
  const combined = combineScaledIngredientLines(lines);

  // A regenerated/replaced plan may rebuild on top of stale derived rows.
  await supabase.from('grocery_items').delete().eq('grocery_list_id', groceryListId).eq('is_custom', false);

  if (combined.length === 0) return;

  const rows = combined.map((line, index) => {
    const ingredient = INGREDIENT_LOOKUP[line.ingredientId];
    return {
      grocery_list_id: groceryListId,
      ingredient_id: line.ingredientId,
      canonical_name: ingredient?.canonicalName ?? line.ingredientId,
      category: ingredient ? categorizeIngredient(ingredient, line.role) : 'other',
      total_grams: line.grams,
      display_quantity: ingredient ? formatIngredientQuantity(line.ingredientId, line.grams, INGREDIENT_LOOKUP) ?? null : null,
      sort_order: index,
    };
  });

  const { error } = await supabase.from('grocery_items').insert(rows);
  if (error) throw error;
}

export async function setGroceryItemState(
  supabase: TypedSupabaseClient,
  itemId: string,
  changes: { checked?: boolean; pantry?: boolean },
): Promise<void> {
  const { error } = await supabase.from('grocery_items').update(changes).eq('id', itemId);
  if (error) throw error;
}

export async function addCustomGroceryItem(
  supabase: TypedSupabaseClient,
  groceryListId: string,
  name: string,
): Promise<GroceryItemView> {
  const { data, error } = await supabase
    .from('grocery_items')
    .insert({
      grocery_list_id: groceryListId,
      canonical_name: name,
      category: 'other',
      is_custom: true,
      sort_order: 0,
    })
    .select('id, ingredient_id, canonical_name, category, display_quantity, checked, pantry, is_custom')
    .single();
  if (error) throw error;

  return {
    id: data.id,
    ingredientId: data.ingredient_id,
    canonicalName: data.canonical_name,
    category: data.category as GroceryCategory,
    displayQuantity: data.display_quantity,
    checked: data.checked,
    pantry: data.pantry,
    isCustom: data.is_custom,
  };
}

export async function removeGroceryItem(supabase: TypedSupabaseClient, itemId: string): Promise<void> {
  const { error } = await supabase.from('grocery_items').delete().eq('id', itemId);
  if (error) throw error;
}
