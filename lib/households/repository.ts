import type { SupabaseClient } from '@supabase/supabase-js';
import type { Household } from '@/domain/households/types';
import type { CookTime, DietOption, PlanPreferences } from '@/domain/meal-plans/types';
import type { Database } from '@/lib/supabase/types';

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Server-only data access for households, members, and their preferences
 * snapshot. `domain/` stays pure (README.md "Architecture") — this is the
 * adapter layer that talks to Supabase on its behalf. Every function takes an
 * already-authenticated client; RLS (see the Milestone 2 migration) is the
 * real authorization boundary, this layer just shapes the data.
 *
 * There is no `createHouseholdWithMembers` here — the household and its two
 * members are provisioned by the `handle_new_user` trigger in the Milestone 2
 * migration, from the metadata `signUpAction` passes to `auth.signUp`. That
 * runs even when email confirmation delays the first session, which a
 * follow-up server action here could not do.
 */

export async function getHouseholdForUser(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<Household | null> {
  const { data: household, error } = await supabase
    .from('households')
    .select('id, name')
    .eq('owner_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!household) return null;

  const { data: members, error: membersError } = await supabase
    .from('household_members')
    .select('id, name, display_order, profile_color')
    .eq('household_id', household.id)
    .order('display_order');
  if (membersError) throw membersError;

  return {
    id: household.id,
    name: household.name,
    members: (members ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      displayOrder: member.display_order,
      profileColor: member.profile_color,
    })),
  };
}

export async function getHouseholdPreferences(
  supabase: TypedSupabaseClient,
  householdId: string,
): Promise<PlanPreferences | null> {
  const { data, error } = await supabase
    .from('household_preferences')
    .select('diets, avoid_foods, weekly_budget_cents, dinners, max_cook_time')
    .eq('household_id', householdId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    // Trusted round-trip of app-written data — validated once at write time
    // by `planPreferencesSchema` (lib/planning/schema.ts), not re-validated
    // on read.
    diets: data.diets as DietOption[],
    avoidFoods: data.avoid_foods,
    weeklyBudget: Math.round(data.weekly_budget_cents / 100),
    dinners: data.dinners,
    maxCookTime: data.max_cook_time as CookTime,
  };
}

export async function upsertHouseholdPreferences(
  supabase: TypedSupabaseClient,
  householdId: string,
  preferences: PlanPreferences,
): Promise<void> {
  const { error } = await supabase.from('household_preferences').upsert(
    {
      household_id: householdId,
      diets: preferences.diets,
      avoid_foods: preferences.avoidFoods,
      weekly_budget_cents: preferences.weeklyBudget * 100,
      dinners: preferences.dinners,
      max_cook_time: preferences.maxCookTime,
    },
    { onConflict: 'household_id' },
  );
  if (error) throw error;
}
