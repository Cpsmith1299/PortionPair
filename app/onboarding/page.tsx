import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DEFAULT_PREFERENCES } from '@/domain/meal-plans/types';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { getNutritionTargetsForHousehold, hasTargetForEveryMember } from '@/lib/households/nutrition-targets-repository';
import { getHouseholdForUser, getHouseholdPreferences } from '@/lib/households/repository';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Plan setup — PortionPair',
};

// Reads the authenticated user and their household on every request — never
// statically prerenderable, and must not be attempted at build time (when
// Supabase env vars are typically absent).
export const dynamic = 'force-dynamic';

/**
 * Server Component: loads the signed-in user's real household and any
 * persisted preferences before rendering the form (Milestone 2). Middleware
 * already guarantees a session here, but not a household — a household is
 * provisioned at signup, so a missing one means something went wrong
 * upstream rather than a normal state to render around.
 */
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const household = await getHouseholdForUser(supabase, user.id);
  if (!household) redirect('/login');

  // Step 3 needs every member's nutrition target to build real portions
  // (Milestone 4) — step 2 collects it and redirects back here.
  const memberIds = household.members.map((member) => member.id);
  const targets = await getNutritionTargetsForHousehold(supabase, memberIds);
  if (!hasTargetForEveryMember(targets, memberIds)) redirect('/onboarding/targets');

  const preferences = (await getHouseholdPreferences(supabase, household.id)) ?? DEFAULT_PREFERENCES;

  return <OnboardingScreen household={household} initialPreferences={preferences} />;
}
