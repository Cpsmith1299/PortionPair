'use server';

import type { MemberNutritionTargetInput } from '@/domain/households/nutrition-targets';
import { upsertNutritionTargets } from '@/lib/households/nutrition-targets-repository';
import { nutritionTargetsInputSchema } from '@/lib/households/nutrition-targets-schema';
import { getHouseholdForUser } from '@/lib/households/repository';
import { createClient } from '@/lib/supabase/server';

export type SaveNutritionTargetsResult = { ok: true } | { ok: false; error: string };

const GENERIC_FAILURE = 'We couldn’t save these targets. Check your connection and try again.';

/**
 * Step 2 of 3's only entry point from the client. Every member id is
 * checked against the signed-in user's own household before anything is
 * written — the client only ever sends ids it already rendered, but a
 * mutation is validated and authorized on the server regardless (CLAUDE.md
 * §17), not trusted because the form happened to be honest.
 */
export async function saveNutritionTargetsAction(input: unknown): Promise<SaveNutritionTargetsResult> {
  const parsed = nutritionTargetsInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_FAILURE };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: GENERIC_FAILURE };

    const household = await getHouseholdForUser(supabase, user.id);
    if (!household) return { ok: false, error: GENERIC_FAILURE };

    const memberIds = new Set(household.members.map((member) => member.id));
    const targets: MemberNutritionTargetInput[] = parsed.data;
    if (!targets.every((target) => memberIds.has(target.memberId))) {
      return { ok: false, error: GENERIC_FAILURE };
    }

    await upsertNutritionTargets(supabase, targets);
    return { ok: true };
  } catch (cause) {
    console.error('[onboarding] saving nutrition targets failed', cause);
    return { ok: false, error: GENERIC_FAILURE };
  }
}
