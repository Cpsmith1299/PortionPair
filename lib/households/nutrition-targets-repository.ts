import type { SupabaseClient } from '@supabase/supabase-js';
import type { NutritionTargetsByMember } from '@/domain/households/nutrition-targets';
import type { Database } from '@/lib/supabase/types';

type TypedSupabaseClient = SupabaseClient<Database>;

/** Server-only data access for per-member nutrition targets (Milestone 4). */

export async function getNutritionTargetsForHousehold(
  supabase: TypedSupabaseClient,
  memberIds: string[],
): Promise<NutritionTargetsByMember> {
  if (memberIds.length === 0) return {};

  const { data, error } = await supabase
    .from('nutrition_targets')
    .select('household_member_id, calories, protein_g')
    .in('household_member_id', memberIds);
  if (error) throw error;

  return Object.fromEntries(
    (data ?? []).map((row) => [
      row.household_member_id,
      { memberId: row.household_member_id, calories: row.calories, proteinG: row.protein_g },
    ]),
  );
}

/** True once every listed member has a target — the gate for leaving the targets step. */
export function hasTargetForEveryMember(targets: NutritionTargetsByMember, memberIds: string[]): boolean {
  return memberIds.every((id) => targets[id] !== undefined);
}

export async function upsertNutritionTargets(
  supabase: TypedSupabaseClient,
  targets: { memberId: string; calories: number; proteinG: number }[],
): Promise<void> {
  if (targets.length === 0) return;

  const { error } = await supabase.from('nutrition_targets').upsert(
    targets.map((target) => ({
      household_member_id: target.memberId,
      calories: target.calories,
      protein_g: target.proteinG,
    })),
    { onConflict: 'household_member_id' },
  );
  if (error) throw error;
}
