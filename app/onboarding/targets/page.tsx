import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DEFAULT_MEMBER_TARGET } from '@/domain/households/nutrition-targets';
import { NutritionTargetsScreen } from '@/features/onboarding/NutritionTargetsScreen';
import { getNutritionTargetsForHousehold } from '@/lib/households/nutrition-targets-repository';
import { getHouseholdForUser } from '@/lib/households/repository';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Nutrition targets — PortionPair',
};

export const dynamic = 'force-dynamic';

/** Step 2 of 3. Reachable directly (to edit targets later) as well as via the onboarding redirect. */
export default async function NutritionTargetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const household = await getHouseholdForUser(supabase, user.id);
  if (!household) redirect('/login');

  const memberIds = household.members.map((member) => member.id);
  const existing = await getNutritionTargetsForHousehold(supabase, memberIds);
  const initialTargets = Object.fromEntries(
    memberIds.map((id) => [id, existing[id] ?? DEFAULT_MEMBER_TARGET]),
  );

  return <NutritionTargetsScreen household={household} initialTargets={initialTargets} />;
}
