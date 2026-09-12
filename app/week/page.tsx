import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignOutButton } from '@/features/auth/SignOutButton';
import { WeekScreen } from '@/features/week/WeekScreen';
import { getMostRecentMealPlan } from '@/lib/planning/repository';
import { getHouseholdForUser } from '@/lib/households/repository';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'This week’s plan — PortionPair',
};

// The plan is read fresh from Supabase on every visit (Milestone 4) — never
// statically prerenderable.
export const dynamic = 'force-dynamic';

/**
 * Server Component: loads the signed-in household's most recently generated
 * plan. `sessionStorage` (`features/planning/plan-store.tsx`) is gone — the
 * plan and its portions are persisted (`meal_plans` / `member_portions`), so
 * a refresh, a new device, or returning tomorrow all see the same week.
 */
export default async function WeekPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const household = await getHouseholdForUser(supabase, user.id);
  if (!household) redirect('/login');

  const plan = await getMostRecentMealPlan(supabase, household);
  if (!plan) redirect('/onboarding');

  return (
    <>
      <SignOutButton />
      <WeekScreen plan={plan} />
    </>
  );
}
